from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional
import asyncio
import logging
from datetime import datetime
import uuid

from services.pcap_analyzer import pcap_analyzer
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/pcap", tags=["pcap-analysis"])

# Pydantic models for API responses
class AnalysisStatus(BaseModel):
    analysis_id: str
    status: str  # "processing", "completed", "failed"
    progress: int  # 0-100
    message: str
    started_at: datetime
    completed_at: Optional[datetime] = None

class AnalysisSummary(BaseModel):
    total_flows: int
    benign_flows: int
    malicious_flows: int
    benign_percentage: float
    malicious_percentage: float
    overall_status: str
    overall_risk_score: float

class ThreatInfo(BaseModel):
    malicious_ips: list
    threat_types: dict
    top_threats: list

class AnalysisResult(BaseModel):
    analysis_id: str
    filename: str
    timestamp: str
    summary: AnalysisSummary
    threats: ThreatInfo
    detailed_results: list
    statistics: dict

# In-memory storage for analysis status (use database in production)
analysis_status_store: Dict[str, AnalysisStatus] = {}
analysis_results_store: Dict[str, Dict[str, Any]] = {}

async def process_pcap_analysis(file_content: bytes, filename: str, analysis_id: str):
    """
    Background task for processing pcap analysis
    """
    try:
        # Update status to processing
        analysis_status_store[analysis_id].status = "processing"
        analysis_status_store[analysis_id].progress = 10
        analysis_status_store[analysis_id].message = "Validating file..."
        
        # Process the file
        analysis_status_store[analysis_id].progress = 25
        analysis_status_store[analysis_id].message = "Extracting flow features..."
        
        # Run the actual analysis
        results = await pcap_analyzer.analyze_pcap_file(file_content, filename, analysis_id)
        
        # Store results
        analysis_results_store[analysis_id] = results
        
        # Update status to completed
        analysis_status_store[analysis_id].status = "completed"
        analysis_status_store[analysis_id].progress = 100
        analysis_status_store[analysis_id].message = "Analysis completed successfully"
        analysis_status_store[analysis_id].completed_at = datetime.utcnow()
        
        logger.info(f"Analysis {analysis_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Analysis {analysis_id} failed: {str(e)}")
        
        # Update status to failed
        analysis_status_store[analysis_id].status = "failed"
        analysis_status_store[analysis_id].progress = 0
        analysis_status_store[analysis_id].message = f"Analysis failed: {str(e)}"
        analysis_status_store[analysis_id].completed_at = datetime.utcnow()

@router.post("/upload", response_model=Dict[str, str])
async def upload_pcap_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Upload and analyze a pcap/pcapng file
    Returns analysis_id for tracking progress
    """
    try:
        # Validate file type
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        valid_extensions = ['.pcap', '.pcapng', '.cap']
        file_extension = '.' + file.filename.split('.')[-1].lower()
        
        if file_extension not in valid_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type. Supported types: {valid_extensions}"
            )
        
        # Check file size (limit to 100MB)
        file_content = await file.read()
        max_size = 100 * 1024 * 1024  # 100MB
        
        if len(file_content) > max_size:
            raise HTTPException(
                status_code=400,
                detail="File too large. Maximum size is 100MB"
            )
        
        if len(file_content) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Generate analysis ID
        analysis_id = str(uuid.uuid4())
        
        # Initialize status tracking
        analysis_status_store[analysis_id] = AnalysisStatus(
            analysis_id=analysis_id,
            status="queued",
            progress=0,
            message="File uploaded, queued for analysis",
            started_at=datetime.utcnow()
        )
        
        # Start background analysis
        background_tasks.add_task(
            process_pcap_analysis, 
            file_content, 
            file.filename, 
            analysis_id
        )
        
        logger.info(f"Started analysis {analysis_id} for file: {file.filename}")
        
        return {
            "analysis_id": analysis_id,
            "message": "File uploaded successfully. Analysis started.",
            "filename": file.filename,
            "file_size": str(len(file_content))
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/analysis/{analysis_id}/status", response_model=AnalysisStatus)
async def get_analysis_status(analysis_id: str):
    """
    Get the current status of an analysis
    """
    if analysis_id not in analysis_status_store:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return analysis_status_store[analysis_id]

@router.get("/analysis/{analysis_id}/results", response_model=Dict[str, Any])
async def get_analysis_results(analysis_id: str):
    """
    Get the complete results of an analysis
    """
    if analysis_id not in analysis_status_store:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    status = analysis_status_store[analysis_id]
    
    if status.status == "processing" or status.status == "queued":
        raise HTTPException(
            status_code=202, 
            detail="Analysis still in progress. Check status endpoint."
        )
    
    if status.status == "failed":
        raise HTTPException(
            status_code=500, 
            detail=f"Analysis failed: {status.message}"
        )
    
    if analysis_id not in analysis_results_store:
        raise HTTPException(status_code=404, detail="Results not found")
    
    return analysis_results_store[analysis_id]

@router.get("/analysis/{analysis_id}/summary", response_model=Dict[str, Any])
async def get_analysis_summary(analysis_id: str):
    """
    Get a summary of the analysis results
    """
    if analysis_id not in analysis_results_store:
        raise HTTPException(status_code=404, detail="Analysis results not found")
    
    results = analysis_results_store[analysis_id]
    
    # Return only summary information
    summary = {
        "analysis_id": results["analysis_id"],
        "filename": results["filename"],
        "timestamp": results["timestamp"],
        "summary": results["summary"],
        "threats": {
            "malicious_ips_count": len(results["threats"]["malicious_ips"]),
            "malicious_ips": results["threats"]["malicious_ips"][:10],  # Limit to first 10
            "threat_types": results["threats"]["threat_types"],
            "top_threats": results["threats"]["top_threats"]
        },
        "statistics": results["statistics"]
    }
    
    return summary

@router.get("/analysis/{analysis_id}/threats", response_model=Dict[str, Any])
async def get_analysis_threats(analysis_id: str):
    """
    Get detailed threat information from the analysis
    """
    if analysis_id not in analysis_results_store:
        raise HTTPException(status_code=404, detail="Analysis results not found")
    
    results = analysis_results_store[analysis_id]
    
    return {
        "analysis_id": analysis_id,
        "threats": results["threats"],
        "malicious_flows": [
            flow for flow in results["detailed_results"]
            if flow["prediction"]["classification"] == "ATTACK"
        ]
    }

@router.get("/analysis/list", response_model=Dict[str, Any])
async def list_analyses(limit: int = 50, offset: int = 0):
    """
    List all analyses with pagination
    """
    analyses_list = []
    
    # Get all analyses sorted by start time (most recent first)
    sorted_analyses = sorted(
        analysis_status_store.items(),
        key=lambda x: x[1].started_at,
        reverse=True
    )
    
    # Apply pagination
    paginated_analyses = sorted_analyses[offset:offset + limit]
    
    for analysis_id, status in paginated_analyses:
        analysis_info = {
            "analysis_id": analysis_id,
            "status": status.status,
            "started_at": status.started_at,
            "completed_at": status.completed_at,
            "message": status.message
        }
        
        # Add summary if available
        if analysis_id in analysis_results_store:
            results = analysis_results_store[analysis_id]
            analysis_info["summary"] = {
                "filename": results["filename"],
                "total_flows": results["summary"]["total_flows"],
                "malicious_flows": results["summary"]["malicious_flows"],
                "overall_status": results["summary"]["overall_status"]
            }
        
        analyses_list.append(analysis_info)
    
    return {
        "analyses": analyses_list,
        "total": len(analysis_status_store),
        "offset": offset,
        "limit": limit
    }

@router.delete("/analysis/{analysis_id}")
async def delete_analysis(analysis_id: str):
    """
    Delete an analysis and its results
    """
    if analysis_id not in analysis_status_store:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Remove from both stores
    del analysis_status_store[analysis_id]
    if analysis_id in analysis_results_store:
        del analysis_results_store[analysis_id]
    
    return {"message": f"Analysis {analysis_id} deleted successfully"}

@router.post("/analyze-sync", response_model=Dict[str, Any])
async def analyze_pcap_sync(file: UploadFile = File(...)):
    """
    Synchronous analysis endpoint (for smaller files)
    Returns results immediately without background processing
    """
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        valid_extensions = ['.pcap', '.pcapng', '.cap']
        file_extension = '.' + file.filename.split('.')[-1].lower()
        
        if file_extension not in valid_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Supported types: {valid_extensions}"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Size limit for sync analysis (10MB)
        max_size = 10 * 1024 * 1024
        if len(file_content) > max_size:
            raise HTTPException(
                status_code=400,
                detail="File too large for synchronous analysis. Use async upload endpoint for files > 10MB"
            )
        
        # Generate analysis ID
        analysis_id = str(uuid.uuid4())
        
        # Perform analysis
        results = await pcap_analyzer.analyze_pcap_file(file_content, file.filename, analysis_id)
        
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Sync analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")