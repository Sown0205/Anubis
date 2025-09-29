from fastapi import APIRouter, HTTPException
from models.network_models import MonitoringSettings, SystemStatus
from services.ai_model_service import ai_model_service
import os

router = APIRouter(prefix="/api/settings", tags=["settings"])

# In-memory settings storage (replace with database in production)
current_settings = MonitoringSettings()

@router.get("", response_model=MonitoringSettings)
async def get_settings():
    """
    Get current monitoring settings
    """
    return current_settings

@router.put("", response_model=MonitoringSettings)
async def update_settings(settings: MonitoringSettings):
    """
    Update monitoring settings
    """
    global current_settings
    try:
        current_settings = settings
        return current_settings
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/system/status", response_model=dict)
async def get_system_status():
    """
    Get system status including AI model, database, and network interface
    """
    try:
        # Check AI model status
        model_info = ai_model_service.get_model_info()
        
        # Check database status (simplified)
        try:
            # You can add actual database health check here
            db_status = "Online"
        except:
            db_status = "Offline"
        
        # Check network interface (simplified)
        try:
            # You can add actual network interface check here
            network_status = "Connected"
        except:
            network_status = "Disconnected"
        
        return {
            "ai_model_status": model_info["status"],
            "database_status": db_status,
            "network_interface": network_status,
            "model_info": model_info
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))