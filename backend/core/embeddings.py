"""
Embedding Engine.
Google Generative AI for text embeddings.
"""

import logging
from typing import Optional

import numpy as np
import google.generativeai as genai

from config import settings

logger = logging.getLogger(__name__)

_embedding_instance = None


def get_embedding_engine():
    global _embedding_instance
    if _embedding_instance is None:
        _embedding_instance = EmbeddingEngine()
    return _embedding_instance


class EmbeddingEngine:
    """Generates text embeddings using Google Gemini API."""

    def __init__(self):
        logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
        
        if not settings.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY is not set. Embeddings will fail.")
            
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model_name = settings.EMBEDDING_MODEL
        logger.info("Embedding model loaded via API.")

    def embed_texts(self, texts: list[str], batch_size: int = 64) -> np.ndarray:
        if not texts:
            return np.array([])
            
        if not settings.GEMINI_API_KEY:
            logger.error("GEMINI_API_KEY missing. Returning zero embeddings to prevent hang.")
            return np.zeros((len(texts), settings.EMBEDDING_DIMENSION))
            
        embeddings = []
        # Process in batches to avoid rate limits or payload limits
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            try:
                # We can request batch embeddings directly
                response = genai.embed_content(
                    model=self.model_name,
                    content=batch,
                    task_type="retrieval_document",
                )
                
                if isinstance(response, dict) and "embedding" in response:
                    # Depending on library version, response might return a list of embeddings
                    batch_embeddings = response["embedding"]
                    if isinstance(batch_embeddings[0], list):
                        embeddings.extend(batch_embeddings)
                    else:
                        embeddings.append(batch_embeddings)
            except Exception as e:
                logger.error(f"Failed to embed batch: {e}")
                # Fallback to zero vectors if API fails so it doesn't crash the entire background task
                for _ in range(len(batch)):
                    embeddings.append([0.0] * self.dimension)

        return np.array(embeddings, dtype=np.float32)

    def embed_query(self, query: str) -> np.ndarray:
        try:
            response = genai.embed_content(
                model=self.model_name,
                content=query,
                task_type="retrieval_query",
            )
            embedding = response["embedding"]
            # Handle if it returns a list of lists or a single list
            if isinstance(embedding[0], list):
                embedding = embedding[0]
            return np.array(embedding, dtype=np.float32)
        except Exception as e:
            logger.error(f"Failed to embed query: {e}")
            return np.zeros(self.dimension, dtype=np.float32)

    @property
    def dimension(self) -> int:
        return settings.EMBEDDING_DIMENSION
