from fastapi import APIRouter, HTTPException, Response
from typing import List
import json
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
from models.network_models import ScanHistoryItem
from services.network_scanner import network_scanner

router = APIRouter(prefix="/api/history", tags=["history"])

# Mock scan history data (replace with database queries in production)
def generate_mock_history() -> List[ScanHistoryItem]:
    """
    Generate mock scan history for demonstration
    TODO: Replace with actual database queries
    """
    history = [
        ScanHistoryItem(
            id="1",
            date="2024-01-15",
            time="14:30:22",
            duration="2h 15m",
            total_flows=15430,
            threats=45,
            status="Completed"
        ),
        ScanHistoryItem(
            id="2", 
            date="2024-01-14",
            time="09:15:10",
            duration="1h 45m",
            total_flows=12890,
            threats=12,
            status="Completed"
        ),
        ScanHistoryItem(
            id="3",
            date="2024-01-13", 
            time="16:20:45",
            duration="3h 10m",
            total_flows=21560,
            threats=78,
            status="Completed"
        ),
        ScanHistoryItem(
            id="4",
            date="2024-01-12",
            time="11:05:33",
            duration="1h 30m", 
            total_flows=9876,
            threats=23,
            status="Completed"
        ),
        ScanHistoryItem(
            id="5",
            date="2024-01-11",
            time="15:45:12",
            duration="4h 20m",
            total_flows=28945,
            threats=156,
            status="Completed"
        )
    ]
    
    # Add current session if exists
    current_status = network_scanner.get_current_status()
    if current_status["session"]:
        session = current_status["session"]
        start_time = session.start_time
        
        # Calculate duration
        end_time = session.end_time or datetime.utcnow()
        duration = end_time - start_time
        hours = int(duration.total_seconds() // 3600)
        minutes = int((duration.total_seconds() % 3600) // 60)
        
        if hours > 0:
            duration_str = f"{hours}h {minutes}m"
        else:
            duration_str = f"{minutes}m"
        
        current_item = ScanHistoryItem(
            id=session.id,
            date=start_time.strftime("%Y-%m-%d"),
            time=start_time.strftime("%H:%M:%S"),
            duration=duration_str,
            total_flows=session.total_flows,
            threats=session.attack_count,
            status="Running" if session.status == "RUNNING" else "Completed"
        )
        
        # Insert at beginning
        history.insert(0, current_item)
    
    return history

@router.get("", response_model=List[ScanHistoryItem])
async def get_scan_history():
    """
    Get scan history list
    """
    try:
        history = generate_mock_history()
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{scan_id}", response_model=dict)
async def get_scan_details(scan_id: str):
    """
    Get detailed scan results for a specific scan
    """
    try:
        # If it's the current session, return current results
        current_status = network_scanner.get_current_status()
        if current_status["session"] and current_status["session"].id == scan_id:
            results = network_scanner.get_all_results()
            return {
                "scan_id": scan_id,
                "session": current_status["session"],
                "results": results,
                "total_results": len(results)
            }
        
        # For historical scans, return mock data (replace with database query)
        return {
            "scan_id": scan_id,
            "message": "Historical scan details would be retrieved from database",
            "note": "This is a mock response - implement database integration"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/export", response_class=Response)
async def export_scan_results(scan_id: str = None):
    """
    Export scan results as JSON file
    """
    try:
        if scan_id:
            # Export specific scan
            current_status = network_scanner.get_current_status()
            if current_status["session"] and current_status["session"].id == scan_id:
                results = network_scanner.get_all_results()
                export_data = {
                    "scan_session": current_status["session"],
                    "results": results,
                    "exported_at": datetime.utcnow().isoformat()
                }
            else:
                # Mock export for historical data
                export_data = {
                    "scan_id": scan_id,
                    "message": "Historical scan export",
                    "exported_at": datetime.utcnow().isoformat()
                }
        else:
            # Export current session
            current_status = network_scanner.get_current_status()
            results = network_scanner.get_all_results()
            export_data = {
                "current_session": current_status["session"],
                "results": results,
                "exported_at": datetime.utcnow().isoformat()
            }
        
        # Convert to JSON
        json_data = json.dumps(export_data, indent=2, default=str)
        
        # Return as downloadable file
        filename = f"anubis_scan_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        
        return Response(
            content=json_data,
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{scan_id}")
async def delete_scan_record(scan_id: str):
    """
    Delete a scan record
    """
    try:
        # TODO: Implement actual deletion from database
        return {"message": f"Scan record {scan_id} deletion requested", "note": "Implement database deletion"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))