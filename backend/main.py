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
