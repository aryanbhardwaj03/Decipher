"""
LLM Engine.
Unified interface for LLM inference via Ollama (local) or OpenAI-compatible APIs.
"""

import logging
from typing import Generator, Optional

import ollama
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

import config

logger = logging.getLogger(__name__)


class LLMEngine:
    """Handles LLM inference with streaming support."""

    def __init__(self):
        self.provider = config.LLM_PROVIDER
        if self.provider == "ollama":
            self.model = config.OLLAMA_MODEL
        elif self.provider == "groq":
            self.model = config.GROQ_MODEL
        else:
            self.model = config.OPENAI_MODEL
        self._client = None

    @property
    def client(self):
        """Lazy-init the Ollama or OpenAI-compatible client."""
        if self._client is None:
            if self.provider == "ollama":
                self._client = ollama.Client(host=config.OLLAMA_BASE_URL)
            elif self.provider == "groq":
                try:
                    from openai import OpenAI
                    self._client = OpenAI(api_key=config.GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
                except ImportError:
                    raise ImportError("Install openai package: pip install openai")
            else:
                # OpenAI-compatible client
                try:
                    from openai import OpenAI
                    self._client = OpenAI(api_key=config.OPENAI_API_KEY)
                except ImportError:
                    raise ImportError(
                        "Install openai package: pip install openai"
                    )
        return self._client

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True
    )
    def generate(
        self,
        prompt: str,
        system_prompt: str = "",
        temperature: float = config.LLM_TEMPERATURE,
        max_tokens: int = config.LLM_MAX_TOKENS,
    ) -> str:
        """
        Generate a complete response (non-streaming).

        Args:
            prompt: User prompt.
            system_prompt: System instruction.
            temperature: Sampling temperature.
            max_tokens: Maximum tokens to generate.

        Returns:
            Generated text.
        """
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        if self.provider == "ollama":
            response = self.client.chat(
                model=self.model,
                messages=messages,
                options={
                    "temperature": temperature,
                    "num_predict": max_tokens,
                },
            )
            return response["message"]["content"]
        else:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True
    )
    def generate_stream(
        self,
        prompt: str,
        system_prompt: str = "",
        temperature: float = config.LLM_TEMPERATURE,
        max_tokens: int = config.LLM_MAX_TOKENS,
    ) -> Generator[str, None, None]:
        """
        Generate a streaming response.

        Yields:
            Text chunks as they are generated.
        """
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        if self.provider == "ollama":
            stream = self.client.chat(
                model=self.model,
                messages=messages,
                stream=True,
                options={
                    "temperature": temperature,
                    "num_predict": max_tokens,
                },
            )
            for chunk in stream:
                token = chunk["message"]["content"]
                if token:
                    yield token
        else:
            stream = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )
            for chunk in stream:
                token = chunk.choices[0].delta.content
                if token:
                    yield token

    def chat_stream(
        self,
        messages: list[dict],
        temperature: float = config.LLM_TEMPERATURE,
        max_tokens: int = config.LLM_MAX_TOKENS,
    ) -> Generator[str, None, None]:
        """
        Chat with full message history (streaming).

        Args:
            messages: List of {"role": ..., "content": ...} dicts.

        Yields:
            Text chunks.
        """
        if self.provider == "ollama":
            stream = self.client.chat(
                model=self.model,
                messages=messages,
                stream=True,
                options={
                    "temperature": temperature,
                    "num_predict": max_tokens,
                },
            )
            for chunk in stream:
                token = chunk["message"]["content"]
                if token:
                    yield token
        else:
            stream = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )
            for chunk in stream:
                token = chunk.choices[0].delta.content
                if token:
                    yield token

    def is_available(self) -> bool:
        """Check if the LLM backend is reachable."""
        try:
            if self.provider == "ollama":
                models = self.client.list()
                available = [m["model"] for m in models.get("models", [])]
                if self.model not in available:
                    # Check partial match (e.g., "llama3.1:8b" matches "llama3.1:8b-...")
                    base = self.model.split(":")[0]
                    return any(base in m for m in available)
                return True
            else:
                # Try a minimal request
                self.client.models.list()
                return True
        except Exception as e:
            logger.warning(f"LLM backend not available: {e}")
            return False

    def list_models(self) -> list[str]:
        """List available models (Ollama only)."""
        if self.provider == "ollama":
            try:
                models = self.client.list()
                return [m["model"] for m in models.get("models", [])]
            except Exception:
                return []
        return [self.model]
