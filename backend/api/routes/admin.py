"""
Admin Routes.
Platform statistics and management endpoints.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from db import crud
from api.middleware.auth import get_admin_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/stats")
def get_platform_stats(
    user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Get platform-wide statistics."""
    stats = crud.get_admin_stats(db)
    
    # Format traffic data for frontend
    import time
    from main import traffic_stats
    
    traffic = []
    current_minute = int(time.time() // 60) * 60
    
    # Return last 10 minutes (even if 0)
    for i in range(10, -1, -1):
        minute_ts = current_minute - (i * 60)
        from datetime import datetime
        time_str = datetime.fromtimestamp(minute_ts).strftime("%H:%M")
        traffic.append({
            "time": time_str,
            "hits": traffic_stats.get(minute_ts, 0)
        })
        
    stats["traffic"] = traffic
    return stats


@router.get("/users")
def list_users(
    skip: int = 0,
    limit: int = 50,
    user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """List all users."""
    users = crud.get_all_users(db, skip=skip, limit=limit)
    total = crud.get_user_count(db)

    return {
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "name": u.name,
                "role": u.role,
                "xp": u.xp,
                "created_at": u.created_at.isoformat(),
                "document_count": len(u.documents) if u.documents else 0,
            }
            for u in users
        ],
        "total": total,
    }


@router.get("/documents")
def list_all_documents(
    skip: int = 0,
    limit: int = 50,
    user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """List all documents across all users."""
    docs = crud.get_all_documents(db, skip=skip, limit=limit)
    total = crud.get_document_count(db)

    return {
        "documents": [
            {
                "id": d.id,
                "filename": d.original_filename,
                "file_type": d.file_type,
                "file_size": d.file_size,
                "status": d.status,
                "user_id": d.user_id,
                "created_at": d.created_at.isoformat(),
            }
            for d in docs
        ],
        "total": total,
    }


@router.delete("/documents/{doc_id}")
def admin_delete_document(
    doc_id: str,
    user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Admin delete a document."""
    doc = crud.get_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    from pathlib import Path
    file_path = Path(doc.storage_url) if doc.storage_url else None
    if file_path and file_path.exists():
        file_path.unlink()

    crud.delete_document(db, doc_id)
    return {"message": "Document deleted"}
