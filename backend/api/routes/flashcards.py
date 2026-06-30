"""
Flashcard Routes.
Generate and manage flashcard decks.
"""

import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.database import get_db
from db import crud
from api.middleware.auth import get_current_or_guest_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/flashcards", tags=["flashcards"])


class FlashcardGenerateRequest(BaseModel):
    num_cards: int = 15
    topic_focus: str = ""


@router.post("/{doc_id}/generate")
def generate_flashcards(
    doc_id: str,
    req: FlashcardGenerateRequest,
    user=Depends(get_current_or_guest_user),
    db: Session = Depends(get_db),
):
    """Generate flashcards from a document."""
    doc = crud.get_document(db, doc_id)
    if not doc or doc.user_id != user.id:
        raise HTTPException(status_code=404, detail="Document not found")

    from core.vector_store import get_vector_store
    from core.llm_engine import get_llm_engine

    vs = get_vector_store()
    llm = get_llm_engine()

    query = req.topic_focus or "key concepts, definitions, important terms, formulas"
    results = vs.search_by_doc(query, doc_id, top_k=12)

    if not results:
        raise HTTPException(status_code=400, detail="This type of content is not given in PDF")

    combined = "\n\n".join([r["text"] for r in results])[:6000]

    prompt = f"""Generate exactly {req.num_cards} flashcards from the following content.

Return ONLY a JSON array where each item has:
- "front": The question or term (concise)
- "back": The answer or definition (clear and complete)
- "difficulty": "easy", "medium", or "hard"

Example format:
[
  {{"front": "What is photosynthesis?", "back": "The process by which plants convert sunlight into energy...", "difficulty": "easy"}},
  ...
]

Content:
{combined}

Return ONLY the JSON array, no other text."""

    response = llm.generate(
        prompt=prompt,
        system_prompt="You are an expert flashcard creator. Generate high-quality study flashcards. Return ONLY valid JSON.",
        temperature=0.4,
    )

    # Parse cards
    cards = _parse_cards_json(response)
    if not cards:
        raise HTTPException(status_code=500, detail="Failed to generate flashcards. Try again.")

    # Save to DB
    deck = crud.create_flashcard_deck(
        db=db,
        document_id=doc_id,
        user_id=user.id,
        cards=cards,
    )

    return {
        "deck_id": deck.id,
        "cards": cards,
        "total": len(cards),
    }


@router.get("/{doc_id}")
def get_flashcards(
    doc_id: str,
    user=Depends(get_current_or_guest_user),
    db: Session = Depends(get_db),
):
    """Get existing flashcard deck for a document."""
    deck = crud.get_flashcard_deck(db, doc_id, user.id)
    if not deck:
        return {"deck_id": None, "cards": [], "total": 0}

    return {
        "deck_id": deck.id,
        "cards": deck.cards,
        "total": deck.total_cards,
        "progress": deck.progress,
    }


@router.patch("/{deck_id}/progress")
def update_progress(
    deck_id: str,
    progress: int,
    user=Depends(get_current_or_guest_user),
    db: Session = Depends(get_db),
):
    """Update flashcard study progress."""
    from db.models import FlashcardDeck
    deck = db.query(FlashcardDeck).filter(FlashcardDeck.id == deck_id).first()
    if not deck or deck.user_id != user.id:
        raise HTTPException(status_code=404, detail="Deck not found")

    deck.progress = progress
    db.commit()
    return {"progress": progress}


def _parse_cards_json(response: str) -> list:
    """Parse flashcard JSON from LLM response."""
    try:
        start = response.find("[")
        end = response.rfind("]") + 1
        if start >= 0 and end > start:
            return json.loads(response[start:end])
    except json.JSONDecodeError:
        pass
    return []
