"""
Embedding Engine.
Sentence Transformers for text embeddings.
"""

import logging
from typing import Optional

import numpy as np
from sentence_transformers import SentenceTransformer

from config import settings

logger = logging.getLogger(__name__)

_embedding_instance = None


def get_embedding_engine():
    global _embedding_instance
    if _embedding_instance is None:
        _embedding_instance = EmbeddingEngine()
    return _embedding_instance


class EmbeddingEngine:
    """Generates text embeddings using Sentence Transformers."""

    def __init__(self):
        logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
        self.model = SentenceTransformer(
            settings.EMBEDDING_MODEL, device=settings.EMBEDDING_DEVICE
        )
        logger.info("Embedding model loaded.")

    def embed_texts(self, texts: list[str], batch_size: int = 64) -> np.ndarray:
        if not texts:
            return np.array([])
        embeddings = self.model.encode(
            texts, batch_size=batch_size, normalize_embeddings=True,
            show_progress_bar=len(texts) > 100,
        )
        return np.array(embeddings, dtype=np.float32)

    def embed_query(self, query: str) -> np.ndarray:
        embedding = self.model.encode([query], normalize_embeddings=True)
        return np.array(embedding, dtype=np.float32)[0]

    @property
    def dimension(self) -> int:
        return self.model.get_sentence_embedding_dimension()
