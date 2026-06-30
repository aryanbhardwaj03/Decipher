"""
Paper Comparator.
Cross-document comparison using RAG.
"""

import logging

from core.vector_store import VectorStore
from core.llm_engine import LLMEngine
from utils.prompt_templates import COMPARISON_SYSTEM_PROMPT, build_comparison_prompt

logger = logging.getLogger(__name__)


class PaperComparator:
    """Compares two research documents across multiple dimensions."""

    def __init__(self, vector_store: VectorStore, llm_engine: LLMEngine):
        self.vector_store = vector_store
        self.llm = llm_engine

    def compare(
        self,
        source_a: str,
        source_b: str,
        focus: str = "",
    ) -> str:
        """
        Compare two documents.

        Args:
            source_a: First document name.
            source_b: Second document name.
            focus: Optional comparison focus.

        Returns:
            Structured comparison as markdown.
        """
        query = focus or "main findings, methodology, results, conclusions, contributions"

        # Retrieve context from both documents
        results_a = self.vector_store.search_by_source(query, source_a, top_k=10)
        results_b = self.vector_store.search_by_source(query, source_b, top_k=10)

        if not results_a:
            return f"No content found for document: {source_a}"
        if not results_b:
            return f"No content found for document: {source_b}"

        # Build context
        context_a = "\n\n".join([r["text"] for r in results_a])
        context_b = "\n\n".join([r["text"] for r in results_b])

        # Truncate if needed
        max_chars = 4000
        if len(context_a) > max_chars:
            context_a = context_a[:max_chars] + "\n[... truncated ...]"
        if len(context_b) > max_chars:
            context_b = context_b[:max_chars] + "\n[... truncated ...]"

        # Build comparison prompt
        prompt = build_comparison_prompt(context_a, context_b, source_a, source_b)

        if focus:
            prompt += f"\n\n## Special Focus\nPay particular attention to: {focus}"

        return self.llm.generate(
            prompt=prompt,
            system_prompt=COMPARISON_SYSTEM_PROMPT,
            max_tokens=3000,
        )
