"""
Database Models.
SQLAlchemy ORM models for all entities.
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
    Enum as SAEnum,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from db.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(255), unique=True, nullable=True, index=True)
    name = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    hashed_password = Column(String(255), nullable=True)  # Null for OAuth users
    provider = Column(String(50), default="credentials")  # "credentials", "google"
    role = Column(String(20), default="user")  # "user", "admin"
    plan = Column(String(20), default="Basic")  # "Basic", "Plus", "Pro"
    xp = Column(Integer, default=0)
    streak = Column(Integer, default=0)
    ai_preferences = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="user", cascade="all, delete-orphan")
    flashcard_decks = relationship("FlashcardDeck", back_populates="user", cascade="all, delete-orphan")
    xp_transactions = relationship("XPTransaction", back_populates="user", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    filename = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    file_type = Column(String(20), nullable=False)  # "pdf", "docx", "pptx", "txt", "md"
    file_size = Column(Integer, nullable=False)  # bytes
    storage_url = Column(String(1000), nullable=True)
    status = Column(String(20), default="processing")  # "processing", "ready", "error"
    error_message = Column(Text, nullable=True)

    # Analytics
    pages = Column(Integer, default=0)
    word_count = Column(Integer, default=0)
    image_count = Column(Integer, default=0)
    table_count = Column(Integer, default=0)
    reading_time_minutes = Column(Integer, default=0)
    estimated_difficulty = Column(String(20), nullable=True)  # "easy", "medium", "hard"

    # Metadata
    is_favorite = Column(Boolean, default=False)
    folder = Column(String(255), nullable=True)
    tags = Column(JSON, default=list)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="documents")
    chat_messages = relationship("ChatMessage", back_populates="document", cascade="all, delete-orphan")
    summaries = relationship("Summary", back_populates="document", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="document", cascade="all, delete-orphan")
    flashcard_decks = relationship("FlashcardDeck", back_populates="document", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="document", cascade="all, delete-orphan")
    figures = relationship("Figure", back_populates="document", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # "user", "assistant"
    content = Column(Text, nullable=False)
    sources = Column(JSON, nullable=True)  # [{source, page, score}]
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    document = relationship("Document", back_populates="chat_messages")
    user = relationship("User", back_populates="chat_messages")


class Summary(Base):
    __tablename__ = "summaries"

    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False, index=True)
    summary_type = Column(String(50), nullable=False)  # short, detailed, bullet, takeaways, executive, beginner, technical
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    document = relationship("Document", back_populates="summaries")


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    questions = Column(JSON, nullable=False)  # Structured quiz questions
    score = Column(Integer, nullable=True)
    total = Column(Integer, nullable=True)
    xp_earned = Column(Integer, default=0)
    difficulty = Column(String(20), default="medium")
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    document = relationship("Document", back_populates="quizzes")
    user = relationship("User", back_populates="quizzes")


class FlashcardDeck(Base):
    __tablename__ = "flashcard_decks"

    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    cards = Column(JSON, nullable=False)  # [{front, back, difficulty}]
    progress = Column(Integer, default=0)  # Cards studied
    total_cards = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    document = relationship("Document", back_populates="flashcard_decks")
    user = relationship("User", back_populates="flashcard_decks")


class Note(Base):
    __tablename__ = "notes"

    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False, index=True)
    note_type = Column(String(50), nullable=False)  # smart, revision, formulas, definitions, dates, concepts
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    document = relationship("Document", back_populates="notes")


class Figure(Base):
    __tablename__ = "figures"

    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False, index=True)
    page = Column(Integer, nullable=True)
    image_url = Column(String(1000), nullable=True)  # Storage URL
    image_data = Column(Text, nullable=True)  # Base64 for local storage
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    caption = Column(Text, nullable=True)
    ai_description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    document = relationship("Document", back_populates="figures")


class XPTransaction(Base):
    __tablename__ = "xp_transactions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Integer, nullable=False)
    reason = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="xp_transactions")
