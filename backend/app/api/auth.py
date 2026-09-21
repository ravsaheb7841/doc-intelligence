from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr, validator
from datetime import datetime
from bson import ObjectId
from app.auth.utils import hash_password, verify_password, create_access_token, get_current_user
from app.utils.database import get_db

router = APIRouter()

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    confirm_password: str
    
    @validator("confirm_password")
    def passwords_match(cls, v, values):
        if "password" in values and v != values["password"]:
            raise ValueError("Passwords do not match")
        return v
    
    @validator("password")
    def password_strength(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
async def register(request: RegisterRequest):
    db = await get_db()
    existing = await db.users.find_one({"email": request.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    user = {
        "name": request.name,
        "email": request.email,
        "password": hash_password(request.password),
        "created_at": datetime.utcnow(),
    }
    
    result = await db.users.insert_one(user)
    token = create_access_token({"sub": str(result.inserted_id)})
    
    return {
        "message": "User registered successfully",
        "token": token,
        "user": {"id": str(result.inserted_id), "name": request.name, "email": request.email}
    }

@router.post("/login")
async def login(request: LoginRequest):
    db = await get_db()
    user = await db.users.find_one({"email": request.email})
    if not user or not verify_password(request.password, user["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    
    token = create_access_token({"sub": str(user["_id"])})
    return {
        "token": token,
        "user": {"id": str(user["_id"]), "name": user["name"], "email": user["email"]}
    }

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user