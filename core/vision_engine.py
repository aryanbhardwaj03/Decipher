"""
Vision Engine.
Handles image analysis using Ollama vision models (LLaVA, etc.).
"""

import io
import base64
import logging
from typing import Optional

from PIL import Image

import config

logger = logging.getLogger(__name__)


class VisionEngine:
    """Analyzes images using vision-capable LLMs via Ollama."""

    def __init__(self, model: str = config.VISION_MODEL):
        self.model = model
        self._client = None

    @property
    def client(self):
        if self._client is None:
            import ollama
            self._client = ollama.Client(host=config.OLLAMA_BASE_URL)
        return self._client

    def analyze_image(self, image: Image.Image, prompt: str = "") -> str:
        """
        Analyze an image with a vision model.

        Args:
            image: PIL Image to analyze.
            prompt: Analysis prompt/question.

        Returns:
            Model's analysis text.
        """
        if not prompt:
            prompt = (
                "Analyze this image from a scientific paper. "
                "Describe what it shows, identify key patterns, "
                "and explain its significance."
            )

        # Convert image to bytes
        img_bytes = self._image_to_bytes(image)

        try:
            response = self.client.chat(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                        "images": [img_bytes],
                    }
                ],
                options={
                    "temperature": 0.3,
                    "num_predict": 1024,
                },
            )
            return response["message"]["content"]
        except Exception as e:
            logger.error(f"Vision analysis failed: {e}")
            raise

    def analyze_image_stream(self, image: Image.Image, prompt: str = ""):
        """Streaming version of analyze_image."""
        if not prompt:
            prompt = (
                "Analyze this image from a scientific paper. "
                "Describe what it shows and explain its significance."
            )

        img_bytes = self._image_to_bytes(image)

        try:
            stream = self.client.chat(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                        "images": [img_bytes],
                    }
                ],
                stream=True,
                options={
                    "temperature": 0.3,
                    "num_predict": 1024,
                },
            )
            for chunk in stream:
                token = chunk["message"]["content"]
                if token:
                    yield token
        except Exception as e:
            logger.error(f"Vision streaming failed: {e}")
            raise

    def is_available(self) -> bool:
        """Check if the vision model is available."""
        if not config.VISION_ENABLED:
            return False
        try:
            models = self.client.list()
            available = [m["model"] for m in models.get("models", [])]
            base = self.model.split(":")[0]
            return any(base in m for m in available)
        except Exception:
            return False

    @staticmethod
    def _image_to_bytes(image: Image.Image) -> bytes:
        """Convert a PIL Image to bytes."""
        buffer = io.BytesIO()
        # Convert to RGB if RGBA
        if image.mode == "RGBA":
            image = image.convert("RGB")
        image.save(buffer, format="PNG")
        return buffer.getvalue()
