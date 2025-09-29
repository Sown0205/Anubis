# ANUBIS API Contracts & Integration Plan

## Overview
This document outlines the API endpoints and integration approach for ANUBIS real-time network scanning system with AI model integration.

## API Endpoints Structure

### 1. Real-time Scanning Endpoints
```
POST /api/scan/start          - Start real-time network scanning
POST /api/scan/stop           - Stop real-time network scanning  
GET  /api/scan/status         - Get current scanning status and live results
GET  /api/scan/results/stream - WebSocket endpoint for real-time results streaming
```

### 2. Scan History Endpoints
```
GET    /api/scan/history           - Get scan history list
GET    /api/scan/history/{scan_id} - Get detailed scan results
POST   /api/scan/history/export    - Export scan results
DELETE /api/scan/history/{scan_id} - Delete scan record
```

### 3. Settings & Configuration
```
GET  /api/settings        - Get current monitoring settings
PUT  /api/settings        - Update monitoring settings
GET  /api/system/status   - Get system status (AI model, database, etc.)
```

## Data Models

### NetworkFlow (Input to AI Model)
```python
{
    "src_ip": "192.168.1.100",
    "src_port": 12345,
    "dst_ip": "8.8.8.8", 
    "dst_port": 80,
    "protocol": "TCP",
    "flow_duration": 1.5,
    "total_bytes": 1024,
    "packet_count": 10,
    "timestamp": "2024-01-15T10:30:00Z"
}
```

### AI Model Output
```python
{
    "classification": "BENIGN" | "ATTACK",
    "confidence": 0.95,
    "threat_type": "DDoS" | "Port_Scan" | "Malware" | null,
    "risk_score": 0.1
}
```

### ScanResult (Combined)
```python
{
    "id": "uuid",
    "flow_id": "src_ip:src_port->dst_ip:dst_port:protocol",
    "timestamp": "2024-01-15T10:30:00Z",
    "network_flow": NetworkFlow,
    "ai_prediction": AIModelOutput,
    "status": "BENIGN" | "ATTACK"
}
```

## Frontend Integration Points

### Mock Data Replacement
1. **Dashboard Page**: Replace `mockData.realtimeScans` with API call to `/api/scan/status`
2. **Results Analysis**: Replace `mockData.analysisResults` with `/api/scan/history/latest/analysis`
3. **Scan History**: Replace `mockData.scanHistory` with `/api/scan/history`

### Real-time Updates
- Implement WebSocket connection to `/api/scan/results/stream`
- Update Dashboard with live scanning results
- Show real-time statistics and flow classifications

## AI Model Integration Requirements

### Expected AI Model Interface
```python
# Function signature needed:
def predict_network_flow(flow_data: NetworkFlow) -> AIModelOutput:
    """
    Your AI model prediction function
    Input: Network flow features
    Output: Classification and confidence score
    """
    pass
```

### Integration Approach
1. **Model Loading**: Load AI model on FastAPI startup
2. **Prediction Pipeline**: Process network flows through model in real-time
3. **Batch Processing**: Handle multiple flows efficiently
4. **Error Handling**: Graceful degradation if model fails

## Database Schema

### scans table
```sql
- id (UUID, Primary Key)
- start_time (DateTime)
- end_time (DateTime, nullable)
- status (String): "RUNNING" | "COMPLETED" | "STOPPED"
- total_flows (Integer)
- benign_count (Integer) 
- attack_count (Integer)
- settings (JSON)
```

### scan_results table
```sql
- id (UUID, Primary Key)
- scan_id (UUID, Foreign Key)
- timestamp (DateTime)
- flow_id (String)
- src_ip, src_port, dst_ip, dst_port, protocol (Network info)
- classification (String): "BENIGN" | "ATTACK"
- confidence (Float)
- threat_type (String, nullable)
- risk_score (Float)
```

## Implementation Plan

### Phase 1: Core API Structure
1. Create FastAPI endpoints with proper models
2. Implement basic CRUD operations
3. Set up database models and migrations

### Phase 2: AI Model Integration  
1. Create AI model wrapper/service
2. Implement prediction pipeline
3. Add error handling and logging

### Phase 3: Real-time Features
1. WebSocket implementation for live updates
2. Background tasks for continuous scanning
3. Performance optimization

### Phase 4: Frontend Integration
1. Replace mock data with API calls
2. Implement real-time dashboard updates
3. Add proper error states and loading indicators

## Notes
- All timestamps in UTC
- Use UUIDs for unique identifiers
- Implement proper pagination for large datasets
- Add rate limiting for API protection
- Include comprehensive error responses