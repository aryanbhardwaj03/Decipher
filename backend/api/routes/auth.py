"""
Auth Routes.
Login, register, and token management endpoints.
"""

import re
import random
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from db.database import get_db
from db import crud
from api.middleware.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from core.email import send_otp_email, send_welcome_email

from sqlalchemy.orm.attributes import flag_modified

router = APIRouter(prefix="/api/auth", tags=["auth"])

def _ensure_welcome_email(user, db: Session):
    """Ensures the welcome email is sent to the user exactly once."""
    prefs = user.ai_preferences or {}
    if isinstance(prefs, str):
        import json
        try:
            prefs = json.loads(prefs)
        except:
            prefs = {}
            
    if not prefs.get("welcome_email_sent"):
        send_welcome_email(user.email, user.name)
        prefs["welcome_email_sent"] = True
        user.ai_preferences = prefs
        flag_modified(user, "ai_preferences")
        db.commit()


# ── Schemas ───────────────────────────────────────────────────────────────

class SendOtpRequest(BaseModel):
    email: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = ""
    otp: str


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleAuthRequest(BaseModel):
    email: str
    name: str = ""
    avatar_url: str = ""


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    avatar_url: str | None
    role: str
    plan: str
    xp: int
    streak: int


# ── Routes ────────────────────────────────────────────────────────────────

@router.post("/send-otp")
def send_otp(req: SendOtpRequest, db: Session = Depends(get_db)):
    """Send an OTP code to the user's email."""
    existing = crud.get_user_by_email(db, req.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    
    otp_code = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    crud.create_otp(db, req.email, otp_code, expires_at)
    
    send_otp_email(req.email, otp_code)
    return {"message": "OTP sent successfully"}


@router.post("/register", response_model=TokenResponse)
def register(
    req: RegisterRequest, 
    db: Session = Depends(get_db),
    x_guest_id: Optional[str] = Header(default=None, alias="X-Guest-Id")
):
    """Register a new user with email/password and OTP."""
    # Enforce strong password
    if len(req.password) < 8 or not re.search(r"[A-Z]", req.password) or not re.search(r"[a-z]", req.password) or not re.search(r"[0-9]", req.password) or not re.search(r"[!@#$%^&*(),.?\":{}|<>]", req.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
        )

    # Check if user exists
    existing = crud.get_user_by_email(db, req.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Verify OTP
    if not crud.verify_otp(db, req.email, req.otp):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code",
        )

    # Create user
    user = crud.create_user(
        db=db,
        email=req.email,
        name=req.name,
        hashed_password=hash_password(req.password),
        provider="credentials",
    )

    if x_guest_id:
        safe_guest_id = "".join(c for c in x_guest_id.lower() if c.isalnum() or c in ("-", "_"))[:72]
        if len(safe_guest_id) >= 8:
            guest_user = crud.get_user_by_email(db, f"guest-{safe_guest_id}@studyai.local")
            if guest_user and guest_user.id != user.id:
                crud.migrate_guest_data(db, guest_user.id, user.id)

    # Generate token
    token = create_access_token({"sub": user.id, "email": user.email})
    
    # Send welcome email for new user
    _ensure_welcome_email(user, db)

    return TokenResponse(
        access_token=token,
        user={
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "plan": user.plan,
            "xp": user.xp,
        },
    )


@router.post("/login", response_model=TokenResponse)
def login(
    req: LoginRequest, 
    db: Session = Depends(get_db),
    x_guest_id: Optional[str] = Header(default=None, alias="X-Guest-Id")
):
    """Login with email/password."""
    user = crud.get_user_by_email(db, req.email)
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
        
    _ensure_welcome_email(user, db)

    token = create_access_token({"sub": user.id, "email": user.email})

    return TokenResponse(
        access_token=token,
        user={
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "plan": user.plan,
            "xp": user.xp,
        },
    )


@router.post("/google", response_model=TokenResponse)
def google_auth(
    req: GoogleAuthRequest, 
    db: Session = Depends(get_db),
    x_guest_id: Optional[str] = Header(default=None, alias="X-Guest-Id")
):
    """Authenticate with Google OAuth (frontend sends profile info after OAuth)."""
    user = crud.get_user_by_email(db, req.email)

    if not user:
        # Create new user
        user = crud.create_user(
            db=db,
            email=req.email,
            name=req.name,
            avatar_url=req.avatar_url,
            provider="google",
        )
        
    _ensure_welcome_email(user, db)

    if x_guest_id:
        safe_guest_id = "".join(c for c in x_guest_id.lower() if c.isalnum() or c in ("-", "_"))[:72]
        if len(safe_guest_id) >= 8:
            guest_user = crud.get_user_by_email(db, f"guest-{safe_guest_id}@studyai.local")
            if guest_user and guest_user.id != user.id:
                crud.migrate_guest_data(db, guest_user.id, user.id)

    token = create_access_token({"sub": user.id, "email": user.email})

    return TokenResponse(
        access_token=token,
        user={
            "id": user.id,
            "email": user.email,
            "name": user.name or req.name,
            "avatar_url": user.avatar_url,
            "role": user.role,
            "plan": user.plan,
            "xp": user.xp,
        },
    )


@router.get("/me", response_model=UserResponse)
def get_me(user=Depends(get_current_user)):
    """Get current authenticated user."""
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name or "",
        avatar_url=user.avatar_url,
        role=user.role,
        plan=user.plan or "Basic",
        xp=user.xp or 0,
        streak=user.streak or 0,
    )
