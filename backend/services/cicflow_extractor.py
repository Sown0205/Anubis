import asyncio
import logging
import pandas as pd
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor
import multiprocessing
from functools import partial
import tempfile
import os

# CICFlowMeter imports
from cicflowmeter.flow_session import FlowSession, PacketDirection, get_packet_flow_key
from scapy.all import rdpcap, IP, TCP, UDP
from collections import defaultdict
import time

logger = logging.getLogger(__name__)

class CICFlowExtractor:
    """
    Enhanced CICFlowMeter feature extractor using the library directly
    with multi-processing support for better performance
    """
    
    def __init__(self):
        self.max_workers = min(multiprocessing.cpu_count(), 4)  # Limit CPU usage
        self.batch_size = 1000  # Process packets in batches
        
    async def extract_features_from_pcap(self, pcap_file: Path, output_dir: Path = None) -> pd.DataFrame:
        """
        Extract CICFlowMeter features from PCAP file using multi-processing
        """
        logger.info(f"Starting feature extraction from {pcap_file}")
        start_time = time.time()
        
        try:
            # Load packets
            packets = await self._load_packets_async(pcap_file)
            if not packets:
                raise Exception("No packets loaded from PCAP file")
            
            logger.info(f"Loaded {len(packets)} packets")
            
            # Group packets into flows
            flows = await self._group_packets_into_flows(packets)
            logger.info(f"Identified {len(flows)} flows")
            
            # Extract features from flows using multi-processing
            features_df = await self._extract_features_parallel(flows)
            
            # Save to CSV if output directory provided
            if output_dir and features_df is not None and not features_df.empty:
                output_dir.mkdir(exist_ok=True)
                csv_file = output_dir / f"cicflow_features_{int(time.time())}.csv"
                features_df.to_csv(csv_file, index=False)
                logger.info(f"Features saved to {csv_file}")
            
            end_time = time.time()
            logger.info(f"Feature extraction completed in {end_time - start_time:.2f} seconds")
            
            return features_df
            
        except Exception as e:
            logger.error(f"Feature extraction failed: {str(e)}")
            raise Exception(f"Feature extraction failed: {str(e)}")
    
    async def _load_packets_async(self, pcap_file: Path) -> List:
        """
        Load packets from PCAP file asynchronously
        """
        def load_packets(file_path):
            try:
                return rdpcap(str(file_path))
            except Exception as e:
                logger.error(f"Failed to load PCAP file: {str(e)}")
                return []
        
        loop = asyncio.get_event_loop()
        with ThreadPoolExecutor(max_workers=1) as executor:
            packets = await loop.run_in_executor(executor, load_packets, pcap_file)
        
        return packets
    
    async def _group_packets_into_flows(self, packets: List) -> Dict[str, List]:
        """
        Group packets into flows based on 5-tuple
        """
        def group_packets(packet_batch):
            flows = defaultdict(list)
            
            for packet in packet_batch:
                try:
                    if IP in packet:
                        # Extract 5-tuple
                        src_ip = packet[IP].src
                        dst_ip = packet[IP].dst
                        protocol = packet[IP].proto
                        
                        src_port = 0
                        dst_port = 0
                        
                        if TCP in packet:
                            src_port = packet[TCP].sport
                            dst_port = packet[TCP].dport
                        elif UDP in packet:
                            src_port = packet[UDP].sport
                            dst_port = packet[UDP].dport
                        
                        # Create flow key (bidirectional)
                        flow_key = self._create_flow_key(src_ip, dst_ip, src_port, dst_port, protocol)
                        flows[flow_key].append(packet)
                        
                except Exception as e:
                    logger.debug(f"Error processing packet: {str(e)}")
                    continue
            
            return flows
        
        # Process packets in batches to avoid memory issues
        all_flows = defaultdict(list)
        batch_size = self.batch_size
        
        for i in range(0, len(packets), batch_size):
            batch = packets[i:i + batch_size]
            batch_flows = group_packets(batch)
            
            # Merge flows
            for flow_key, flow_packets in batch_flows.items():
                all_flows[flow_key].extend(flow_packets)
        
        return dict(all_flows)
    
    def _create_flow_key(self, src_ip: str, dst_ip: str, src_port: int, dst_port: int, protocol: int) -> str:
        """
        Create a bidirectional flow key
        """
        # Sort to ensure bidirectional flows have the same key
        if (src_ip, src_port) < (dst_ip, dst_port):
            return f"{src_ip}_{src_port}_{dst_ip}_{dst_port}_{protocol}"
        else:
            return f"{dst_ip}_{dst_port}_{src_ip}_{src_port}_{protocol}"
    
    async def _extract_features_parallel(self, flows: Dict[str, List]) -> pd.DataFrame:
        """
        Extract features from flows using parallel processing
        """
        if not flows:
            return pd.DataFrame()
        
        # Split flows into chunks for parallel processing
        flow_items = list(flows.items())
        chunk_size = max(1, len(flow_items) // self.max_workers)
        flow_chunks = [flow_items[i:i + chunk_size] for i in range(0, len(flow_items), chunk_size)]
        
        logger.info(f"Processing {len(flows)} flows in {len(flow_chunks)} chunks using {self.max_workers} workers")
        
        # Process chunks in parallel
        loop = asyncio.get_event_loop()
        with ProcessPoolExecutor(max_workers=self.max_workers) as executor:
            tasks = [
                loop.run_in_executor(executor, self._process_flow_chunk, chunk)
                for chunk in flow_chunks
            ]
            
            chunk_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Combine results
        all_features = []
        for result in chunk_results:
            if isinstance(result, Exception):
                logger.error(f"Chunk processing failed: {str(result)}")
                continue
            
            if isinstance(result, list):
                all_features.extend(result)
        
        if not all_features:
            logger.warning("No features extracted from any flows")
            return pd.DataFrame()
        
        # Convert to DataFrame
        features_df = pd.DataFrame(all_features)
        logger.info(f"Extracted features for {len(features_df)} flows")
        
        return features_df
    
    @staticmethod
    def _process_flow_chunk(flow_chunk: List[Tuple[str, List]]) -> List[Dict[str, Any]]:
        """
        Process a chunk of flows to extract features (runs in separate process)
        """
        chunk_features = []
        
        for flow_key, packets in flow_chunk:
            try:
                features = CICFlowExtractor._extract_flow_features(flow_key, packets)
                if features:
                    chunk_features.append(features)
            except Exception as e:
                logger.debug(f"Failed to extract features for flow {flow_key}: {str(e)}")
                continue
        
        return chunk_features
    
    @staticmethod
    def _extract_flow_features(flow_key: str, packets: List) -> Optional[Dict[str, Any]]:
        """
        Extract CICFlowMeter features for a single flow
        """
        if not packets:
            return None
        
        try:
            # Parse flow key
            parts = flow_key.split('_')
            if len(parts) != 5:
                return None
            
            src_ip, src_port, dst_ip, dst_port, protocol = parts
            src_port, dst_port, protocol = int(src_port), int(dst_port), int(protocol)
            
            # Sort packets by timestamp
            packets = sorted(packets, key=lambda p: float(p.time))
            
            # Initialize flow statistics
            features = {
                'Flow ID': flow_key,
                'Src IP': src_ip,
                'Src Port': src_port,
                'Dst IP': dst_ip,
                'Dst Port': dst_port,
                'Protocol': protocol,
                'Timestamp': packets[0].time if packets else 0
            }
            
            # Extract basic flow features
            fwd_packets = []
            bwd_packets = []
            
            # Determine flow direction
            first_packet = packets[0]
            if IP in first_packet:
                flow_src_ip = first_packet[IP].src
                
                for packet in packets:
                    if IP in packet:
                        if packet[IP].src == flow_src_ip:
                            fwd_packets.append(packet)
                        else:
                            bwd_packets.append(packet)
            
            # Calculate flow duration
            if len(packets) > 1:
                flow_duration = float(packets[-1].time) - float(packets[0].time)
            else:
                flow_duration = 0.0
            
            features['Flow Duration'] = flow_duration * 1_000_000  # Convert to microseconds
            
            # Extract packet length features
            fwd_lengths = [len(p) for p in fwd_packets]
            bwd_lengths = [len(p) for p in bwd_packets]
            all_lengths = fwd_lengths + bwd_lengths
            
            # Forward packet features
            features['Tot Fwd Pkts'] = len(fwd_packets)
            features['TotLen Fwd Pkts'] = sum(fwd_lengths)
            features['Fwd Pkt Len Max'] = max(fwd_lengths) if fwd_lengths else 0
            features['Fwd Pkt Len Min'] = min(fwd_lengths) if fwd_lengths else 0
            features['Fwd Pkt Len Mean'] = np.mean(fwd_lengths) if fwd_lengths else 0
            features['Fwd Pkt Len Std'] = np.std(fwd_lengths) if len(fwd_lengths) > 1 else 0
            
            # Backward packet features
            features['Tot Bwd Pkts'] = len(bwd_packets)
            features['TotLen Bwd Pkts'] = sum(bwd_lengths)
            features['Bwd Pkt Len Max'] = max(bwd_lengths) if bwd_lengths else 0
            features['Bwd Pkt Len Min'] = min(bwd_lengths) if bwd_lengths else 0
            features['Bwd Pkt Len Mean'] = np.mean(bwd_lengths) if bwd_lengths else 0
            features['Bwd Pkt Len Std'] = np.std(bwd_lengths) if len(bwd_lengths) > 1 else 0
            
            # Overall packet length features
            features['Min Pkt Len'] = min(all_lengths) if all_lengths else 0
            features['Max Pkt Len'] = max(all_lengths) if all_lengths else 0
            features['Pkt Len Mean'] = np.mean(all_lengths) if all_lengths else 0
            features['Pkt Len Std'] = np.std(all_lengths) if len(all_lengths) > 1 else 0
            features['Pkt Len Var'] = np.var(all_lengths) if len(all_lengths) > 1 else 0
            
            # Flow rate features
            if flow_duration > 0:
                features['Flow Byts/s'] = sum(all_lengths) / flow_duration
                features['Flow Pkts/s'] = len(all_lengths) / flow_duration
            else:
                features['Flow Byts/s'] = 0
                features['Flow Pkts/s'] = 0
            
            # Inter-arrival time features
            if len(packets) > 1:
                iat_times = []
                for i in range(1, len(packets)):
                    iat = (float(packets[i].time) - float(packets[i-1].time)) * 1_000_000
                    iat_times.append(iat)
                
                features['Flow IAT Mean'] = np.mean(iat_times) if iat_times else 0
                features['Flow IAT Std'] = np.std(iat_times) if len(iat_times) > 1 else 0
                features['Flow IAT Max'] = max(iat_times) if iat_times else 0
                features['Flow IAT Min'] = min(iat_times) if iat_times else 0
            else:
                features.update({
                    'Flow IAT Mean': 0, 'Flow IAT Std': 0, 
                    'Flow IAT Max': 0, 'Flow IAT Min': 0
                })
            
            # Forward IAT features
            if len(fwd_packets) > 1:
                fwd_iat = []
                for i in range(1, len(fwd_packets)):
                    iat = (float(fwd_packets[i].time) - float(fwd_packets[i-1].time)) * 1_000_000
                    fwd_iat.append(iat)
                
                features['Fwd IAT Tot'] = sum(fwd_iat)
                features['Fwd IAT Mean'] = np.mean(fwd_iat) if fwd_iat else 0
                features['Fwd IAT Std'] = np.std(fwd_iat) if len(fwd_iat) > 1 else 0
                features['Fwd IAT Max'] = max(fwd_iat) if fwd_iat else 0
                features['Fwd IAT Min'] = min(fwd_iat) if fwd_iat else 0
            else:
                features.update({
                    'Fwd IAT Tot': 0, 'Fwd IAT Mean': 0, 'Fwd IAT Std': 0,
                    'Fwd IAT Max': 0, 'Fwd IAT Min': 0
                })
            
            # Backward IAT features
            if len(bwd_packets) > 1:
                bwd_iat = []
                for i in range(1, len(bwd_packets)):
                    iat = (float(bwd_packets[i].time) - float(bwd_packets[i-1].time)) * 1_000_000
                    bwd_iat.append(iat)
                
                features['Bwd IAT Tot'] = sum(bwd_iat)
                features['Bwd IAT Mean'] = np.mean(bwd_iat) if bwd_iat else 0
                features['Bwd IAT Std'] = np.std(bwd_iat) if len(bwd_iat) > 1 else 0
                features['Bwd IAT Max'] = max(bwd_iat) if bwd_iat else 0
                features['Bwd IAT Min'] = min(bwd_iat) if bwd_iat else 0
            else:
                features.update({
                    'Bwd IAT Tot': 0, 'Bwd IAT Mean': 0, 'Bwd IAT Std': 0,
                    'Bwd IAT Max': 0, 'Bwd IAT Min': 0
                })
            
            # TCP Flags (if TCP packets)
            tcp_flags = {'FIN': 0, 'PSH': 0, 'ACK': 0, 'URG': 0}
            for packet in packets:
                if TCP in packet:
                    tcp_layer = packet[TCP]
                    if tcp_layer.flags & 0x01:  # FIN
                        tcp_flags['FIN'] += 1
                    if tcp_layer.flags & 0x08:  # PSH
                        tcp_flags['PSH'] += 1
                    if tcp_layer.flags & 0x10:  # ACK
                        tcp_flags['ACK'] += 1
                    if tcp_layer.flags & 0x20:  # URG
                        tcp_flags['URG'] += 1
            
            features.update({
                'FIN Flag Cnt': tcp_flags['FIN'],
                'PSH Flag Cnt': tcp_flags['PSH'],
                'ACK Flag Cnt': tcp_flags['ACK'],
                'URG Flag Cnt': tcp_flags['URG']
            })
            
            # Additional features
            features['Pkt Size Avg'] = features['Pkt Len Mean']
            features['Bwd Seg Size Avg'] = features['Bwd Pkt Len Mean']
            
            # Idle features (simplified)
            features['Idle Mean'] = 0
            features['Idle Max'] = 0
            features['Idle Min'] = 0
            
            return features
            
        except Exception as e:
            logger.debug(f"Error extracting features for flow {flow_key}: {str(e)}")
            return None

# Global instance
cicflow_extractor = CICFlowExtractor()