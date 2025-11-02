from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from datetime import datetime
import uuid

# Network Flow Models
class NetworkFlow(BaseModel):
    src_ip: str
    src_port: int
    dst_ip: str  
    dst_port: int
    protocol: str
    flow_duration: Optional[float] = None
    total_bytes: Optional[int] = None
    packet_count: Optional[int] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AIModelOutput(BaseModel):
    classification: Literal["BENIGN", "ATTACK"]
    confidence: float = Field(ge=0.0, le=1.0)
    threat_type: Optional[str] = None
    risk_score: float = Field(ge=0.0, le=1.0)

class ScanResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    flow_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    network_flow: NetworkFlow
    ai_prediction: AIModelOutput
    status: Literal["BENIGN", "ATTACK"]
    scan_id: Optional[str] = None

    def __init__(self, **data):
        if 'flow_id' not in data and 'network_flow' in data:
            flow = data['network_flow']
            data['flow_id'] = f"{flow.src_ip}:{flow.src_port}->{flow.dst_ip}:{flow.dst_port}:{flow.protocol}"
        if 'status' not in data and 'ai_prediction' in data:
            data['status'] = data['ai_prediction'].classification
        super().__init__(**data)

# Scan Session Models
class ScanSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    status: Literal["RUNNING", "COMPLETED", "STOPPED"] = "RUNNING"
    total_flows: int = 0
    benign_count: int = 0
    attack_count: int = 0
    settings: dict = Field(default_factory=dict)

class ScanSessionCreate(BaseModel):
    settings: Optional[dict] = Field(default_factory=dict)

class ScanSessionUpdate(BaseModel):
    status: Optional[Literal["RUNNING", "COMPLETED", "STOPPED"]] = None
    end_time: Optional[datetime] = None
    total_flows: Optional[int] = None
    benign_count: Optional[int] = None
    attack_count: Optional[int] = None

# Analysis and Statistics Models
class ScanStatistics(BaseModel):
    scanning_time: str
    total_flows: int
    benign_flows: int
    attack_flows: int
    overall_status: str
    benign_percentage: float
    attack_percentage: float

class ScanHistoryItem(BaseModel):
    id: str
    date: str
    time: str
    duration: str
    total_flows: int
    threats: int
    status: str

# Settings Models
class MonitoringSettings(BaseModel):
    real_time_monitoring: bool = True
    alert_notifications: bool = True
    auto_threat_response: bool = False
    data_retention_days: int = 30
    scan_interval_seconds: int = 5
    max_flows_per_second: int = 1000
    enable_logging: bool = True
    send_reports: bool = False

# System Status Models
class SystemStatus(BaseModel):
    ai_model_status: str = "Active"
    network_interface: str = "Connected" 
    database_status: str = "Online"
    last_updated: datetime = Field(default_factory=datetime.utcnow)

# Real-time streaming models
class LiveScanUpdate(BaseModel):
    scan_results: List[ScanResult]
    statistics: ScanStatistics
    timestamp: datetime = Field(default_factory=datetime.utcnow)