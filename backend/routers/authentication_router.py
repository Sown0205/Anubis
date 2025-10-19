from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Form
from fastapi.params import Cookie
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
import bcrypt 
from  backend.models.user_models import User

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

"""os.getenv() để đọc biến môi trường từ file .env"""

fake_users_db = {
    "johndoe": {
        "username": "johndoe",
        "email": "duybao@gmail.com",
        "hashed_password": "fakehashedpassword",
        "disabled": False,
    }
}

# Tạo JWT token 
def create_access_token(data: dict, expires_delta: timedelta = None): # timedelta: khoảng thời gian hết hạn
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta  # datetime.utcnow(): thời gian hiện tại theo UTC
    else:
        expire = datetime.utcnow() + timedelta(minutes=60)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Check JWT token
def get_current_user(token: Optional[str] = Cookie(None)):
    if token is None:
        raise HTTPException(status_code=403, detail="No token found")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Hash password
def hash_password(password: str):
    bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(bytes, salt).decode('utf-8') # decode() để chuyển bytes về str để lưu vào db
    return hashed

# Verify password
def verify_password(plain_password: str, hashed_password: str):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))



@router.post("/register", response_model=User)
def resignter(response: Response, username: str = Form(), password: str = Form(), full_name: Optional[str] =  Form(None), email: Optional[str] = Form(None)):
    if username in fake_users_db:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = hash_password(password)
    fake_users_db[username] = {
        "username": username,
        "email": email,
        "hashed_password": hashed_password,
        "disabled": False,
    }

    # Tạo session token 
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": username}, expires_delta=access_token_expires
    )
    response.set_cookie(
         key="token",
        value=access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="Lax",
        secure=False,
    )

    return User(
        id=1,  # Nếu chưa có ID thực thì gán tạm
        username=username,
        email=email,
        is_active=True,
        password_hash=hashed_password,
    )

@router.post("/login", response_model=User)
def login(response: Response, username: str = Form(...), password: str = Form(...)):
    user = fake_users_db.get(username)
    if not user or not verify_password(password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    # Tạo session token 
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": username}, expires_delta=access_token_expires
    )
    response.set_cookie(
         key="token",
        value=access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="Lax",
        secure=False,
    )

    return {"msg": "Login successful"}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("token")
    return {"message": "Logged out successfully"}