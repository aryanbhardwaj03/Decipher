"""
Summary Routes.
Generate multiple types of document summaries.
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

router = APIRouter(prefix="/api/summary", tags=["summary"])

SUMMARY_TYPES = ["short", "detailed", "bullet", "takeaways", "executive", "beginner", "technical"]


class SummaryRequest(BaseModel):
    summary_type: str = "detailed"
    custom_focus: str = ""


@router.post("/{doc_id}")
async def generate_summary(
    doc_id: str,
    req: SummaryRequest,
    user=Depends(get_current_or_guest_user),
    db: Session = Depends(get_db),
):
    """Generate a summary of a document. Returns streaming SSE."""
    doc = crud.get_document(db, doc_id)
    if not doc or doc.user_id != user.id:
        raise HTTPException(status_code=404, detail="Document not found")

    if req.summary_type not in SUMMARY_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid summary type. Options: {', '.join(SUMMARY_TYPES)}",
        )

    # Check for cached summary
    existing = crud.get_summary(db, doc_id, req.summary_type)
    if existing and not req.custom_focus:
        return {"content": existing.content, "cached": True}

    return StreamingResponse(
        _generate_summary_stream(doc_id, req.summary_type, req.custom_focus, db),
        media_type="text/event-stream",
    )


async def _generate_summary_stream(
    doc_id: str, summary_type: str, custom_focus: str, db: Session
):
    """Stream a summary generation."""
    from core.vector_store import get_vector_store
    from core.llm_engine import get_llm_engine
    from utils.prompt_templates import SUMMARIZER_SYSTEM_PROMPT, build_summary_prompt

    try:
        vs = get_vector_store()
        llm = get_llm_engine()

        query = custom_focus or "main findings, methodology, results, conclusions, key points"
        results = vs.search_by_doc(query, doc_id, top_k=15)

        if not results:
            yield f"data: {json.dumps({'type': 'error', 'content': 'This type of content is not given in PDF.'})}\n\n"
            return

        combined = "\n\n".join([r["text"] for r in results])[:8000]
        prompt = build_summary_prompt(combined, level=summary_type)

        if custom_focus:
            prompt += f"\n\n## Additional Focus\n{custom_focus}"

        full_response = ""
        try:
            for chunk in llm.generate_stream(prompt=prompt, system_prompt=SUMMARIZER_SYSTEM_PROMPT):
                full_response += chunk
                yield f"data: {json.dumps({'type': 'token', 'content': chunk})}\n\n"
        except Exception as e:
            logger.error(f"Summary stream error: {e}")
            error_msg = str(e).replace('\n', ' ')
            if "API_KEY" in error_msg.upper() or "api_key" in error_msg.lower():
                yield f"data: {json.dumps({'type': 'error', 'content': '⚠️ **API Key Missing** - Please configure your .env file to enable AI summaries.'})}\n\n"
            else:
                yield f"data: {json.dumps({'type': 'error', 'content': f'Error generating summary: {error_msg}'})}\n\n"
            return

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

        # Cache the summary
        from db.database import SessionLocal
        save_db = SessionLocal()
        try:
            if not custom_focus:
                crud.create_summary(save_db, doc_id, summary_type, full_response)
        finally:
            save_db.close()

    except Exception as e:
        logger.error(f"Summary generation error: {e}")
        error_msg = str(e).replace('\n', ' ')
        if "API_KEY" in error_msg.upper() or "api_key" in error_msg.lower():
            yield f"data: {json.dumps({'type': 'error', 'content': '⚠️ **API Key Missing** - Please configure your .env file to enable AI summaries.'})}\n\n"
        else:
            yield f"data: {json.dumps({'type': 'error', 'content': error_msg})}\n\n"


@router.get("/{doc_id}/types")
def list_available_summaries(
    doc_id: str,
    user=Depends(get_current_or_guest_user),
    db: Session = Depends(get_db),
):
    """List which summary types have been generated."""
    doc = crud.get_document(db, doc_id)
    if not doc or doc.user_id != user.id:
        raise HTTPException(status_code=404, detail="Document not found")

    available = {}
    for st in SUMMARY_TYPES:
        existing = crud.get_summary(db, doc_id, st)
        available[st] = existing is not None

    return {"types": SUMMARY_TYPES, "available": available}
