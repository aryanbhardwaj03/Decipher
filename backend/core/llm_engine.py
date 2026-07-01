"""
LLM Engine.
Unified interface for Google Gemini, OpenAI, and Ollama.
"""

import logging
from typing import Generator, Optional

from config import settings

logger = logging.getLogger(__name__)

_llm_instance = None


def get_llm_engine():
    """Get or create the singleton LLM engine."""
    global _llm_instance
    if _llm_instance is None:
        _llm_instance = LLMEngine()
    return _llm_instance


class LLMEngine:
    """Unified LLM interface with streaming support."""

    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        self._gemini_model = None
        self._openai_client = None
        self._ollama_client = None

    def generate(
        self,
        prompt: str,
        system_prompt: str = "",
        temperature: float = settings.LLM_TEMPERATURE,
        max_tokens: int = settings.LLM_MAX_TOKENS,
        format: Optional[str] = None,
    ) -> str:
        """Generate a complete response."""
        if self.provider == "gemini":
            return self._gemini_generate(prompt, system_prompt, temperature, max_tokens, format)
        elif self.provider == "openai":
            return self._openai_generate(prompt, system_prompt, temperature, max_tokens, format)
        elif self.provider == "groq":
            return self._groq_generate(prompt, system_prompt, temperature, max_tokens, format)
        else:
            return self._ollama_generate(prompt, system_prompt, temperature, max_tokens, format)

    def generate_stream(
        self,
        prompt: str,
        system_prompt: str = "",
        temperature: float = settings.LLM_TEMPERATURE,
        max_tokens: int = settings.LLM_MAX_TOKENS,
    ) -> Generator[str, None, None]:
        """Generate a streaming response."""
        if self.provider == "gemini":
            yield from self._gemini_stream(prompt, system_prompt, temperature, max_tokens)
        elif self.provider == "openai":
            yield from self._openai_stream(prompt, system_prompt, temperature, max_tokens)
        elif self.provider == "groq":
            yield from self._groq_stream(prompt, system_prompt, temperature, max_tokens)
        else:
            yield from self._ollama_stream(prompt, system_prompt, temperature, max_tokens)

    # ── Gemini ────────────────────────────────────────────────────────────

    def _get_gemini(self):
        if self._gemini_model is None:
            from core.gemini_rest import genai_rest
            self._gemini_model = "gemini-2.5-flash"
        return self._gemini_model

    def _gemini_generate(self, prompt, system_prompt, temperature, max_tokens, format=None):
        from core.gemini_rest import genai_rest
        model = self._get_gemini()
        
        response = genai_rest.generate_content(
            model=model,
            contents=[system_prompt + "\n\n" + prompt],
            temperature=temperature,
            max_tokens=max_tokens,
            format=format
        )
        return response.text

    def _gemini_stream(self, prompt, system_prompt, temperature, max_tokens):
        from core.gemini_rest import genai_rest
        model = self._get_gemini()
        
        # Simple fallback for stream since REST wrapper doesn't do SSE yet
        response = genai_rest.generate_content(
            model=model,
            contents=[system_prompt + "\n\n" + prompt],
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        # Yield the whole text in one chunk
        if response and hasattr(response, 'text') and response.text:
            yield response.text

    # ── OpenAI ────────────────────────────────────────────────────────────

    def _get_openai(self):
        if self._openai_client is None:
            from openai import OpenAI
            self._openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
        return self._openai_client

    def _openai_generate(self, prompt, system_prompt, temperature, max_tokens, format=None):
        client = self._get_openai()
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        kwargs = {
            "model": "gpt-4o-mini",
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if format == "json":
            kwargs["response_format"] = {"type": "json_object"}

        response = client.chat.completions.create(**kwargs)
        return response.choices[0].message.content

    def _openai_stream(self, prompt, system_prompt, temperature, max_tokens):
        client = self._get_openai()
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        stream = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
        )
        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    # ── Groq ──────────────────────────────────────────────────────────────

    def _get_groq(self):
        from openai import OpenAI
        return OpenAI(api_key=settings.GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")

    def _groq_generate(self, prompt, system_prompt, temperature, max_tokens, format=None):
        client = self._get_groq()
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        kwargs = {
            "model": settings.GROQ_MODEL,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if format == "json":
            kwargs["response_format"] = {"type": "json_object"}

        response = client.chat.completions.create(**kwargs)
        return response.choices[0].message.content

    def _groq_stream(self, prompt, system_prompt, temperature, max_tokens):
        client = self._get_groq()
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        stream = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
        )
        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    # ── Ollama ────────────────────────────────────────────────────────────

    def _get_ollama(self):
        if self._ollama_client is None:
            import ollama
            self._ollama_client = ollama.Client(host=settings.OLLAMA_BASE_URL)
        return self._ollama_client

    def _ollama_generate(self, prompt, system_prompt, temperature, max_tokens, format=None):
        client = self._get_ollama()
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            import httpx
            
            kwargs = {
                "model": settings.OLLAMA_MODEL,
                "messages": messages,
                "options": {"temperature": temperature, "num_predict": max_tokens},
            }
            if format:
                kwargs["format"] = format
                
            response = client.chat(**kwargs)
            return response["message"]["content"]
        except httpx.ConnectError:
            raise Exception("Ollama is not running. Please start the Ollama application on your machine.")
        except Exception as e:
            raise Exception(f"Ollama error: {str(e)}")

    def _ollama_stream(self, prompt, system_prompt, temperature, max_tokens):
        client = self._get_ollama()
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            import httpx
            stream = client.chat(
                model=settings.OLLAMA_MODEL,
                messages=messages,
                stream=True,
                options={"temperature": temperature, "num_predict": max_tokens},
            )
            for chunk in stream:
                if chunk["message"]["content"]:
                    yield chunk["message"]["content"]
        except httpx.ConnectError:
            raise Exception("Ollama is not running. Please start the Ollama application on your machine.")
        except Exception as e:
            raise Exception(f"Ollama error: {str(e)}")
