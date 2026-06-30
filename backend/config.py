"""
Backend Configuration.
Centralized settings with Pydantic BaseSettings for environment variable support.
"""

from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ── App ───────────────────────────────────────────────
    APP_NAME: str = "AI Study Assistant"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"]

    # ── Database ──────────────────────────────────────────
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/study_assistant"

    # ── JWT Auth ──────────────────────────────────────────
    JWT_SECRET: str = "change-me-in-production-use-long-random-string"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24

    # ── AI / LLM ──────────────────────────────────────────
    LLM_PROVIDER: str = "gemini"  # "gemini", "openai", "ollama", "groq"
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.1-8b-instant"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1:8b"

    LLM_TEMPERATURE: float = 0.3
    LLM_MAX_TOKENS: int = 4096

    # ── Embeddings ────────────────────────────────────────
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384
    EMBEDDING_DEVICE: str = "cpu"

    # ── Chunking ──────────────────────────────────────────
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200

    # ── Retrieval ─────────────────────────────────────────
    RETRIEVAL_TOP_K: int = 6
    SIMILARITY_THRESHOLD: float = 0.25

    # ── Storage ───────────────────────────────────────────
    STORAGE_PROVIDER: str = "local"  # "local", "supabase", "s3"
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_BUCKET: str = "documents"
    LOCAL_UPLOAD_DIR: str = "data/uploads"
    LOCAL_INDEX_DIR: str = "data/indexes"

    # ── OCR ────────────────────────────────────────────────
    OCR_LANGUAGES: list[str] = ["en"]
    OCR_GPU: bool = False

    # ── Vision ─────────────────────────────────────────────
    VISION_ENABLED: bool = False
    VISION_MODEL: str = "llava:7b"

    # ── Limits ─────────────────────────────────────────────
    MAX_UPLOAD_SIZE_MB: int = 50
    MAX_DOCUMENTS_PER_USER: int = 50

    # ── Payments ───────────────────────────────────────────
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

# ── Ensure local directories exist ────────────────────────
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = BASE_DIR / settings.LOCAL_UPLOAD_DIR
INDEX_DIR = BASE_DIR / settings.LOCAL_INDEX_DIR

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
INDEX_DIR.mkdir(parents=True, exist_ok=True)
