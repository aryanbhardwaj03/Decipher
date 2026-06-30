"""
Auth Routes.
Login, register, and token management endpoints.
"""

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

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ── Schemas ───────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = ""


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

@router.post("/register", response_model=TokenResponse)
def register(
    req: RegisterRequest, 
    db: Session = Depends(get_db),
    x_guest_id: Optional[str] = Header(default=None, alias="X-Guest-Id")
):
    """Register a new user with email/password."""
    # Check if user exists
    existing = crud.get_user_by_email(db, req.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
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

    if x_guest_id:
        safe_guest_id = "".join(c for c in x_guest_id.lower() if c.isalnum() or c in ("-", "_"))[:72]
        if len(safe_guest_id) >= 8:
            guest_user = crud.get_user_by_email(db, f"guest-{safe_guest_id}@studyai.local")
            if guest_user and guest_user.id != user.id:
                crud.migrate_guest_data(db, guest_user.id, user.id)

    # Generate token
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
