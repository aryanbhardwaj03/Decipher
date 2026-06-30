"""
Paper Summarizer.
Generates structured summaries of research papers.
"""

import logging

from core.vector_store import VectorStore
from core.llm_engine import LLMEngine
from utils.prompt_templates import SUMMARIZER_SYSTEM_PROMPT, build_summary_prompt

logger = logging.getLogger(__name__)


class Summarizer:
    """Generates multi-level summaries of research documents."""

    def __init__(self, vector_store: VectorStore, llm_engine: LLMEngine):
        self.vector_store = vector_store
        self.llm = llm_engine

    def summarize(
        self,
        source: str | None = None,
        level: str = "detailed",
        custom_instruction: str = "",
    ) -> str:
        """
        Generate a summary of a document or all documents.

        Args:
            source: Specific document name, or None for all.
            level: "brief", "abstract", or "detailed".
            custom_instruction: Optional custom focus for the summary.

        Returns:
            Generated summary text.
        """
        # Retrieve all relevant content
        query = custom_instruction or "Summarize the main findings, methodology, results, and conclusions"

        if source:
            results = self.vector_store.search_by_source(query, source, top_k=15)
        else:
            results = self.vector_store.search(query, top_k=15)

        if not results:
            return "No content found to summarize. Please upload documents first."

        # Combine retrieved chunks
        combined_text = "\n\n".join([r["text"] for r in results])

        # Truncate if too long (keep within LLM context)
        max_chars = 8000
        if len(combined_text) > max_chars:
            combined_text = combined_text[:max_chars] + "\n\n[... content truncated for length ...]"

        # Build prompt
        prompt = build_summary_prompt(combined_text, level=level)

        if custom_instruction:
            prompt += f"\n\n## Additional Focus\n{custom_instruction}"

        return self.llm.generate(
            prompt=prompt,
            system_prompt=SUMMARIZER_SYSTEM_PROMPT,
            max_tokens=2048,
        )

    def summarize_stream(
        self,
        source: str | None = None,
        level: str = "detailed",
        custom_instruction: str = "",
    ):
        """Streaming version of summarize."""
        query = custom_instruction or "Summarize the main findings, methodology, results, and conclusions"

        if source:
            results = self.vector_store.search_by_source(query, source, top_k=15)
        else:
            results = self.vector_store.search(query, top_k=15)

        if not results:
            yield "No content found to summarize."
            return

        combined_text = "\n\n".join([r["text"] for r in results])
        max_chars = 8000
        if len(combined_text) > max_chars:
            combined_text = combined_text[:max_chars] + "\n\n[... truncated ...]"

        prompt = build_summary_prompt(combined_text, level=level)
        if custom_instruction:
            prompt += f"\n\n## Additional Focus\n{custom_instruction}"

        yield from self.llm.generate_stream(
            prompt=prompt,
            system_prompt=SUMMARIZER_SYSTEM_PROMPT,
            max_tokens=2048,
        )
