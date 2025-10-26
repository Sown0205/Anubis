from fastapi import APIRouter, HTTPException, Request, Response, Header, Depends
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
import requests
import logging
from dotenv import load_dotenv
from pathlib import Path

from models.user_models import User, UserSession, SessionData, UserResponse

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

router = APIRouter(prefix="/api/auth", tags=["authentication"]) 
logger = logging.getLogger(__name__)

# HTTP Bearer scheme for API docs and bearer support
security = HTTPBearer(auto_error=False)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Constants
SESSION_DURATION_DAYS = 7
EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data" # For demo

async def get_current_user(request: Request, authorization: Optional[str] = Header(None)) -> Optional[User]:
    """
    Get current user from session_token (cookie or Authorization header)
    """
    session_token = None
    
    # Try to get from cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token and authorization:
        if authorization.startswith("Bearer "):
            session_token = authorization.replace("Bearer ", "")
    
    if not session_token:
        return None
    
    # Find session in database
    session = await db.user_sessions.find_one({"session_token": session_token})
    
    if not session:
        return None
    
    # Check if session expired
    expires_at = session["expires_at"]
    
    # Handle both timezone-aware and timezone-naive datetimes
    if expires_at.tzinfo is None:
        # If naive, make it timezone-aware (assume UTC)
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        # Delete expired session
        await db.user_sessions.delete_one({"_id": session["_id"]})
        return None
    
    # Get user
    user_doc = await db.users.find_one({"id": session["user_id"]})
    
    if not user_doc:
        return None
    
    return User(**user_doc)

@router.post("/session")
async def create_session(request: Request, response: Response, x_session_id: str = Header(..., alias="X-Session-ID")):
    """
    Process session ID from Emergent Auth and create user session
    """
    try:
        # Call Emergent Auth API to get session data
        headers = {"X-Session-ID": x_session_id}
        emergent_response = requests.get(EMERGENT_AUTH_URL, headers=headers)
        
        if emergent_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session ID")
        
        session_data = emergent_response.json()
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": session_data["email"]})
        
        if existing_user:
            user = User(**existing_user)
        else:
            # Create new user
            user = User(
                id=session_data["id"],
                email=session_data["email"],
                name=session_data["name"],
                picture=session_data.get("picture")
            )
            await db.users.insert_one(user.dict())
        
        # Create session
        session_token = session_data["session_token"]
        expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_DURATION_DAYS)
        
        user_session = UserSession(
            user_id=user.id,
            session_token=session_token,
            expires_at=expires_at
        )
        
        await db.user_sessions.insert_one(user_session.dict())
        
        # Set httpOnly cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=SESSION_DURATION_DAYS * 24 * 60 * 60
        )
        
        return UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            picture=user.picture
        )
        
    except requests.RequestException as e:
        logger.error(f"Error calling Emergent Auth API: {str(e)}")
        raise HTTPException(status_code=500, detail="Authentication service error")
    except Exception as e:
        logger.error(f"Error creating session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/me", response_model=UserResponse)
async def get_me(request: Request, authorization: Optional[str] = Header(None), credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Get current authenticated user
    """
    # Prefer explicit bearer credentials if provided
    if credentials and credentials.scheme and credentials.scheme.lower() == "bearer":
        authorization = f"Bearer {credentials.credentials}"

    user = await get_current_user(request, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        picture=user.picture
    )

# Reusable dependency to require authentication (via cookie or Bearer)
async def require_user(request: Request, authorization: Optional[str] = Header(None), credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    # Prefer explicit bearer credentials if provided
    if credentials and credentials.scheme and credentials.scheme.lower() == "bearer":
        authorization = f"Bearer {credentials.credentials}"

    user = await get_current_user(request, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@router.post("/logout")
async def logout(request: Request, response: Response, authorization: Optional[str] = Header(None), credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Logout user and clear session
    """
    # Prefer explicit bearer credentials if provided
    if credentials and credentials.scheme.lower() == "bearer":
        authorization = f"Bearer {credentials.credentials}"

    session_token = request.cookies.get("session_token")
    
    if not session_token and authorization:
        if authorization.startswith("Bearer "):
            session_token = authorization.replace("Bearer ", "")
    
    if session_token:
        # Delete session from database
        await db.user_sessions.delete_one({"session_token": session_token})
    
    # Clear cookie
    response.delete_cookie(
        key="session_token",
        path="/",
        secure=True,
        samesite="none"
    )
    
    return {"message": "Logged out successfully"}
