"""
CRUD Operations.
Database create/read/update/delete operations for all models.
"""

from datetime import datetime
from typing import Optional

# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]
from sqlalchemy import desc, func

from db.models import (
    User, Document, ChatMessage, Summary, Quiz,
    FlashcardDeck, Note, Figure, generate_uuid, XPTransaction,
)


# ═══════════════════════════════════════════════════════════════════════
#  USERS
# ═══════════════════════════════════════════════════════════════════════

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def create_user(
    db: Session,
    email: str,
    name: str = "",
    avatar_url: str = "",
    hashed_password: str = "",
    provider: str = "credentials",
    role: str = "user",
) -> User:
    user = User(
        id=generate_uuid(),
        email=email,
        name=name,
        avatar_url=avatar_url,
        hashed_password=hashed_password,
        provider=provider,
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user_xp(db: Session, user_id: str, xp_delta: int, reason: str = "Bonus") -> User:
    from datetime import timedelta
    user = get_user_by_id(db, user_id)
    if user:
        user.xp = (user.xp or 0) + xp_delta
        
        tx = XPTransaction(
            id=generate_uuid(),
            user_id=user_id,
            amount=xp_delta,
            reason=reason
        )
        db.add(tx)
        db.commit()
        
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        weekly_xp_result = db.query(func.sum(XPTransaction.amount)).filter(
            XPTransaction.user_id == user_id,
            XPTransaction.created_at >= seven_days_ago
        ).scalar()
        
        weekly_xp = weekly_xp_result or 0
        
        if weekly_xp >= 100 and (user.plan == "Basic" or not user.plan):
            user.plan = "Plus"
        elif weekly_xp < 100 and user.plan == "Plus":
            user.plan = "Basic"
            
        db.commit()
        db.refresh(user)
    return user


def get_all_users(db: Session, skip: int = 0, limit: int = 50) -> list[User]:
    return db.query(User).order_by(desc(User.created_at)).offset(skip).limit(limit).all()


def get_user_count(db: Session) -> int:
    return db.query(func.count(User.id)).scalar()


# ═══════════════════════════════════════════════════════════════════════
#  DOCUMENTS
# ═══════════════════════════════════════════════════════════════════════

def create_document(
    db: Session,
    user_id: str,
    filename: str,
    original_filename: str,
    file_type: str,
    file_size: int,
    storage_url: str = "",
) -> Document:
    doc = Document(
        id=generate_uuid(),
        user_id=user_id,
        filename=filename,
        original_filename=original_filename,
        file_type=file_type,
        file_size=file_size,
        storage_url=storage_url,
        status="processing",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def get_document(db: Session, doc_id: str) -> Optional[Document]:
    return db.query(Document).filter(Document.id == doc_id).first()


def get_user_documents(
    db: Session, user_id: str, skip: int = 0, limit: int = 50
) -> list[Document]:
    return (
        db.query(Document)
        .filter(Document.user_id == user_id)
        .order_by(desc(Document.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_document_status(
    db: Session, doc_id: str, status: str, error_message: str = None, **kwargs
) -> Optional[Document]:
    doc = get_document(db, doc_id)
    if doc:
        doc.status = status
        doc.error_message = error_message
        for key, value in kwargs.items():
            if hasattr(doc, key):
                setattr(doc, key, value)
        doc.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(doc)
    return doc


def delete_document(db: Session, doc_id: str) -> bool:
    doc = get_document(db, doc_id)
    if doc:
        db.delete(doc)
        db.commit()
        return True
    return False


def toggle_favorite(db: Session, doc_id: str) -> Optional[Document]:
    doc = get_document(db, doc_id)
    if doc:
        doc.is_favorite = not doc.is_favorite
        db.commit()
        db.refresh(doc)
    return doc


def get_document_count(db: Session) -> int:
    return db.query(func.count(Document.id)).scalar()


def get_all_documents(db: Session, skip: int = 0, limit: int = 50) -> list[Document]:
    return db.query(Document).order_by(desc(Document.created_at)).offset(skip).limit(limit).all()


# ═══════════════════════════════════════════════════════════════════════
#  CHAT MESSAGES
# ═══════════════════════════════════════════════════════════════════════

def create_chat_message(
    db: Session,
    document_id: str,
    user_id: str,
    role: str,
    content: str,
    sources: list = None,
) -> ChatMessage:
    msg = ChatMessage(
        id=generate_uuid(),
        document_id=document_id,
        user_id=user_id,
        role=role,
        content=content,
        sources=sources,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def get_chat_history(
    db: Session, document_id: str, user_id: str, limit: int = 50
) -> list[ChatMessage]:
    return (
        db.query(ChatMessage)
        .filter(
            ChatMessage.document_id == document_id,
            ChatMessage.user_id == user_id,
        )
        .order_by(ChatMessage.created_at)
        .limit(limit)
        .all()
    )


# ═══════════════════════════════════════════════════════════════════════
#  SUMMARIES
# ═══════════════════════════════════════════════════════════════════════

def create_summary(
    db: Session, document_id: str, summary_type: str, content: str
) -> Summary:
    s = Summary(
        id=generate_uuid(),
        document_id=document_id,
        summary_type=summary_type,
        content=content,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


def get_summary(
    db: Session, document_id: str, summary_type: str
) -> Optional[Summary]:
    return (
        db.query(Summary)
        .filter(
            Summary.document_id == document_id,
            Summary.summary_type == summary_type,
        )
        .first()
    )


# ═══════════════════════════════════════════════════════════════════════
#  QUIZZES
# ═══════════════════════════════════════════════════════════════════════

def create_quiz(
    db: Session,
    document_id: str,
    user_id: str,
    questions: list,
    difficulty: str = "medium",
) -> Quiz:
    q = Quiz(
        id=generate_uuid(),
        document_id=document_id,
        user_id=user_id,
        questions=questions,
        total=len(questions),
        difficulty=difficulty,
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return q


def update_quiz_score(
    db: Session, quiz_id: str, score: int, xp_earned: int
) -> Optional[Quiz]:
    q = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if q:
        q.score = score
        q.xp_earned = xp_earned
        q.completed = True
        db.commit()
        db.refresh(q)
    return q


def get_user_quizzes(db: Session, user_id: str, limit: int = 20) -> list[Quiz]:
    return (
        db.query(Quiz)
        .filter(Quiz.user_id == user_id)
        .order_by(desc(Quiz.created_at))
        .limit(limit)
        .all()
    )


# ═══════════════════════════════════════════════════════════════════════
#  FLASHCARDS
# ═══════════════════════════════════════════════════════════════════════

def create_flashcard_deck(
    db: Session, document_id: str, user_id: str, cards: list
) -> FlashcardDeck:
    deck = FlashcardDeck(
        id=generate_uuid(),
        document_id=document_id,
        user_id=user_id,
        cards=cards,
        total_cards=len(cards),
    )
    db.add(deck)
    db.commit()
    db.refresh(deck)
    return deck


def get_flashcard_deck(
    db: Session, document_id: str, user_id: str
) -> Optional[FlashcardDeck]:
    return (
        db.query(FlashcardDeck)
        .filter(
            FlashcardDeck.document_id == document_id,
            FlashcardDeck.user_id == user_id,
        )
        .order_by(desc(FlashcardDeck.created_at))
        .first()
    )


# ═══════════════════════════════════════════════════════════════════════
#  NOTES
# ═══════════════════════════════════════════════════════════════════════

def create_note(
    db: Session, document_id: str, note_type: str, content: str
) -> Note:
    n = Note(
        id=generate_uuid(),
        document_id=document_id,
        note_type=note_type,
        content=content,
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    return n


def get_note(
    db: Session, document_id: str, note_type: str
) -> Optional[Note]:
    return (
        db.query(Note)
        .filter(Note.document_id == document_id, Note.note_type == note_type)
        .first()
    )


# ═══════════════════════════════════════════════════════════════════════
#  FIGURES
# ═══════════════════════════════════════════════════════════════════════

def create_figure(
    db: Session,
    document_id: str,
    page: int,
    image_data: str = "",
    image_url: str = "",
    width: int = 0,
    height: int = 0,
) -> Figure:
    fig = Figure(
        id=generate_uuid(),
        document_id=document_id,
        page=page,
        image_data=image_data,
        image_url=image_url,
        width=width,
        height=height,
    )
    db.add(fig)
    db.commit()
    db.refresh(fig)
    return fig


def get_document_figures(db: Session, document_id: str) -> list[Figure]:
    return (
        db.query(Figure)
        .filter(Figure.document_id == document_id)
        .order_by(Figure.page)
        .all()
    )


# ═══════════════════════════════════════════════════════════════════════
#  ADMIN STATS
# ═══════════════════════════════════════════════════════════════════════

def get_admin_stats(db: Session) -> dict:
    total_users = db.query(func.count(User.id)).scalar()
    total_documents = db.query(func.count(Document.id)).scalar()
    total_quizzes = db.query(func.count(Quiz.id)).scalar()
    total_storage = db.query(func.sum(Document.file_size)).scalar() or 0

    file_type_dist = (
        db.query(Document.file_type, func.count(Document.id))
        .group_by(Document.file_type)
        .all()
    )

    return {
        "total_users": total_users,
        "total_documents": total_documents,
        "total_quizzes": total_quizzes,
        "total_storage_bytes": total_storage,
        "file_type_distribution": {ft: count for ft, count in file_type_dist},
    }

# ═══════════════════════════════════════════════════════════════════════
#  GUEST MIGRATION
# ═══════════════════════════════════════════════════════════════════════

def migrate_guest_data(db: Session, guest_id: str, new_user_id: str):
    """Migrate all data from a guest user to a registered user."""
    db.query(Document).filter(Document.user_id == guest_id).update({"user_id": new_user_id})
    db.query(ChatMessage).filter(ChatMessage.user_id == guest_id).update({"user_id": new_user_id})
    db.query(Quiz).filter(Quiz.user_id == guest_id).update({"user_id": new_user_id})
    db.query(FlashcardDeck).filter(FlashcardDeck.user_id == guest_id).update({"user_id": new_user_id})
    db.commit()


# ═══════════════════════════════════════════════════════════════════════
#  OTP
# ═══════════════════════════════════════════════════════════════════════

def create_otp(db: Session, email: str, otp_code: str, expires_at: datetime):
    from db.models import OTP
    # Delete existing OTPs for this email to prevent spam
    db.query(OTP).filter(OTP.email == email).delete()
    
    otp = OTP(email=email, otp_code=otp_code, expires_at=expires_at)
    db.add(otp)
    db.commit()
    db.refresh(otp)
    return otp

def verify_otp(db: Session, email: str, otp_code: str) -> bool:
    from db.models import OTP
    otp = db.query(OTP).filter(
        OTP.email == email, 
        OTP.otp_code == otp_code,
        OTP.expires_at > datetime.utcnow()
    ).first()
    
    if otp:
        db.delete(otp)
        db.commit()
        return True
    return False

