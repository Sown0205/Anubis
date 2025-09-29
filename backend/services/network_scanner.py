import asyncio
import logging
import random
from datetime import datetime, timedelta
from typing import List, Optional, AsyncGenerator
from models.network_models import NetworkFlow, ScanResult, ScanSession
from services.ai_model_service import ai_model_service

logger = logging.getLogger(__name__)

class NetworkScanner:
    """
    Network Scanner service for real-time traffic analysis
    This simulates network traffic capture and analysis
    """
    
    def __init__(self):
        self.is_scanning = False
        self.current_scan_session = None
        self.scan_results = []
        self.scan_task = None
        
    async def start_scanning(self, settings: dict = None) -> ScanSession:
        """
        Start real-time network scanning
        """
        if self.is_scanning:
            raise Exception("Scanning is already in progress")
            
        if not ai_model_service.is_loaded:
            await ai_model_service.load_model()
            
        # Create new scan session
        self.current_scan_session = ScanSession(settings=settings or {})
        self.is_scanning = True
        self.scan_results = []
        
        # Start background scanning task
        self.scan_task = asyncio.create_task(self._scan_loop())
        
        logger.info(f"Started network scanning session: {self.current_scan_session.id}")
        return self.current_scan_session
    
    async def stop_scanning(self) -> Optional[ScanSession]:
        """
        Stop real-time network scanning
        """
        if not self.is_scanning:
            return None
            
        self.is_scanning = False
        
        if self.scan_task:
            self.scan_task.cancel()
            try:
                await self.scan_task
            except asyncio.CancelledError:
                pass
        
        if self.current_scan_session:
            self.current_scan_session.status = "COMPLETED"
            self.current_scan_session.end_time = datetime.utcnow()
            
        logger.info(f"Stopped network scanning session: {self.current_scan_session.id}")
        return self.current_scan_session
    
    async def _scan_loop(self):
        """
        Main scanning loop - captures and analyzes network traffic
        """
        try:
            while self.is_scanning:
                # Generate mock network flows (replace with actual traffic capture)
                flows = self._generate_mock_traffic()
                
                # Process flows through AI model
                for flow in flows:
                    if not self.is_scanning:
                        break
                        
                    try:
                        # Get AI prediction
                        prediction = await ai_model_service.predict_single_flow(flow)
                        
                        # Create scan result
                        result = ScanResult(
                            network_flow=flow,
                            ai_prediction=prediction,
                            scan_id=self.current_scan_session.id
                        )
                        
                        # Store result
                        self.scan_results.append(result)
                        
                        # Update session statistics
                        self.current_scan_session.total_flows += 1
                        if prediction.classification == "BENIGN":
                            self.current_scan_session.benign_count += 1
                        else:
                            self.current_scan_session.attack_count += 1
                            
                    except Exception as e:
                        logger.error(f"Error processing flow: {str(e)}")
                
                # Wait before next scan cycle
                scan_interval = self.current_scan_session.settings.get('scan_interval_seconds', 5)
                await asyncio.sleep(scan_interval)
                
        except asyncio.CancelledError:
            logger.info("Scanning loop cancelled")
        except Exception as e:
            logger.error(f"Error in scanning loop: {str(e)}")
            self.is_scanning = False
    
    def _generate_mock_traffic(self) -> List[NetworkFlow]:
        """
        Generate mock network traffic for demonstration
        TODO: Replace with actual network traffic capture
        """
        # Common IP ranges and ports for simulation
        internal_ips = ["192.168.1.{}".format(i) for i in range(100, 200)]
        external_ips = ["8.8.8.8", "1.1.1.1", "4.4.4.4", "208.67.222.222"]
        common_ports = [80, 443, 53, 25, 110, 993, 995]
        suspicious_ports = [22, 23, 135, 139, 445, 1433, 3389, 4444, 5432]
        
        flows = []
        num_flows = random.randint(1, 5)  # Generate 1-5 flows per cycle
        
        for _ in range(num_flows):
            # Random source (usually internal)
            src_ip = random.choice(internal_ips)
            src_port = random.randint(1024, 65535)
            
            # Random destination
            dst_ip = random.choice(external_ips + internal_ips)
            
            # Choose destination port (mix of common and suspicious)
            if random.random() < 0.2:  # 20% chance of suspicious port
                dst_port = random.choice(suspicious_ports)
            else:
                dst_port = random.choice(common_ports)
            
            # Random protocol (mostly TCP)
            protocol = "TCP" if random.random() < 0.8 else "UDP"
            
            flow = NetworkFlow(
                src_ip=src_ip,
                src_port=src_port,
                dst_ip=dst_ip,
                dst_port=dst_port,
                protocol=protocol,
                flow_duration=random.uniform(0.1, 10.0),
                total_bytes=random.randint(64, 1500),
                packet_count=random.randint(1, 100),
                timestamp=datetime.utcnow()
            )
            
            flows.append(flow)
        
        return flows
    
    def get_current_status(self) -> dict:
        """
        Get current scanning status and recent results
        """
        if not self.current_scan_session:
            return {
                "is_scanning": False,
                "session": None,
                "recent_results": []
            }
        
        # Get last 10 results for real-time display
        recent_results = self.scan_results[-10:] if self.scan_results else []
        
        return {
            "is_scanning": self.is_scanning,
            "session": self.current_scan_session,
            "recent_results": recent_results,
            "total_results": len(self.scan_results)
        }
    
    def get_all_results(self) -> List[ScanResult]:
        """
        Get all scan results from current session
        """
        return self.scan_results.copy()
    
    async def get_live_results_stream(self) -> AsyncGenerator[List[ScanResult], None]:
        """
        Generator for streaming live scan results
        """
        last_count = 0
        
        while self.is_scanning:
            current_count = len(self.scan_results)
            
            if current_count > last_count:
                # Yield new results
                new_results = self.scan_results[last_count:current_count]
                yield new_results
                last_count = current_count
            
            await asyncio.sleep(1)  # Check for new results every second

# Global network scanner instance
network_scanner = NetworkScanner()