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

    # Fetch chat history for context before DB session closes
    # Limit to last 6 messages (3 turns)
    chat_history_records = crud.get_chat_history(db, doc_id, user.id, limit=6)

    # Build conversation context and enhanced search query here
    conversation_context = ""
    for msg in chat_history_records:
        role = "User" if msg.role == "user" else "AI"
        conversation_context += f"{role}: {msg.content}\n\n"

    search_query = req.message
    if len(chat_history_records) >= 2:
        previous_msg = chat_history_records[-2].content
        search_query = f"{previous_msg} {req.message}"

    # Stream the response
    return StreamingResponse(
        _generate_rag_stream(
            doc_id=doc_id,
            user_id=user.id,
            question=req.message,
            search_query=search_query,
            conversation_context=conversation_context,
            top_k=req.top_k,
        ),
        media_type="text/event-stream",
    )


async def _generate_rag_stream(
    doc_id: str,
    user_id: str,
    question: str,
    search_query: str,
    conversation_context: str,
    top_k: int,
):
    """Generate a streaming RAG response as SSE events."""
    from core.vector_store import get_vector_store
    from core.llm_engine import get_llm_engine
    from utils.prompt_templates import RAG_SYSTEM_PROMPT
    from db import crud

    try:
        vs = get_vector_store()
        llm = get_llm_engine()

        # Retrieve relevant chunks using the enhanced search query
        results = vs.search_by_doc(search_query, doc_id, top_k=top_k)

        # Build context
        context_parts = []
        sources = []
        seen = set()
        import math
        for r in results:
            page = r["metadata"].get("page", "?")
            context_parts.append(f"[Page {page}]\n{r['text']}")

            key = f"p{page}"
            if key not in seen:
                raw_score = r.get("score", 0.0)
                score_val = float(raw_score) if raw_score is not None else 0.0
                if math.isnan(score_val):
                    score_val = 0.0
                
                sources.append({
                    "page": page,
                    "score": round(score_val, 3),
                })
                seen.add(key)

        context_text = "\n\n---\n\n".join(context_parts) if context_parts else "No relevant context found."
        # Construct the final prompt with conversation history and retrieved context
        prompt = (
            f"Here is the conversation history so far:\n{conversation_context}\n"
            f"Here is the retrieved context from the document:\n{context_text}\n\n"
            f"Current question: {question}"
        )

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
