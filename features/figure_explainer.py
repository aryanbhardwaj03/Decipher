"""
Figure Explainer.
Analyzes and explains figures/images from research papers.
"""

import logging
from typing import Optional

from PIL import Image

from core.llm_engine import LLMEngine
from core.vision_engine import VisionEngine
from core.vector_store import VectorStore
from utils.prompt_templates import FIGURE_SYSTEM_PROMPT, build_figure_prompt

logger = logging.getLogger(__name__)


class FigureExplainer:
    """Explains figures and charts from research papers."""

    def __init__(
        self,
        llm_engine: LLMEngine,
        vector_store: VectorStore,
        vision_engine: Optional["VisionEngine"] = None,
    ):
        self.llm = llm_engine
        self.vector_store = vector_store
        self.vision_engine = vision_engine

    def explain_figure(
        self,
        image: Image.Image,
        source: str = "",
        figure_label: str = "",
    ) -> str:
        """
        Explain a figure from a research paper.

        Args:
            image: PIL Image of the figure.
            source: Source document name.
            figure_label: Optional figure label (e.g., "Figure 3").

        Returns:
            Explanation text.
        """
        # Get surrounding text context
        surrounding_text = ""
        if source and figure_label:
            query = f"{figure_label} in {source}"
            results = self.vector_store.search_by_source(query, source, top_k=3)
            if results:
                surrounding_text = "\n\n".join([r["text"] for r in results])

        # Try vision model first
        if self.vision_engine and self.vision_engine.is_available():
            try:
                prompt = build_figure_prompt(surrounding_text)
                return self.vision_engine.analyze_image(image, prompt)
            except Exception as e:
                logger.warning(f"Vision model failed: {e}. Falling back to text-based analysis.")

        # Fallback: text-only analysis using surrounding context
        if surrounding_text:
            fallback_prompt = f"""Based on the surrounding text from the paper, explain what {figure_label or 'the figure'} likely shows:

## Surrounding Text
{surrounding_text}

Provide a detailed interpretation of what the figure likely contains based on the textual context."""

            return self.llm.generate(
                prompt=fallback_prompt,
                system_prompt=FIGURE_SYSTEM_PROMPT,
            )
        else:
            return "Could not analyze the figure. No vision model available and no surrounding text context found."

    def list_figures(self, source: str, document_images: dict) -> list[dict]:
        """List available figures from a document."""
        images = document_images.get(source, [])
        return [
            {
                "index": img["index"],
                "page": img["page"],
                "size": img.get("size", (0, 0)),
                "source": source,
            }
            for img in images
        ]
