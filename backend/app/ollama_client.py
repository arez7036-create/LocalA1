import httpx
import json
from typing import AsyncGenerator, List
from app.config import get_settings

settings = get_settings()

class OllamaClient:
    def __init__(self):
        self.base_url = settings.OLLAMA_HOST
        self.client = httpx.AsyncClient(timeout=120.0)
    
    async def start(self):
        try:
            await self.client.get(f"{self.base_url}/api/tags")
        except Exception:
            pass
    
    async def close(self):
        await self.client.aclose()
    
    async def list_models(self) -> List[str]:
        resp = await self.client.get(f"{self.base_url}/api/tags")
        resp.raise_for_status()
        data = resp.json()
        return [m["name"] for m in data.get("models", [])]
    
    async def chat_stream(self, model: str, messages: list[dict]) -> AsyncGenerator[str, None]:
        async with self.client.stream(
            "POST",
            f"{self.base_url}/api/chat",
            json={"model": model, "messages": messages, "stream": True},
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line.strip():
                    try:
                        data = json.loads(line)
                        if "message" in data:
                            yield json.dumps({"content": data["message"].get("content", ""), "done": data.get("done", False)})
                    except json.JSONDecodeError:
                        continue
    
    async def chat(self, model: str, messages: list[dict]) -> dict:
        resp = await self.client.post(
            f"{self.base_url}/api/chat",
            json={"model": model, "messages": messages, "stream": False},
        )
        resp.raise_for_status()
        return resp.json()
    
    async def health_check(self) -> bool:
        try:
            resp = await self.client.get(f"{self.base_url}/api/tags", timeout=5.0)
            return resp.status_code == 200
        except Exception:
            return False

ollama_client = OllamaClient()