"""
Quiz Generator.
Creates quiz questions from document content.
"""

import logging

from core.vector_store import VectorStore
from core.llm_engine import LLMEngine
from utils.prompt_templates import QUIZ_SYSTEM_PROMPT, build_quiz_prompt

logger = logging.getLogger(__name__)


class QuizGenerator:
    """Generates quiz questions from research documents."""

    def __init__(self, vector_store: VectorStore, llm_engine: LLMEngine):
        self.vector_store = vector_store
        self.llm = llm_engine

    def generate(
        self,
        source: str | None = None,
        num_questions: int = 5,
        difficulty: str = "medium",
        q_type: str = "mixed",
        topic: str = "",
    ) -> str:
        """
        Generate quiz questions from document content.

        Args:
            source: Specific document, or None for all.
            num_questions: Number of questions to generate.
            difficulty: "easy", "medium", or "hard".
            q_type: "mcq", "true_false", "short_answer", or "mixed".
            topic: Optional topic focus.

        Returns:
            Formatted quiz questions as markdown.
        """
        # Build search query
        query = topic or "key concepts, findings, methodology, and important details"

        if source:
            results = self.vector_store.search_by_source(query, source, top_k=12)
        else:
            results = self.vector_store.search(query, top_k=12)

        if not results:
            return "No content found to generate questions. Please upload documents first."

        # Combine content
        combined_text = "\n\n".join([r["text"] for r in results])
        max_chars = 6000
        if len(combined_text) > max_chars:
            combined_text = combined_text[:max_chars]

        # Generate quiz
        prompt = build_quiz_prompt(
            text=combined_text,
            num_questions=num_questions,
            difficulty=difficulty,
            q_type=q_type,
        )

        return self.llm.generate(
            prompt=prompt,
            system_prompt=QUIZ_SYSTEM_PROMPT,
            max_tokens=2048,
            temperature=0.5,  # Slightly higher for creative question generation
        )
