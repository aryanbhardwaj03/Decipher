"""
Notes Routes.
Generate various types of study notes.
"""

import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.database import get_db
from db import crud
from api.middleware.auth import get_current_or_guest_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/notes", tags=["notes"])

NOTE_TYPES = {
    "smart": "Comprehensive smart notes with key insights, connections, and takeaways",
    "revision": "Concise revision notes optimized for quick review before exams",
    "formulas": "A formula sheet listing all mathematical equations, formulas, and calculations",
    "definitions": "Important definitions and terminology with clear explanations",
    "dates": "Key dates, timelines, and chronological events mentioned",
    "concepts": "Core concepts and fundamental ideas explained clearly",
}


class NotesRequest(BaseModel):
    note_type: str = "smart"
    custom_focus: str = ""


@router.post("/{doc_id}")
async def generate_notes(
    doc_id: str,
    req: NotesRequest,
    user=Depends(get_current_or_guest_user),
    db: Session = Depends(get_db),
):
    """Generate study notes from a document."""
    doc = crud.get_document(db, doc_id)
    if not doc or doc.user_id != user.id:
        raise HTTPException(status_code=404, detail="Document not found")

    if req.note_type not in NOTE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid note type. Options: {', '.join(NOTE_TYPES.keys())}",
        )

    # Check for cached notes
    existing = crud.get_note(db, doc_id, req.note_type)
    if existing and not req.custom_focus:
        return {"content": existing.content, "cached": True}

    return StreamingResponse(
        _generate_notes_stream(doc_id, req.note_type, req.custom_focus, db),
        media_type="text/event-stream",
    )


async def _generate_notes_stream(
    doc_id: str, note_type: str, custom_focus: str, db: Session
):
    """Stream notes generation."""
    from core.vector_store import get_vector_store
    from core.llm_engine import get_llm_engine

    try:
        vs = get_vector_store()
        llm = get_llm_engine()

        description = NOTE_TYPES[note_type]
        query = custom_focus or description
        results = vs.search_by_doc(query, doc_id, top_k=15)

        if not results:
            yield f"data: {json.dumps({'type': 'error', 'content': 'This type of content is not given in PDF.'})}\n\n"
            return

        combined = "\n\n".join([r["text"] for r in results])[:8000]

        prompt = f"""Generate {description} from the following document content.

## Requirements
- Use clear markdown formatting
- Be thorough and well-organized
- Use headers, bullet points, and tables where appropriate
- Make the notes genuinely useful for studying

{f'## Special Focus: {custom_focus}' if custom_focus else ''}

## Content
{combined}"""

        system = "You are an expert study assistant. Generate high-quality, well-structured study notes."

        full_response = ""
        for chunk in llm.generate_stream(prompt=prompt, system_prompt=system):
            full_response += chunk
            yield f"data: {json.dumps({'type': 'token', 'content': chunk})}\n\n"

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

        # Cache notes
        from db.database import SessionLocal
        save_db = SessionLocal()
        try:
            if not custom_focus:
                crud.create_note(save_db, doc_id, note_type, full_response)
        finally:
            save_db.close()

    except Exception as e:
        logger.error(f"Notes generation error: {e}")
        yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"


@router.get("/{doc_id}/types")
def list_note_types(
    doc_id: str,
    user=Depends(get_current_or_guest_user),
    db: Session = Depends(get_db),
):
    """List available note types and which are cached."""
    doc = crud.get_document(db, doc_id)
    if not doc or doc.user_id != user.id:
        raise HTTPException(status_code=404, detail="Document not found")

    available = {}
    for nt in NOTE_TYPES:
        existing = crud.get_note(db, doc_id, nt)
        available[nt] = existing is not None

    return {
        "types": {k: {"description": v, "cached": available[k]} for k, v in NOTE_TYPES.items()},
    }
