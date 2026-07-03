import httpx
import logging
from config import settings

logger = logging.getLogger(__name__)

class GeminiREST:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"

    def embed_content(self, model: str, content: list[str], task_type: str = "retrieval_document", output_dimensionality: int = None):
        if not self.api_key:
            dim = output_dimensionality or 768
            return {"embedding": [[0.0] * dim for _ in content]}
        
        model_path = model if model.startswith("models/") else f"models/{model}"
        url = f"{self.base_url}/{model_path.replace('models/', '')}:batchEmbedContents?key={self.api_key}"
        
        requests = []
        for text in content:
            req_item = {
                "model": model_path,
                "content": {"parts": [{"text": text}]},
                "taskType": task_type.upper()
            }
            if output_dimensionality:
                req_item["outputDimensionality"] = output_dimensionality
            requests.append(req_item)
            
        payload = {"requests": requests}
        
        try:
            import time as _time
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    with httpx.Client(timeout=30.0) as client:
                        response = client.post(url, json=payload)
                        response.raise_for_status()
                        data = response.json()
                        
                        embeddings = []
                        for emb in data.get("embeddings", []):
                            embeddings.append(emb.get("values", []))
                        
                        if not embeddings and content:
                             return {"embedding": [[0.0] * (output_dimensionality or 768) for _ in content]}
                        return {"embedding": embeddings}
                except httpx.HTTPStatusError as e:
                    if e.response.status_code == 429 and attempt < max_retries - 1:
                        wait = 2 ** (attempt + 1)  # 2s, 4s
                        logger.warning(f"Rate limited, retrying in {wait}s...")
                        _time.sleep(wait)
                        continue
                    raise
        except Exception as e:
            logger.error(f"Gemini REST embedding failed: {e}")
            raise e

    def generate_content(self, model: str, contents: list, temperature: float = 0.7, max_tokens: int = 1000, format: str = None):
        if not self.api_key:
            return type("Response", (), {"text": ""})()
            
        model_path = model if model.startswith("models/") else f"models/{model}"
        url = f"{self.base_url}/{model_path.replace('models/', '')}:generateContent?key={self.api_key}"
        
        import base64
        parts = []
        for c in contents:
            if isinstance(c, str):
                parts.append({"text": c})
            elif isinstance(c, bytes):
                b64_data = base64.b64encode(c).decode('utf-8')
                parts.append({"inlineData": {"mimeType": "image/jpeg", "data": b64_data}})
            elif isinstance(c, dict) and "mime_type" in c:
                parts.append({"inlineData": {"mimeType": c["mime_type"], "data": c["data"]}})
                
        payload = {
            "contents": [{"parts": parts}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens
            }
        }
        
        if format == "json":
            payload["generationConfig"]["responseMimeType"] = "application/json"
        
        try:
            with httpx.Client(timeout=60.0) as client:
                response = client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
                
                try:
                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                except (KeyError, IndexError):
                    text = ""
                return type("Response", (), {"text": text})()
        except Exception as e:
            logger.error(f"Gemini REST generateContent failed: {e}")
            raise e
            
genai_rest = GeminiREST(settings.GEMINI_API_KEY)