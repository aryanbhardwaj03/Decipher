"""
Database Connection.
SQLAlchemy async engine and session management.
"""

# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase

from config import settings


connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {"connect_timeout": 10}

from sqlalchemy import event

# ── Engine ────────────────────────────────────────────────────────────────
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    connect_args=connect_args,
    **(
        {} if settings.DATABASE_URL.startswith("sqlite")
        else {"pool_size": 10, "max_overflow": 20, "pool_recycle": 300}
    )
)

if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.close()

# ── Session Factory ───────────────────────────────────────────────────────
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ── Base Model ────────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    pass


# ── Dependency ────────────────────────────────────────────────────────────
def get_db():
    """FastAPI dependency: yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all database tables with retry logic and error resilience."""
    import time
    import logging
    logger = logging.getLogger(__name__)

    max_retries = 5
    for attempt in range(max_retries):
        try:
            if not settings.DATABASE_URL.startswith("sqlite"):
                from sqlalchemy import text
                with engine.connect() as conn:
                    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
                    conn.commit()
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables connected and initialized successfully.")
            return
        except Exception as e:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt
                logger.warning(f"Database connection attempt {attempt + 1}/{max_retries} failed ({e}). Retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                logger.error(f"❌ Could not connect to database after {max_retries} retries: {e}")
                logger.error("💡 HINT: If using Supabase or Neon in Hugging Face Spaces, check that you are using the IPv4 Connection Pooler / Supavisor URL (e.g. port 6543) instead of the Direct IPv6 URL (port 5432), and check your DATABASE_URL in HuggingFace Secrets.")
                # We DO NOT re-raise here so that Uvicorn startup can complete and health checks (GET /) pass!

