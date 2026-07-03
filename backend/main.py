"""
🔬 AI Study Assistant — FastAPI Backend
Main application entry point.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from db.database import create_tables

# ── Logging ──────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger(__name__)


# ── Lifespan ─────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"LLM Provider: {settings.LLM_PROVIDER}")

    # Create database tables
    create_tables()
    logger.info("Database tables created/verified.")

    # Auto re-embed documents in background (needed after embedding model migration)
    import threading
    def _auto_reembed():
        import time
        time.sleep(5)  # Wait for full startup
        try:
            from core.embeddings import get_embedding_engine
            from db.models import DocumentChunk
            from db.database import SessionLocal
            import numpy as np

            embed = get_embedding_engine()
            db = SessionLocal()
            try:
                # Find chunks that need re-embedding (zero vectors = failed old model)
                chunks = db.query(DocumentChunk).limit(5).all()
                needs_reembed = False
                for c in chunks:
                    if c.embedding is not None:
                        vec = np.array(c.embedding)
                        if np.all(vec == 0) or np.any(np.isnan(vec)):
                            needs_reembed = True
                            break
                
                if not needs_reembed and chunks:
                    # Test if current embeddings work by doing a test query
                    try:
                        test_emb = embed.embed_query("test")
                        if np.all(test_emb == 0):
                            needs_reembed = True
                    except:
                        needs_reembed = True

                if not needs_reembed:
                    logger.info("Embeddings look healthy, skipping re-embed.")
                    return

                logger.info("Detected stale embeddings, starting auto re-embed...")
                all_chunks = db.query(DocumentChunk).all()
                
                batch_size = 10  # Small batches to avoid rate limits
                for i in range(0, len(all_chunks), batch_size):
                    batch = all_chunks[i:i + batch_size]
                    texts = [c.text for c in batch]
                    try:
                        new_embeddings = embed.embed_texts(texts)
                        for j, chunk in enumerate(batch):
                            chunk.embedding = new_embeddings[j].tolist()
                        db.commit()
                        logger.info(f"Re-embedded batch {i//batch_size + 1}/{(len(all_chunks) + batch_size - 1)//batch_size}")
                    except Exception as e:
                        db.rollback()
                        logger.error(f"Re-embed batch {i} failed: {e}")
                    time.sleep(3)  # Rate limit protection
                
                logger.info(f"Auto re-embed complete: {len(all_chunks)} chunks updated.")
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Auto re-embed failed: {e}")
    
    threading.Thread(target=_auto_reembed, daemon=True).start()

    yield

    logger.info("Shutting down.")


import time
from collections import defaultdict
from fastapi import Request

# Global traffic tracker: minute -> request count
traffic_stats = defaultdict(int)

# ── App ──────────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

@app.middleware("http")
async def track_traffic(request: Request, call_next):
    current_minute = int(time.time() // 60) * 60
    traffic_stats[current_minute] += 1
    
    # Clean up old data (keep last 60 minutes)
    threshold = current_minute - (60 * 60)
    for minute in list(traffic_stats.keys()):
        if minute < threshold:
            del traffic_stats[minute]
            
    return await call_next(request)

# ── CORS ─────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ───────────────────────────────────────────────────────────────
from api.routes import auth, documents, chat, summary, quiz, flashcards, notes, search, figures, admin, payments, users

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(summary.router)
app.include_router(quiz.router)
app.include_router(flashcards.router)
app.include_router(notes.router)
app.include_router(search.router)
app.include_router(figures.router)
app.include_router(admin.router)
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])
app.include_router(users.router)


# ── Health Check ─────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "Decipher API is running"}

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "llm_provider": settings.LLM_PROVIDER,
    }


# ── Run ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
