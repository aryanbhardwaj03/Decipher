"""
FAISS Vector Store.
Document-aware vector store with per-document filtering.
"""

import json
import logging
from pathlib import Path

import faiss
import numpy as np

from config import settings, INDEX_DIR
from core.embeddings import get_embedding_engine

logger = logging.getLogger(__name__)

_vs_instance = None


def get_vector_store():
    global _vs_instance
    if _vs_instance is None:
        _vs_instance = VectorStore()
        # Try loading persisted index
        _vs_instance.load(INDEX_DIR)
    return _vs_instance


class VectorStore:
    """FAISS-based vector store with per-document search."""

    def __init__(self, dimension: int = settings.EMBEDDING_DIMENSION):
        self.dimension = dimension
        self.index = faiss.IndexFlatIP(dimension)
        self.documents: list[dict] = []

    @property
    def size(self) -> int:
        return self.index.ntotal

    def add_chunks(self, chunks: list) -> int:
        if not chunks:
            return 0

        embed = get_embedding_engine()
        texts = [c.text for c in chunks]
        embeddings = embed.embed_texts(texts)

        self.index.add(embeddings)

        for chunk in chunks:
            self.documents.append({"text": chunk.text, "metadata": chunk.metadata})

        logger.info(f"Added {len(chunks)} chunks (total: {self.size})")
        self.save(INDEX_DIR)  # Auto-persist
        return len(chunks)

    def search(self, query: str, top_k: int = settings.RETRIEVAL_TOP_K) -> list[dict]:
        if self.size == 0:
            return []

        embed = get_embedding_engine()
        qvec = embed.embed_query(query).reshape(1, -1)
        k = min(top_k, self.size)
        scores, indices = self.index.search(qvec, k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0 or score < settings.SIMILARITY_THRESHOLD:
                continue
            doc = self.documents[idx]
            results.append({"text": doc["text"], "metadata": doc["metadata"], "score": float(score)})

        return results

    def search_by_doc(self, query: str, doc_id: str, top_k: int = settings.RETRIEVAL_TOP_K) -> list[dict]:
        """Search within a specific document."""
        # We must retrieve up to self.size to prevent identical chunks from prior uploads crowding out the results
        all_results = self.search(query, top_k=self.size)
        filtered = [r for r in all_results if r["metadata"].get("doc_id") == doc_id]
        return filtered[:top_k]

    def keyword_search(self, query: str, doc_id: str, top_k: int = 10) -> list[dict]:
        """Simple keyword search through stored documents."""
        query_lower = query.lower()
        words = query_lower.split()
        results = []

        for doc in self.documents:
            if doc["metadata"].get("doc_id") != doc_id:
                continue
            text_lower = doc["text"].lower()
            matches = sum(1 for w in words if w in text_lower)
            if matches > 0:
                score = matches / len(words)
                results.append({"text": doc["text"], "metadata": doc["metadata"], "score": score})

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    def remove_source(self, doc_id: str) -> bool:
        keep_indices = []
        new_docs = []
        for i, doc in enumerate(self.documents):
            if doc["metadata"].get("doc_id") != doc_id:
                keep_indices.append(i)
                new_docs.append(doc)

        if len(keep_indices) == len(self.documents):
            return False

        if not keep_indices:
            self.index = faiss.IndexFlatIP(self.dimension)
            self.documents = []
        else:
            vectors = np.array([self.index.reconstruct(i) for i in keep_indices], dtype=np.float32)
            self.index = faiss.IndexFlatIP(self.dimension)
            self.index.add(vectors)
            self.documents = new_docs

        self.save(INDEX_DIR)
        return True

    def save(self, path: Path):
        path.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self.index, str(path / "index.faiss"))
        with open(path / "documents.json", "w", encoding="utf-8") as f:
            json.dump(self.documents, f, ensure_ascii=False)

    def load(self, path: Path) -> bool:
        idx_path = path / "index.faiss"
        docs_path = path / "documents.json"
        if not idx_path.exists() or not docs_path.exists():
            return False
        try:
            loaded_index = faiss.read_index(str(idx_path))
            if loaded_index.d != self.dimension:
                logger.warning(f"Dimension mismatch! Loaded {loaded_index.d}, expected {self.dimension}. Creating new index.")
                self.index = faiss.IndexFlatIP(self.dimension)
                self.documents = []
            else:
                self.index = loaded_index
                with open(docs_path, "r", encoding="utf-8") as f:
                    self.documents = json.load(f)
                self.dimension = self.index.d
            logger.info(f"Loaded vector store: {self.size} vectors")
            return True
        except Exception as e:
            logger.error(f"Failed to load vector store: {e}")
            self.index = faiss.IndexFlatIP(self.dimension)
            self.documents = []
            return False
