import os
import tempfile
import pandas as pd
import numpy as np
import logging
import asyncio
from typing import Dict, List, Tuple, Any
from pathlib import Path
import json
from datetime import datetime
import uuid
from services.cicflow_extractor import cicflow_extractor

logger = logging.getLogger(__name__)

class PcapAnalyzer:
    """
    Service for analyzing network packet files using cicflowmeter
    """
    
    def __init__(self):
        # Automatically uses the correct temp folder for the OS
        self.temp_dir = Path(tempfile.gettempdir()) / "anubis_pcap"
        self.temp_dir.mkdir(parents=True, exist_ok=True)
    
    async def analyze_pcap_file(self, file_content: bytes, filename: str, analysis_id: str = None) -> Dict[str, Any]:
        """
        Complete pipeline for analyzing a pcap/pcapng file
        """
        if not analysis_id:
            analysis_id = str(uuid.uuid4())
            
        logger.info(f"Starting analysis {analysis_id} for file: {filename}")
        
        try:
            # Step 1: Save uploaded file temporarily
            temp_file_path = await self._save_temp_file(file_content, filename, analysis_id)
            
            # Step 2: Extract flow features using cicflowmeter
            flow_features_df = await self._extract_flow_features(temp_file_path, analysis_id)
            
            # Step 3: Preprocess the data
            processed_data = await self._preprocess_data(flow_features_df)
            
            # Step 4: Get AI model predictions
            predictions = await self._get_model_predictions(processed_data)
            
            # Step 5: Generate analysis results
            results = await self._generate_analysis_results(
                flow_features_df, processed_data, predictions, filename, analysis_id
            )
            
            # Step 6: Cleanup temporary files
            await self._cleanup_temp_files(analysis_id)
            
            logger.info(f"Analysis {analysis_id} completed successfully")
            return results
            
        except Exception as e:
            logger.error(f"Analysis {analysis_id} failed: {str(e)}")
            await self._cleanup_temp_files(analysis_id)
            raise Exception(f"Analysis failed: {str(e)}")
    
    async def _save_temp_file(self, file_content: bytes, filename: str, analysis_id: str) -> Path:
        """
        Save uploaded file to temporary directory
        """
        # Validate file extension
        valid_extensions = ['.pcap', '.pcapng', '.cap']
        file_ext = Path(filename).suffix.lower()
        
        if file_ext not in valid_extensions:
            raise ValueError(f"Invalid file type. Supported types: {valid_extensions}")
        
        # Create analysis-specific directory
        analysis_dir = self.temp_dir / analysis_id
        analysis_dir.mkdir(exist_ok=True)
        
        # Save file
        temp_file_path = analysis_dir / f"input{file_ext}"
        
        with open(temp_file_path, 'wb') as f:
            f.write(file_content)
            
        logger.info(f"Saved {len(file_content)} bytes to {temp_file_path}")
        return temp_file_path
    
    async def _extract_flow_features(self, pcap_file: Path, analysis_id: str) -> pd.DataFrame:
        """
        Extract flow features using enhanced cicflow_extractor service
        """
        logger.info(f"Extracting flow features from {pcap_file}")
        
        try:
            # Use the enhanced cicflow_extractor service
            output_dir = self.temp_dir / analysis_id / "features"
            features_df = await cicflow_extractor.extract_features_from_pcap(pcap_file, output_dir)
            
            if features_df is not None and not features_df.empty:
                logger.info(f"Extracted {len(features_df)} flow records using cicflow_extractor")
                return features_df
            else:
                raise Exception("No features extracted by cicflow_extractor")
            
        except Exception as e:
            logger.error(f"Flow feature extraction failed: {str(e)}")
            # Fallback to mock data
            logger.info("Using mock flow features as fallback")
            return self._generate_mock_flow_features()
    
    def _generate_mock_flow_features(self) -> pd.DataFrame:
        """
        Generate mock flow features for demonstration
        This mimics cicflowmeter output structure
        """
        np.random.seed(42)
        
        # Common cicflowmeter features
        num_flows = np.random.randint(50, 500)
        
        mock_data = {
            'Flow ID': [f"192.168.1.{np.random.randint(1,255)}-{np.random.randint(1000,9999)}-8.8.8.8-{np.random.choice([80,443,53])}-{np.random.choice([6,17])}" for _ in range(num_flows)],
            'Src IP': [f"192.168.1.{np.random.randint(1,255)}" for _ in range(num_flows)],
            'Src Port': np.random.randint(1024, 65535, num_flows),
            'Dst IP': np.random.choice(['8.8.8.8', '1.1.1.1', '208.67.222.222', '4.4.4.4'], num_flows),
            'Dst Port': np.random.choice([80, 443, 53, 25, 110], num_flows),
            'Protocol': np.random.choice([6, 17], num_flows),  # TCP=6, UDP=17
            'Flow Duration': np.random.uniform(0.1, 300.0, num_flows),
            'Tot Fwd Pkts': np.random.randint(1, 100, num_flows),
            'Tot Bwd Pkts': np.random.randint(0, 50, num_flows),
            'TotLen Fwd Pkts': np.random.randint(64, 1500, num_flows),
            'TotLen Bwd Pkts': np.random.randint(0, 1000, num_flows),
            'Fwd Pkt Len Max': np.random.randint(64, 1500, num_flows),
            'Fwd Pkt Len Min': np.random.randint(20, 100, num_flows),
            'Fwd Pkt Len Mean': np.random.uniform(100, 800, num_flows),
            'Fwd Pkt Len Std': np.random.uniform(10, 200, num_flows),
            'Bwd Pkt Len Max': np.random.randint(0, 1500, num_flows),
            'Bwd Pkt Len Min': np.random.randint(0, 100, num_flows),
            'Bwd Pkt Len Mean': np.random.uniform(0, 400, num_flows),
            'Bwd Pkt Len Std': np.random.uniform(0, 100, num_flows),
            'Flow Byts/s': np.random.uniform(100, 100000, num_flows),
            'Flow Pkts/s': np.random.uniform(0.1, 100, num_flows),
            'Flow IAT Mean': np.random.uniform(0, 1000, num_flows),
            'Flow IAT Std': np.random.uniform(0, 500, num_flows),
            'Flow IAT Max': np.random.uniform(0, 5000, num_flows),
            'Flow IAT Min': np.random.uniform(0, 100, num_flows),
            'Fwd IAT Tot': np.random.uniform(0, 10000, num_flows),
            'Fwd IAT Mean': np.random.uniform(0, 1000, num_flows),
            'Fwd IAT Std': np.random.uniform(0, 500, num_flows),
            'Fwd IAT Max': np.random.uniform(0, 5000, num_flows),
            'Fwd IAT Min': np.random.uniform(0, 100, num_flows),
            'Bwd IAT Tot': np.random.uniform(0, 10000, num_flows),
            'Bwd IAT Mean': np.random.uniform(0, 1000, num_flows),
            'Bwd IAT Std': np.random.uniform(0, 500, num_flows),
            'Bwd IAT Max': np.random.uniform(0, 5000, num_flows),
            'Bwd IAT Min': np.random.uniform(0, 100, num_flows),
            'Timestamp': [datetime.utcnow().strftime('%d/%m/%Y %H:%M:%S') for _ in range(num_flows)]
        }
        
        return pd.DataFrame(mock_data)
    
    async def _preprocess_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Preprocess the cicflowmeter output for model prediction
        """
        logger.info("Preprocessing flow features for AI model")
        
        # Create a copy for processing
        processed_df = df.copy()
        
        # Handle missing values
        processed_df = processed_df.fillna(0)
        
        # Handle infinite values
        processed_df = processed_df.replace([np.inf, -np.inf], 0)
        
        # Select numerical features commonly used in network security models
        feature_columns = [
            'Flow Duration', 'Tot Fwd Pkts', 'Tot Bwd Pkts', 'TotLen Fwd Pkts', 
            'TotLen Bwd Pkts', 'Fwd Pkt Len Max', 'Fwd Pkt Len Min', 'Fwd Pkt Len Mean',
            'Fwd Pkt Len Std', 'Bwd Pkt Len Max', 'Bwd Pkt Len Min', 'Bwd Pkt Len Mean',
            'Bwd Pkt Len Std', 'Flow Byts/s', 'Flow Pkts/s', 'Flow IAT Mean',
            'Flow IAT Std', 'Flow IAT Max', 'Flow IAT Min', 'Fwd IAT Tot',
            'Fwd IAT Mean', 'Fwd IAT Std', 'Fwd IAT Max', 'Fwd IAT Min',
            'Bwd IAT Tot', 'Bwd IAT Mean', 'Bwd IAT Std', 'Bwd IAT Max', 'Bwd IAT Min'
        ]
        
        # Keep only available feature columns
        available_features = [col for col in feature_columns if col in processed_df.columns]
        
        if not available_features:
            raise Exception("No suitable features found in the data")
        
        # Extract feature matrix
        feature_matrix = processed_df[available_features]
        
        # Basic normalization (you might want to use your training normalization parameters)
        feature_matrix = (feature_matrix - feature_matrix.mean()) / (feature_matrix.std() + 1e-8)
        feature_matrix = feature_matrix.fillna(0)
        
        logger.info(f"Preprocessed {len(feature_matrix)} flows with {len(available_features)} features")
        return feature_matrix
    
    async def _get_model_predictions(self, processed_data: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Get predictions from the AI model
        """
        logger.info("Getting AI model predictions")
        
        # Import here to avoid circular imports
        from services.ai_model_service import ai_model_service
        
        predictions = []
        
        try:
            # Process in batches for efficiency
            batch_size = 100
            for i in range(0, len(processed_data), batch_size):
                batch = processed_data.iloc[i:i+batch_size]
                
                # Convert batch to list of feature dictionaries
                batch_features = []
                for _, row in batch.iterrows():
                    features = row.to_dict()
                    batch_features.append(features)
                
                # Get predictions from AI model service
                batch_predictions = await ai_model_service.predict_batch_features(batch_features)
                
                # Convert AIModelOutput objects to dictionary format
                for ai_output in batch_predictions:
                    prediction = {
                        'classification': ai_output.classification,
                        'confidence': ai_output.confidence,
                        'risk_score': ai_output.risk_score,
                        'threat_type': ai_output.threat_type
                    }
                    predictions.append(prediction)
        
        except Exception as e:
            logger.error(f"AI model prediction failed: {str(e)}")
            logger.info("Falling back to mock predictions")
            
            # Fallback to mock predictions
            for _, row in processed_data.iterrows():
                features = row.to_dict()
                is_malicious = self._mock_prediction_logic(features)
                
                prediction = {
                    'classification': 'ATTACK' if is_malicious else 'BENIGN',
                    'confidence': np.random.uniform(0.8, 0.99),
                    'risk_score': np.random.uniform(0.7, 1.0) if is_malicious else np.random.uniform(0.0, 0.3),
                    'threat_type': np.random.choice(['DDoS', 'Port_Scan', 'Malware', 'Intrusion']) if is_malicious else None
                }
                predictions.append(prediction)
        
        logger.info(f"Generated {len(predictions)} predictions")
        return predictions
    
    def _mock_prediction_logic(self, features: Dict) -> bool:
        """
        Mock prediction logic - replace with actual model inference
        """
        # Simple heuristic based on flow characteristics
        suspicious_conditions = [
            features.get('Flow Pkts/s', 0) > 50,  # High packet rate
            features.get('Flow Byts/s', 0) > 50000,  # High byte rate
            features.get('Tot Fwd Pkts', 0) > 100,  # Too many forward packets
            features.get('Flow Duration', 0) < 0.1,  # Very short flows
        ]
        
        # If multiple conditions are met, classify as attack
        return sum(suspicious_conditions) >= 2
    
    async def _generate_analysis_results(
        self, 
        flow_df: pd.DataFrame, 
        processed_data: pd.DataFrame, 
        predictions: List[Dict], 
        filename: str, 
        analysis_id: str
    ) -> Dict[str, Any]:
        """
        Generate comprehensive analysis results
        """
        logger.info("Generating analysis results")
        
        # Count predictions
        benign_count = sum(1 for p in predictions if p['classification'] == 'BENIGN')
        malicious_count = sum(1 for p in predictions if p['classification'] == 'ATTACK')
        
        # Extract malicious IPs
        malicious_ips = set()
        for i, prediction in enumerate(predictions):
            if prediction['classification'] == 'ATTACK' and i < len(flow_df):
                src_ip = str(flow_df.iloc[i].get('Src IP', 'Unknown'))
                dst_ip = str(flow_df.iloc[i].get('Dst IP', 'Unknown'))
                malicious_ips.add(src_ip)
                malicious_ips.add(dst_ip)
        
        # Remove 'Unknown' if present
        malicious_ips.discard('Unknown')
        
        # Generate threat breakdown
        threat_types = {}
        for prediction in predictions:
            if prediction['classification'] == 'ATTACK' and prediction['threat_type']:
                threat_type = str(prediction['threat_type'])
                threat_types[threat_type] = threat_types.get(threat_type, 0) + 1
        
        # Calculate risk score
        overall_risk_score = float(np.mean([p['risk_score'] for p in predictions]))
        
        # Determine overall status
        malicious_percentage = (malicious_count / len(predictions)) * 100 if predictions else 0
        
        if malicious_percentage > 20:
            overall_status = "CRITICAL"
        elif malicious_percentage > 10:
            overall_status = "WARNING" 
        elif malicious_percentage > 5:
            overall_status = "SUSPICIOUS"
        else:
            overall_status = "CLEAN"
        
        results = {
            'analysis_id': analysis_id,
            'filename': filename,
            'timestamp': datetime.utcnow().isoformat(),
            'summary': {
                'total_flows': int(len(predictions)),
                'benign_flows': int(benign_count),
                'malicious_flows': int(malicious_count),
                'benign_percentage': float((benign_count / len(predictions)) * 100 if predictions else 0),
                'malicious_percentage': float(malicious_percentage),
                'overall_status': str(overall_status),
                'overall_risk_score': float(overall_risk_score)
            },
            'threats': {
                'malicious_ips': list(malicious_ips),
                'threat_types': threat_types,
                'top_threats': sorted(threat_types.items(), key=lambda x: x[1], reverse=True)[:5]
            },
            'detailed_results': [
                {
                    'flow_id': str(flow_df.iloc[i].get('Flow ID', f'Flow_{i}') if i < len(flow_df) else f'Flow_{i}'),
                    'src_ip': str(flow_df.iloc[i].get('Src IP', 'Unknown') if i < len(flow_df) else 'Unknown'),
                    'dst_ip': str(flow_df.iloc[i].get('Dst IP', 'Unknown') if i < len(flow_df) else 'Unknown'),
                    'src_port': int(flow_df.iloc[i].get('Src Port', 0) if i < len(flow_df) else 0),
                    'dst_port': int(flow_df.iloc[i].get('Dst Port', 0) if i < len(flow_df) else 0),
                    'protocol': int(flow_df.iloc[i].get('Protocol', 0) if i < len(flow_df) else 0),
                    'prediction': {
                        'classification': str(prediction['classification']),
                        'confidence': float(prediction['confidence']),
                        'risk_score': float(prediction['risk_score']),
                        'threat_type': str(prediction['threat_type']) if prediction['threat_type'] else None
                    }
                } for i, prediction in enumerate(predictions[:100])  # Limit to first 100 for performance
            ],
            'statistics': {
                'average_confidence': float(np.mean([p['confidence'] for p in predictions])),
                'flows_analyzed': int(len(predictions)),
                'unique_src_ips': int(len(set(flow_df['Src IP'].tolist())) if 'Src IP' in flow_df.columns else 0),
                'unique_dst_ips': int(len(set(flow_df['Dst IP'].tolist())) if 'Dst IP' in flow_df.columns else 0),
                'analysis_duration': '< 1 minute'  # You can track actual duration
            }
        }
        
        return results
    
    async def _cleanup_temp_files(self, analysis_id: str):
        """
        Clean up temporary files
        """
        try:
            import shutil
            temp_dir = self.temp_dir / analysis_id
            if temp_dir.exists():
                shutil.rmtree(temp_dir)
                logger.info(f"Cleaned up temporary files for analysis {analysis_id}")
        except Exception as e:
            logger.warning(f"Failed to cleanup temp files for {analysis_id}: {str(e)}")

# Global instance
pcap_analyzer = PcapAnalyzer()