"""
Embedding Engine.
Wraps Sentence Transformers for generating text embeddings.
"""

import logging
from typing import Optional

import numpy as np
from sentence_transformers import SentenceTransformer

import config

logger = logging.getLogger(__name__)


class EmbeddingEngine:
    """Generates embeddings using Sentence Transformers."""

    _instance: Optional["EmbeddingEngine"] = None
    _model: Optional[SentenceTransformer] = None

    @classmethod
    def get_instance(cls) -> "EmbeddingEngine":
        """Singleton to avoid loading the model multiple times."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        if EmbeddingEngine._model is None:
            logger.info(f"Loading embedding model: {config.EMBEDDING_MODEL}")
            EmbeddingEngine._model = SentenceTransformer(
                config.EMBEDDING_MODEL, device=config.EMBEDDING_DEVICE
            )
            logger.info("Embedding model loaded successfully.")

    @property
    def model(self) -> SentenceTransformer:
        return EmbeddingEngine._model

    def embed_texts(self, texts: list[str], batch_size: int = 64) -> np.ndarray:
        """
        Embed a list of texts.

        Args:
            texts: List of strings to embed.
            batch_size: Batch size for encoding.

        Returns:
            numpy array of shape (len(texts), embedding_dim)
        """
        if not texts:
            return np.array([])

        logger.info(f"Embedding {len(texts)} texts...")
        embeddings = self.model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=len(texts) > 100,
            normalize_embeddings=True,  # For cosine similarity with dot product
        )
        return np.array(embeddings, dtype=np.float32)

    def embed_query(self, query: str) -> np.ndarray:
        """Embed a single query string."""
        embedding = self.model.encode(
            [query], normalize_embeddings=True
        )
        return np.array(embedding, dtype=np.float32)[0]

    @property
    def dimension(self) -> int:
        """Return the embedding dimension."""
        return self.model.get_sentence_embedding_dimension()
