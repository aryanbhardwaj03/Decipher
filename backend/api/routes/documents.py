"""
Document Routes.
Upload, list, get, delete, and manage documents.
"""

import base64
import logging
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from config import settings, UPLOAD_DIR
from db.database import get_db
from db import crud
from api.middleware.auth import get_current_or_guest_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/documents", tags=["documents"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".pptx", ".ppt", ".doc", ".txt", ".md"}


# ── Schemas ───────────────────────────────────────────────────────────────

class DocumentResponse(BaseModel):
    id: str
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    status: str
    pages: int
    word_count: int
    image_count: int
    table_count: int
    reading_time_minutes: int
    estimated_difficulty: str | None
    is_favorite: bool
    created_at: str

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total: int


# ── Routes ────────────────────────────────────────────────────────────────

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    user=Depends(get_current_or_guest_user),
    db: Session = Depends(get_db),
):
    """Upload a document for processing."""
    # Validate file type
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Upload limits based on plan
    if user.role == "guest" or user.provider == "guest":
        from datetime import datetime, timedelta
        from db.models import Document
        one_week_ago = datetime.utcnow() - timedelta(days=7)
        recent_uploads = db.query(Document).filter(
            Document.user_id == user.id,
            Document.created_at >= one_week_ago
        ).count()
        if recent_uploads >= 10:
            raise HTTPException(
                status_code=429,
                detail="Guest upload limit reached (10 documents per week). Please sign up to upload more.",
            )
    elif getattr(user, 'plan', 'Basic') == "Basic":
        from db.models import Document
        total_uploads = db.query(Document).filter(Document.user_id == user.id).count()
        if total_uploads >= 30:
            raise HTTPException(
                status_code=429,
                detail="Basic plan limit reached (30 documents). Please upgrade to Plus or Pro for unlimited uploads.",
            )

    # Read file content
    content = await file.read()
    file_size = len(content)

    # Check size limit
    if file_size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.MAX_UPLOAD_SIZE_MB} MB",
        )

    # Save file locally
    import uuid
    safe_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = UPLOAD_DIR / safe_filename
    with open(file_path, "wb") as f:
        f.write(content)

    # Create DB record
    doc = crud.create_document(
        db=db,
        user_id=user.id,
        filename=safe_filename,
        original_filename=file.filename,
        file_type=ext.lstrip("."),
        file_size=file_size,
        storage_url=str(file_path),
    )

    # Process document in background
    background_tasks.add_task(process_document_task, doc.id, str(file_path), ext.lstrip("."))

    return DocumentResponse(
        id=doc.id,
        filename=doc.filename,
        original_filename=doc.original_filename,
        file_type=doc.file_type,
        file_size=doc.file_size,
        status=doc.status,
        pages=doc.pages or 0,
        word_count=doc.word_count or 0,
        image_count=doc.image_count or 0,
        table_count=doc.table_count or 0,
        reading_time_minutes=doc.reading_time_minutes or 0,
        estimated_difficulty=doc.estimated_difficulty,
        is_favorite=doc.is_favorite or False,
        created_at=doc.created_at.isoformat(),
    )


@router.get("", response_model=DocumentListResponse)
def list_documents(
    skip: int = 0,
    limit: int = 50,
    user=Depends(get_current_or_guest_user),
    db: Session = Depends(get_db),
):
    """List user's documents."""
    docs = crud.get_user_documents(db, user.id, skip=skip, limit=limit)

    return DocumentListResponse(
        documents=[
            DocumentResponse(
                id=d.id,
                filename=d.filename,
                original_filename=d.original_filename,
                file_type=d.file_type,
                file_size=d.file_size,
                status=d.status,
                pages=d.pages or 0,
                word_count=d.word_count or 0,
                image_count=d.image_count or 0,
                table_count=d.table_count or 0,
                reading_time_minutes=d.reading_time_minutes or 0,
                estimated_difficulty=d.estimated_difficulty,
                is_favorite=d.is_favorite or False,
                created_at=d.created_at.isoformat(),
            )
            for d in docs
        ],
        total=len(docs),
    )


@router.get("/{doc_id}", response_model=DocumentResponse)
def get_document(
    doc_id: str,
    user=Depends(get_current_or_guest_user),
    db: Session = Depends(get_db),
):
    """Get a specific document."""
    doc = crud.get_document(db, doc_id)
    if not doc or (doc.user_id != user.id and user.role != "admin"):
        raise HTTPException(status_code=404, detail="Document not found")

    return DocumentResponse(
        id=doc.id,
        filename=doc.filename,
        original_filename=doc.original_filename,
        file_type=doc.file_type,
        file_size=doc.file_size,
        status=doc.status,
        pages=doc.pages or 0,
        word_count=doc.word_count or 0,
        image_count=doc.image_count or 0,
        table_count=doc.table_count or 0,
        reading_time_minutes=doc.reading_time_minutes or 0,
        estimated_difficulty=doc.estimated_difficulty,
        is_favorite=doc.is_favorite or False,
        created_at=doc.created_at.isoformat(),
    )


@router.get("/{doc_id}/file")
def get_document_file(
    doc_id: str,
    user=Depends(get_current_or_guest_user),
    db: Session = Depends(get_db),
):
    """Get the raw document file."""
    doc = crud.get_document(db, doc_id)
    if not doc or (doc.user_id != user.id and user.role != "admin"):
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = Path(doc.storage_url)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on server")

    return FileResponse(
        path=file_path,
        filename=doc.original_filename,
        media_type="application/octet-stream"
    )


@router.delete("/{doc_id}")
def delete_document(
    doc_id: str,
    user=Depends(get_current_or_guest_user),
    db: Session = Depends(get_db),
):
    """Delete a document."""
    doc = crud.get_document(db, doc_id)
    if not doc or doc.user_id != user.id:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete file
    file_path = Path(doc.storage_url) if doc.storage_url else None
    if file_path and file_path.exists():
        file_path.unlink()

    # Remove from vector store
    from core.vector_store import get_vector_store
    vs = get_vector_store()
    vs.remove_source(doc.id)

    # Delete DB record
    crud.delete_document(db, doc_id)

    return {"message": "Document deleted successfully"}


@router.patch("/{doc_id}/favorite")
def toggle_document_favorite(
    doc_id: str,
    user=Depends(get_current_or_guest_user),
    db: Session = Depends(get_db),
):
    """Toggle document favorite status."""
    doc = crud.get_document(db, doc_id)
    if not doc or doc.user_id != user.id:
        raise HTTPException(status_code=404, detail="Document not found")

    updated = crud.toggle_favorite(db, doc_id)
    return {"is_favorite": updated.is_favorite}


# ── Background Processing ─────────────────────────────────────────────────

def process_document_task(doc_id: str, file_path: str, file_type: str):
    """Background task: process and index a document."""
    from db.database import SessionLocal
    from core.document_processor import UniversalDocumentProcessor
    from core.vector_store import get_vector_store

    db = SessionLocal()
    try:
        processor = UniversalDocumentProcessor()
        result = processor.process(file_path, file_type)

        # Index chunks in vector store
        vs = get_vector_store()
        if result["chunks"]:
            # Tag chunks with document ID
            for chunk in result["chunks"]:
                chunk.metadata["doc_id"] = doc_id
            vs.add_chunks(result["chunks"])

        # Store figures
        for i, img_info in enumerate(result.get("images", [])):
            try:
                import io
                buf = io.BytesIO()
                img_info["image"].save(buf, format="PNG")
                img_b64 = base64.b64encode(buf.getvalue()).decode()

                crud.create_figure(
                    db=db,
                    document_id=doc_id,
                    page=img_info.get("page", 0),
                    image_data=img_b64,
                    width=img_info.get("size", (0, 0))[0] if "size" in img_info else 0,
                    height=img_info.get("size", (0, 0))[1] if "size" in img_info else 0,
                )
            except Exception as e:
                logger.warning(f"Failed to save figure {i}: {e}")

        # Estimate reading difficulty
        total_text = " ".join([c.text for c in result["chunks"]])
        word_count = len(total_text.split())
        avg_word_len = sum(len(w) for w in total_text.split()) / max(word_count, 1)
        difficulty = "easy" if avg_word_len < 5 else "hard" if avg_word_len > 7 else "medium"

        # Update document status
        crud.update_document_status(
            db=db,
            doc_id=doc_id,
            status="ready",
            pages=result["metadata"].get("total_pages", 0),
            word_count=word_count,
            image_count=len(result.get("images", [])),
            table_count=len(result.get("tables", [])),
            reading_time_minutes=max(1, word_count // 200),
            estimated_difficulty=difficulty,
        )

        logger.info(f"Document {doc_id} processed successfully: {word_count} words, {len(result['chunks'])} chunks")

    except Exception as e:
        logger.error(f"Document processing failed for {doc_id}: {e}")
        crud.update_document_status(
            db=db, doc_id=doc_id, status="error", error_message=str(e)
        )
    finally:
        db.close()
