from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from typing import List, Optional
import json
import asyncio
from datetime import datetime, timedelta

from models.network_models import (
    ScanSession, ScanSessionCreate, ScanResult, 
    ScanStatistics, LiveScanUpdate, ScanHistoryItem
)
from services.network_scanner import network_scanner
from services.ai_model_service import ai_model_service

router = APIRouter(prefix="/api/scan", tags=["scanning"])

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message, default=str))
            except:
                pass

manager = ConnectionManager()

@router.post("/start", response_model=ScanSession)
async def start_scanning(scan_request: ScanSessionCreate = ScanSessionCreate()):
    """
    Start real-time network scanning
    """
    try:
        session = await network_scanner.start_scanning(scan_request.settings)
        return session
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/stop", response_model=Optional[ScanSession])
async def stop_scanning():
    """
    Stop real-time network scanning
    """
    try:
        session = await network_scanner.stop_scanning()
        return session
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/status", response_model=dict)
async def get_scan_status():
    """
    Get current scanning status and recent results
    """
    try:
        status = network_scanner.get_current_status()
        
        # Format results for frontend compatibility
        if status["recent_results"]:
            formatted_results = []
            for result in status["recent_results"]:
                formatted_results.append({
                    "status": result.status,
                    "classification": result.ai_prediction.classification.lower(),
                    "flowId": result.flow_id,
                    "src": result.network_flow.src_ip,
                    "srcPort": str(result.network_flow.src_port),
                    "dst": result.network_flow.dst_ip,
                    "dstPort": str(result.network_flow.dst_port),
                    "protocol": result.network_flow.protocol,
                    "confidence": result.ai_prediction.confidence,
                    "timestamp": result.timestamp.isoformat()
                })
            status["recent_results"] = formatted_results
        
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/results", response_model=List[ScanResult])
async def get_all_results():
    """
    Get all scan results from current session
    """
    try:
        results = network_scanner.get_all_results()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/results/analysis", response_model=dict)
async def get_results_analysis():
    """
    Get analysis of current scan results
    """
    try:
        results = network_scanner.get_all_results()
        session = network_scanner.current_scan_session
        
        if not session or not results:
            return {
                "scanningTime": "0 minutes",
                "totalFlows": 0,
                "benignFlows": 0,
                "attackFlows": 0,
                "overallStatus": "No Data"
            }
        
        # Calculate scanning duration
        start_time = session.start_time
        end_time = session.end_time or datetime.utcnow()
        duration = end_time - start_time
        
        hours = int(duration.total_seconds() // 3600)
        minutes = int((duration.total_seconds() % 3600) // 60)
        seconds = int(duration.total_seconds() % 60)
        
        if hours > 0:
            scanning_time = f"{hours} hour{'s' if hours != 1 else ''}, {minutes} minute{'s' if minutes != 1 else ''} and {seconds} second{'s' if seconds != 1 else ''}"
        elif minutes > 0:
            scanning_time = f"{minutes} minute{'s' if minutes != 1 else ''} and {seconds} second{'s' if seconds != 1 else ''}"
        else:
            scanning_time = f"{seconds} second{'s' if seconds != 1 else ''}"
        
        # Calculate statistics
        total_flows = len(results)
        benign_flows = sum(1 for r in results if r.status == "BENIGN")
        attack_flows = sum(1 for r in results if r.status == "ATTACK")
        
        # Determine overall status
        if total_flows == 0:
            overall_status = "No Data"
        elif attack_flows / total_flows > 0.3:  # More than 30% of the flow is attack flows
            overall_status = "Compromised"
        elif attack_flows / total_flows > 0.15:  # More than 15% of the flow is attack flows
            overall_status = "Warning"
        else:
            overall_status = "Healthy"
        
        return {
            "scanningTime": scanning_time,
            "totalFlows": total_flows,
            "benignFlows": benign_flows,
            "attackFlows": attack_flows,
            "overallStatus": overall_status
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.websocket("/results/stream")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time scan results streaming
    """
    await manager.connect(websocket)
    try:
        while True:
            # Get current status
            status = network_scanner.get_current_status()
            
            if status["is_scanning"] and status["recent_results"]:
                # Format for frontend
                formatted_results = []
                for result in status["recent_results"]:
                    formatted_results.append({
                        "status": result.status,
                        "classification": result.ai_prediction.classification.lower(),
                        "flowId": result.flow_id,
                        "src": result.network_flow.src_ip,
                        "srcPort": str(result.network_flow.src_port),
                        "dst": result.network_flow.dst_ip,
                        "dstPort": str(result.network_flow.dst_port),
                        "protocol": result.network_flow.protocol,
                        "confidence": result.ai_prediction.confidence,
                        "timestamp": result.timestamp.isoformat()
                    })
                
                await websocket.send_text(json.dumps({
                    "type": "scan_update",
                    "data": {
                        "results": formatted_results,
                        "session": {
                            "id": status["session"].id,
                            "total_flows": status["session"].total_flows,
                            "benign_count": status["session"].benign_count,
                            "attack_count": status["session"].attack_count,
                            "is_scanning": status["is_scanning"]
                        }
                    }
                }, default=str))
            
            await asyncio.sleep(2)  # Send updates every 2 seconds
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)