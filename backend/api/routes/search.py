"""
Search Routes.
Semantic + keyword search inside documents.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.database import get_db
from db import crud
from api.middleware.auth import get_current_or_guest_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/search", tags=["search"])


class SearchRequest(BaseModel):
    query: str
    mode: str = "semantic"  # "semantic", "keyword", "hybrid"
    top_k: int = 10


@router.post("/{doc_id}")
def search_document(
    doc_id: str,
    req: SearchRequest,
    user=Depends(get_current_or_guest_user),
    db: Session = Depends(get_db),
):
    """Search within a document."""
    doc = crud.get_document(db, doc_id)
    if not doc or doc.user_id != user.id:
        raise HTTPException(status_code=404, detail="Document not found")

    from core.vector_store import get_vector_store

    vs = get_vector_store()
    results = []

    if req.mode in ("semantic", "hybrid"):
        semantic_results = vs.search_by_doc(req.query, doc_id, top_k=req.top_k)
        for r in semantic_results:
            results.append({
                "text": r["text"],
                "page": r["metadata"].get("page", 0),
                "score": round(r["score"], 3),
                "type": "semantic",
                "highlight": _highlight_text(r["text"], req.query),
            })

    if req.mode in ("keyword", "hybrid"):
        # Keyword search through stored chunks
        keyword_results = vs.keyword_search(req.query, doc_id, top_k=req.top_k)
        for r in keyword_results:
            results.append({
                "text": r["text"],
                "page": r["metadata"].get("page", 0),
                "score": r.get("score", 0.5),
                "type": "keyword",
                "highlight": _highlight_text(r["text"], req.query),
            })

    # Deduplicate
    seen = set()
    unique = []
    for r in results:
        key = r["text"][:100]
        if key not in seen:
            unique.append(r)
            seen.add(key)

    # Sort by score
    unique.sort(key=lambda x: x["score"], reverse=True)

    return {
        "results": unique[:req.top_k],
        "total": len(unique),
        "query": req.query,
        "mode": req.mode,
    }


def _highlight_text(text: str, query: str) -> str:
    """Add highlight markers around query terms in text."""
    words = query.lower().split()
    highlighted = text
    for word in words:
        if len(word) > 2:
            import re
            pattern = re.compile(re.escape(word), re.IGNORECASE)
            highlighted = pattern.sub(f"**{word}**", highlighted)
    return highlighted
