"""
RAG Retriever.
Combines vector search with LLM generation for retrieval-augmented generation.
"""

import logging

import config
from core.vector_store import VectorStore
from core.llm_engine import LLMEngine
from utils.prompt_templates import RAG_SYSTEM_PROMPT, build_rag_prompt

logger = logging.getLogger(__name__)


class Retriever:
    """RAG retriever: search → context building → LLM generation."""

    def __init__(self, vector_store: VectorStore, llm_engine: LLMEngine):
        self.vector_store = vector_store
        self.llm = llm_engine

    def retrieve(self, query: str, top_k: int = config.RETRIEVAL_TOP_K) -> list[dict]:
        """Retrieve relevant chunks for a query."""
        results = self.vector_store.search(query, top_k=top_k)
        logger.info(
            f"Retrieved {len(results)} chunks for query: '{query[:60]}...'"
        )
        return results

    def retrieve_from_source(
        self, query: str, source: str, top_k: int = config.RETRIEVAL_TOP_K
    ) -> list[dict]:
        """Retrieve chunks from a specific source document."""
        return self.vector_store.search_by_source(query, source, top_k=top_k)

    def build_context(self, results: list[dict]) -> str:
        """Build a context string from retrieved chunks."""
        if not results:
            return "No relevant context found."

        context_parts = []
        for i, result in enumerate(results, 1):
            source = result["metadata"].get("source", "Unknown")
            page = result["metadata"].get("page", "?")
            score = result.get("score", 0)
            context_parts.append(
                f"[Source: {source}, Page {page}, Relevance: {score:.2f}]\n"
                f"{result['text']}"
            )

        return "\n\n---\n\n".join(context_parts)

    def query(self, question: str, top_k: int = config.RETRIEVAL_TOP_K) -> str:
        """
        Full RAG pipeline: retrieve → build context → generate answer.

        Returns:
            Generated answer string.
        """
        results = self.retrieve(question, top_k=top_k)
        context = self.build_context(results)
        prompt = build_rag_prompt(question, context)

        return self.llm.generate(
            prompt=prompt,
            system_prompt=RAG_SYSTEM_PROMPT,
        )

    def query_stream(self, question: str, top_k: int = config.RETRIEVAL_TOP_K):
        """
        Streaming RAG pipeline.

        Yields:
            Text chunks of the generated answer.
        """
        results = self.retrieve(question, top_k=top_k)
        context = self.build_context(results)
        prompt = build_rag_prompt(question, context)

        yield from self.llm.generate_stream(
            prompt=prompt,
            system_prompt=RAG_SYSTEM_PROMPT,
        )

    def query_with_sources(
        self, question: str, top_k: int = config.RETRIEVAL_TOP_K
    ) -> dict:
        """
        RAG query that also returns source information.

        Returns:
            dict with 'answer' and 'sources'.
        """
        results = self.retrieve(question, top_k=top_k)
        context = self.build_context(results)
        prompt = build_rag_prompt(question, context)

        answer = self.llm.generate(
            prompt=prompt,
            system_prompt=RAG_SYSTEM_PROMPT,
        )

        sources = []
        seen = set()
        for r in results:
            source = r["metadata"].get("source", "Unknown")
            page = r["metadata"].get("page", "?")
            key = f"{source}_p{page}"
            if key not in seen:
                sources.append({"source": source, "page": page, "score": r["score"]})
                seen.add(key)

        return {"answer": answer, "sources": sources}
