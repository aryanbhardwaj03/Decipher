"""
FAISS Vector Store.
Manages document embeddings with FAISS for fast similarity search.
"""

import json
import logging
from pathlib import Path
from typing import Optional

import faiss
import numpy as np

import config
from core.embeddings import EmbeddingEngine

logger = logging.getLogger(__name__)


class VectorStore:
    """FAISS-based vector store for document chunks."""

    def __init__(self, dimension: int = config.EMBEDDING_DIMENSION):
        self.dimension = dimension
        self.index = faiss.IndexFlatIP(dimension)  # Inner product (cosine sim with normalized vectors)
        self.documents: list[dict] = []  # Parallel list of metadata + text
        self.embedding_engine = EmbeddingEngine.get_instance()

    @property
    def size(self) -> int:
        """Number of vectors in the store."""
        return self.index.ntotal

    def add_chunks(self, chunks: list) -> int:
        """
        Add document chunks to the vector store.

        Args:
            chunks: List of DocumentChunk objects.

        Returns:
            Number of chunks added.
        """
        if not chunks:
            return 0

        texts = [chunk.text for chunk in chunks]
        embeddings = self.embedding_engine.embed_texts(texts)

        # Add to FAISS index
        self.index.add(embeddings)

        # Store metadata
        for chunk in chunks:
            self.documents.append(
                {
                    "text": chunk.text,
                    "metadata": chunk.metadata,
                }
            )

        logger.info(f"Added {len(chunks)} chunks to vector store (total: {self.size})")
        return len(chunks)

    def search(self, query: str, top_k: int = config.RETRIEVAL_TOP_K) -> list[dict]:
        """
        Search the vector store for similar chunks.

        Args:
            query: Search query string.
            top_k: Number of results to return.

        Returns:
            List of dicts with 'text', 'metadata', and 'score'.
        """
        if self.size == 0:
            return []

        query_embedding = self.embedding_engine.embed_query(query)
        query_embedding = query_embedding.reshape(1, -1)

        # Search FAISS
        k = min(top_k, self.size)
        scores, indices = self.index.search(query_embedding, k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0:  # FAISS returns -1 for empty slots
                continue
            if score < config.SIMILARITY_THRESHOLD:
                continue

            doc = self.documents[idx]
            results.append(
                {
                    "text": doc["text"],
                    "metadata": doc["metadata"],
                    "score": float(score),
                }
            )

        return results

    def search_by_source(
        self, query: str, source: str, top_k: int = config.RETRIEVAL_TOP_K
    ) -> list[dict]:
        """Search within a specific source document."""
        all_results = self.search(query, top_k=top_k * 3)
        filtered = [r for r in all_results if r["metadata"].get("source") == source]
        return filtered[:top_k]

    def search_by_doc(
        self, query: str, doc_id: str, top_k: int = config.RETRIEVAL_TOP_K
    ) -> list[dict]:
        """Search within a specific document by its UUID."""
        all_results = self.search(query, top_k=max(self.size, top_k * 5))
        filtered = [r for r in all_results if r["metadata"].get("doc_id") == doc_id]
        return filtered[:top_k]

    def keyword_search(
        self, query: str, doc_id: str, top_k: int = config.RETRIEVAL_TOP_K
    ) -> list[dict]:
        """Basic keyword search across chunks belonging to a document."""
        import re
        query_words = [w.lower() for w in re.findall(r'\w+', query)]
        if not query_words:
            return []
            
        results = []
        for doc in self.documents:
            if doc["metadata"].get("doc_id") == doc_id:
                text_lower = doc["text"].lower()
                matches = sum(1 for w in query_words if w in text_lower)
                if matches > 0:
                    score = matches / len(query_words)
                    results.append({
                        "text": doc["text"],
                        "metadata": doc["metadata"],
                        "score": score
                    })
                    
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    def get_sources(self) -> list[str]:
        """Get list of unique source documents."""
        sources = set()
        for doc in self.documents:
            source = doc["metadata"].get("source", "")
            if source:
                sources.add(source)
        return sorted(sources)

    def remove_source(self, source: str) -> bool:
        """
        Remove all chunks from a specific source.
        Rebuilds the FAISS index (FAISS doesn't support deletion natively).
        """
        # Find indices to keep
        keep_indices = []
        new_documents = []
        for i, doc in enumerate(self.documents):
            if doc["metadata"].get("source") != source:
                keep_indices.append(i)
                new_documents.append(doc)

        if len(keep_indices) == len(self.documents):
            return False  # Source not found

        if not keep_indices:
            # All documents removed
            self.index = faiss.IndexFlatIP(self.dimension)
            self.documents = []
        else:
            # Reconstruct vectors for kept indices
            vectors = np.array(
                [self.index.reconstruct(i) for i in keep_indices], dtype=np.float32
            )
            self.index = faiss.IndexFlatIP(self.dimension)
            self.index.add(vectors)
            self.documents = new_documents

        logger.info(f"Removed source '{source}'. Store now has {self.size} vectors.")
        return True

    def save(self, path: str | Path):
        """Save the vector store to disk."""
        path = Path(path)
        path.mkdir(parents=True, exist_ok=True)

        # Save FAISS index
        faiss.write_index(self.index, str(path / "index.faiss"))

        # Save documents metadata
        with open(path / "documents.json", "w", encoding="utf-8") as f:
            json.dump(self.documents, f, ensure_ascii=False, indent=2)

        logger.info(f"Saved vector store to {path} ({self.size} vectors)")

    def load(self, path: str | Path) -> bool:
        """Load the vector store from disk."""
        path = Path(path)
        index_path = path / "index.faiss"
        docs_path = path / "documents.json"

        if not index_path.exists() or not docs_path.exists():
            return False

        try:
            self.index = faiss.read_index(str(index_path))

            with open(docs_path, "r", encoding="utf-8") as f:
                self.documents = json.load(f)

            # Update dimension from loaded index
            self.dimension = self.index.d

            logger.info(f"Loaded vector store from {path} ({self.size} vectors)")
            return True
        except Exception as e:
            logger.error(f"Failed to load vector store: {e}")
            return False

    def clear(self):
        """Clear the entire vector store."""
        self.index = faiss.IndexFlatIP(self.dimension)
        self.documents = []
        logger.info("Vector store cleared.")
