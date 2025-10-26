from fastapi import APIRouter, HTTPException, Response, Request, Header
from typing import List, Optional
import json
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
from models.network_models import ScanHistoryItem, ScanSession, ScanResult
from services.network_scanner import network_scanner
from routers.auth_router import get_current_user

router = APIRouter(prefix="/api/history", tags=["history"])

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url) if mongo_url else None
db = client[os.environ.get('DB_NAME', 'test_database')] if client else None

async def get_user_scan_history(user_id: str) -> List[ScanHistoryItem]:
    """
    Get scan history from database for a specific user
    Returns last 10 completed scans, plus current running scan if exists
    """
    history = []
    
    # Add current running scan if exists and belongs to this user
    current_status = network_scanner.get_current_status()
    if current_status["session"] and current_status["session"].user_id == user_id:
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
        
        history.append(current_item)
    
    # Fetch completed scans from database
    if db is not None:
        try:
            # Query last 10 completed scans for this user, sorted by start_time descending
            cursor = db.scan_sessions.find(
                {"user_id": user_id, "status": {"$in": ["COMPLETED", "STOPPED"]}}
            ).sort("start_time", -1).limit(10)
            
            scan_sessions = await cursor.to_list(length=10)
            
            for session_doc in scan_sessions:
                session = ScanSession(**session_doc)
                
                # Calculate duration
                start_time = session.start_time
                end_time = session.end_time or datetime.utcnow()
                duration = end_time - start_time
                hours = int(duration.total_seconds() // 3600)
                minutes = int((duration.total_seconds() % 3600) // 60)
                
                if hours > 0:
                    duration_str = f"{hours}h {minutes}m"
                else:
                    duration_str = f"{minutes}m"
                
                history_item = ScanHistoryItem(
                    id=session.id,
                    date=start_time.strftime("%Y-%m-%d"),
                    time=start_time.strftime("%H:%M:%S"),
                    duration=duration_str,
                    total_flows=session.total_flows,
                    threats=session.attack_count,
                    status=session.status
                )
                
                history.append(history_item)
                
        except Exception as e:
            print(f"Error fetching scan history from database: {str(e)}")
    
    return history

@router.get("", response_model=List[ScanHistoryItem])
async def get_scan_history(request: Request, authorization: Optional[str] = Header(None)):
    """
    Get scan history list for the current logged-in user
    """
    try:
        # Get current user - authentication required
        user = await get_current_user(request, authorization)
        
        if not user:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        # Get user's scan history from database
        history = await get_user_scan_history(user.id)
        return history
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{scan_id}", response_model=dict)
async def get_scan_details(scan_id: str, request: Request, authorization: Optional[str] = Header(None)):
    """
    Get detailed scan results for a specific scan
    """
    try:
        # Get current user - authentication required
        user = await get_current_user(request, authorization)
        
        if not user:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        # If it's the current session, return current results
        current_status = network_scanner.get_current_status()
        if current_status["session"] and current_status["session"].id == scan_id:
            # Verify this scan belongs to the user
            if current_status["session"].user_id != user.id:
                raise HTTPException(status_code=403, detail="Access denied")
                
            results = network_scanner.get_all_results()
            return {
                "scan_id": scan_id,
                "session": current_status["session"],
                "results": results,
                "total_results": len(results)
            }
        
        # For historical scans, fetch from database
        if db is not None:
            try:
                # Fetch scan session
                session_doc = await db.scan_sessions.find_one({"id": scan_id, "user_id": user.id})
                
                if not session_doc:
                    raise HTTPException(status_code=404, detail="Scan not found")
                
                session = ScanSession(**session_doc)
                
                # Fetch scan results
                results_cursor = db.scan_results.find({"scan_id": scan_id})
                results_docs = await results_cursor.to_list(length=None)
                results = [ScanResult(**doc) for doc in results_docs]
                
                return {
                    "scan_id": scan_id,
                    "session": session,
                    "results": results,
                    "total_results": len(results)
                }
                
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        else:
            raise HTTPException(status_code=500, detail="Database not available")
        
    except HTTPException:
        raise
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
async def delete_scan_record(scan_id: str, request: Request, authorization: Optional[str] = Header(None)):
    """
    Delete a scan record
    """
    try:
        # Get current user - authentication required
        user = await get_current_user(request, authorization)
        
        if not user:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        if db is not None:
            # Verify scan belongs to user before deleting
            session_doc = await db.scan_sessions.find_one({"id": scan_id, "user_id": user.id})
            
            if not session_doc:
                raise HTTPException(status_code=404, detail="Scan not found")
            
            # Delete scan session
            await db.scan_sessions.delete_one({"id": scan_id, "user_id": user.id})
            
            # Delete associated scan results
            await db.scan_results.delete_many({"scan_id": scan_id})
            
            return {"message": f"Scan record {scan_id} deleted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Database not available")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))