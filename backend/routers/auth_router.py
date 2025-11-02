from fastapi import APIRouter, HTTPException, Request, Response, Header, Depends
from fastapi.responses import JSONResponse
from typing import Optional
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
import requests
import logging
from dotenv import load_dotenv
from pathlib import Path

from models.user_models import User, UserSession, UserResponse

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

router = APIRouter(prefix="/api/auth", tags=["authentication"]) 
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Constants
SESSION_DURATION_DAYS = 7
EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

# Get current user from session cookie
async def get_current_user(request: Request) -> Optional[User]:
    """
    Get current user from session_token cookie.
    """
    session_token = request.cookies.get("session_token")
    if not session_token:
        return None

    # Find session in database
    session = await db.user_sessions.find_one({"session_token": session_token})
    if not session:
        return None

    # Check expiration
    expires_at = session["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        await db.user_sessions.delete_one({"_id": session["_id"]})
        return None

    # Get user
    user_doc = await db.users.find_one({"id": session["user_id"]})
    if not user_doc:
        return None

    return User(**user_doc)

# Auth routes
@router.post("/session")
async def create_session(request: Request, response: Response, x_session_id: str = Header(..., alias="X-Session-ID")):
    """
    Process session ID from Emergent Auth and create user session.
    """
    try:
        # Call Emergent Auth API
        headers = {"X-Session-ID": x_session_id}
        emergent_response = requests.get(EMERGENT_AUTH_URL, headers=headers)

        if emergent_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session ID")

        session_data = emergent_response.json()

        # Find or create user
        existing_user = await db.users.find_one({"email": session_data["email"]})
        if existing_user:
            user = User(**existing_user)
        else:
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

        # Set secure cookie
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

# Get current user routes
@router.get("/me", response_model=UserResponse)
async def get_me(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        picture=user.picture
    )

# Re-useable dependencies for protected routes
async def require_user(request: Request) -> User:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

# Logout routes
@router.post("/logout")
async def logout(request: Request, response: Response):
    """
    Logout user and clear session.
    """
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})

    response.delete_cookie(
        key="session_token",
        path="/",
        secure=True,
        samesite="none"
    )
    return {"message": "Logged out successfully"}
