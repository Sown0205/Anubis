from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime

# Import new routers and services
from routers.scan_router import router as scan_router
from routers.settings_router import router as settings_router
from routers.history_router import router as history_router
from routers.pcap_router import router as pcap_router
from services.ai_model_service import ai_model_service

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="ANUBIS API", description="Real-time Network Security Monitoring API", version="1.0.0")

# Create a router with the /api prefix for legacy endpoints
api_router = APIRouter(prefix="/api")

# Define Models for legacy endpoints
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Legacy routes
@api_router.get("/")
async def root():
    return {"message": "ANUBIS API is running", "version": "1.0.0"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include all routers
app.include_router(api_router)
app.include_router(scan_router)
app.include_router(settings_router)
app.include_router(history_router)
app.include_router(pcap_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting ANUBIS API server...")
    
    # Initialize AI model
    try:
        await ai_model_service.load_model()
        logger.info("AI model service initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize AI model service: {str(e)}")
    
    logger.info("ANUBIS API server started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down ANUBIS API server...")
    client.close()
    logger.info("ANUBIS API server shutdown complete")
