"""
Chat Routes.
RAG-powered Q&A with streaming responses.
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
from config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    document_id: str
    message: str
    top_k: int = 6


class ChatMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    sources: list | None
    created_at: str


@router.post("/{doc_id}")
async def chat_with_document(
    doc_id: str,
    req: ChatRequest,
    user=Depends(get_current_or_guest_user),
    db: Session = Depends(get_db),
):
    """
    Chat with a document using RAG.
    Returns a streaming response (SSE).
    """
    # Verify document access
    doc = crud.get_document(db, doc_id)
    if not doc or doc.user_id != user.id:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.status != "ready":
        raise HTTPException(status_code=400, detail="Document is still processing")

    # Save user message
    crud.create_chat_message(
        db=db,
        document_id=doc_id,
        user_id=user.id,
        role="user",
        content=req.message,
    )

    # Stream the response
    return StreamingResponse(
        _generate_rag_stream(doc_id, user.id, req.message, req.top_k, db),
        media_type="text/event-stream",
    )


async def _generate_rag_stream(
    doc_id: str, user_id: str, question: str, top_k: int, db: Session
):
    """Generate a streaming RAG response as SSE events."""
    from core.vector_store import get_vector_store
    from core.llm_engine import get_llm_engine
    from utils.prompt_templates import RAG_SYSTEM_PROMPT, build_rag_prompt

    try:
        vs = get_vector_store()
        llm = get_llm_engine()

        # Retrieve relevant chunks
        results = vs.search_by_doc(question, doc_id, top_k=top_k)

        # Build context
        context_parts = []
        sources = []
        seen = set()
        for r in results:
            page = r["metadata"].get("page", "?")
            context_parts.append(f"[Page {page}]\n{r['text']}")

            key = f"p{page}"
            if key not in seen:
                sources.append({
                    "page": page,
                    "score": round(r["score"], 3),
                })
                seen.add(key)

        context = "\n\n---\n\n".join(context_parts) if context_parts else "No relevant context found."
        prompt = build_rag_prompt(question, context)

        # Stream LLM response
        full_response = ""
        try:
            for chunk in llm.generate_stream(prompt=prompt, system_prompt=RAG_SYSTEM_PROMPT):
                full_response += chunk
                # SSE format
                yield f"data: {json.dumps({'type': 'token', 'content': chunk})}\n\n"
        except Exception as e:
            logger.error(f"RAG stream error: {e}")
            error_msg = str(e).replace('\n', ' ')
            # Check for common API key issues (e.g., Google/Gemini or generic)
            if "API_KEY" in error_msg.upper() or "api_key" in error_msg.lower():
                yield f"data: {json.dumps({'type': 'error', 'content': '⚠️ **API Key Missing or Invalid** - Please check your .env configuration.'})}\n\n"
            else:
                yield f"data: {json.dumps({'type': 'error', 'content': 'An error occurred while generating the response.'})}\n\n"
            return

        # Send sources
        yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"

        # Send done signal
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

        # Save assistant message to DB
        from db.database import SessionLocal
        save_db = SessionLocal()
        try:
            crud.create_chat_message(
                db=save_db,
                document_id=doc_id,
                user_id=user_id,
                role="assistant",
                content=full_response,
                sources=sources,
            )
        finally:
            save_db.close()

    except Exception as e:
        logger.error(f"RAG stream error: {e}")
        yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"


@router.get("/{doc_id}/history")
def get_chat_history(
    doc_id: str,
    user=Depends(get_current_or_guest_user),
    db: Session = Depends(get_db),
):
    """Get chat history for a document."""
    doc = crud.get_document(db, doc_id)
    if not doc or doc.user_id != user.id:
        raise HTTPException(status_code=404, detail="Document not found")

    messages = crud.get_chat_history(db, doc_id, user.id)

    return {
        "messages": [
            ChatMessageResponse(
                id=m.id,
                role=m.role,
                content=m.content,
                sources=m.sources,
                created_at=m.created_at.isoformat(),
            )
            for m in messages
        ]
    }
