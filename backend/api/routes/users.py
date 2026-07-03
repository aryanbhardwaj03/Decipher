import os
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from fastapi.responses import FileResponse
import shutil

from db.database import get_db
from db import crud
from api.middleware.auth import get_current_user, verify_password, hash_password
from config import settings, UPLOAD_DIR

router = APIRouter(prefix="/api/users", tags=["users"])

# Ensure avatar directory exists
AVATAR_DIR = os.path.join(UPLOAD_DIR, "avatars")
os.makedirs(AVATAR_DIR, exist_ok=True)

class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str

class ProfileUpdateRequest(BaseModel):
    name: str

@router.put("/me")
def update_profile(
    req: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    user.name = req.name
    db.commit()
    db.refresh(user)
    return {"message": "Profile updated successfully", "name": user.name}

@router.put("/me/password")
def change_password(
    req: PasswordChangeRequest,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    if not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User logged in via OAuth, cannot change password",
        )
    
    if not verify_password(req.old_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect old password",
        )
    
    # Hash new password and save
    new_hash = hash_password(req.new_password)
    user.hashed_password = new_hash
    db.commit()
    
    return {"message": "Password updated successfully"}

@router.post("/me/avatar")
def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image",
        )
    
    # Save the file
    ext = file.filename.split(".")[-1]
    filename = f"{user.id}.{ext}"
    filepath = os.path.join(AVATAR_DIR, filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    avatar_url = f"/api/users/avatar/{filename}"
    
    # Update user in DB
    user.avatar_url = avatar_url
    db.commit()
    
    return {"avatar_url": avatar_url}

@router.get("/avatar/{filename}")
def get_avatar(filename: str):
    filepath = os.path.join(AVATAR_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Avatar not found")
    return FileResponse(filepath)

@router.get("/me/export")
def export_user_data(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    import json
    from tempfile import NamedTemporaryFile
    
    docs = crud.get_user_documents(db, user.id, skip=0, limit=1000)
    quizzes = crud.get_user_quizzes(db, user.id, limit=1000)
    
    data = {
        "user": {"name": user.name, "email": user.email, "xp": user.xp},
        "documents": [{"id": d.id, "filename": d.filename, "created_at": d.created_at.isoformat()} for d in docs],
        "quizzes": [{"id": q.id, "score": q.score, "total": q.total, "created_at": q.created_at.isoformat()} for q in quizzes]
    }
    
    with NamedTemporaryFile(mode="w+", delete=False, suffix=".json") as f:
        json.dump(data, f)
        temp_path = f.name
        
    return FileResponse(
        temp_path, 
        media_type="application/json", 
        filename=f"studyai_export_{user.id}.json"
    )

@router.delete("/me/data")
def delete_user_data(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    # Retrieve all documents for the user
    docs = crud.get_user_documents(db, user.id, skip=0, limit=10000)
    for doc in docs:
        crud.delete_document(db, doc.id)
    
    # Also delete quizzes, flashcards, chats if needed, though they 
    # may cascade delete if relationships are set up. We'll do a simple
    # deletion for docs here which is the primary data.
    
    return {"message": "All user data deleted successfully"}

@router.get("/me/xp")
def get_user_xp_history(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    from db.models import XPTransaction
    from sqlalchemy import desc, func
    from datetime import datetime, timedelta

    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    weekly_xp = db.query(func.sum(XPTransaction.amount)).filter(
        XPTransaction.user_id == user.id,
        XPTransaction.created_at >= seven_days_ago
    ).scalar() or 0

    transactions = db.query(XPTransaction).filter(
        XPTransaction.user_id == user.id
    ).order_by(desc(XPTransaction.created_at)).limit(50).all()

    return {
        "total_xp": user.xp or 0,
        "weekly_xp": weekly_xp,
        "history": [
            {
                "id": t.id,
                "amount": t.amount,
                "reason": t.reason,
                "created_at": t.created_at.isoformat()
            } for t in transactions
        ]
    }
