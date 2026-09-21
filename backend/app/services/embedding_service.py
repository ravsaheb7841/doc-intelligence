import httpx
import os
from typing import List, Dict, Any
from app.utils.config import settings


class EmbeddingService:
    """Generate embeddings using Groq API (no local model = low memory)"""

    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.base_url = "https://api.groq.com/openai/v1/embeddings"
        # Groq's free embedding model
        self.model = "nomic-embed-text-v1.5"
        self.dimension = 768

    @property
    def is_available(self) -> bool:
        return bool(self.api_key) and self.api_key != "your-groq-api-key-here"

    async def _call_embeddings_api(self, texts: List[str]) -> List[List[float]]:
        """Call Groq embeddings API"""
        if not self.is_available:
            raise Exception("Groq API key not configured")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "input": texts,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(self.base_url, headers=headers, json=payload)

            if response.status_code != 200:
                error_text = response.text[:500]
                raise Exception(f"Groq embeddings error {response.status_code}: {error_text}")

            data = response.json()
            embeddings = [item["embedding"] for item in data["data"]]
            return embeddings

    async def embed_text(self, text: str) -> List[float]:
        """Generate embedding for single text"""
        results = await self._call_embeddings_api([text])
        return results[0]

    async def embed_batch(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        """Generate embeddings for multiple texts (batched)"""
        all_embeddings = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            embeddings = await self._call_embeddings_api(batch)
            all_embeddings.extend(embeddings)
        return all_embeddings

    def chunk_text(
        self,
        text: str,
        chunk_size: int = 500,
        overlap: int = 50,
    ) -> List[Dict[str, Any]]:
        """Split text into chunks for embedding"""
        chunks = []
        text = text.strip()

        if not text:
            return chunks

        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        current_chunk = ""
        chunk_index = 0

        for para in paragraphs:
            if len(current_chunk) + len(para) + 2 <= chunk_size:
                current_chunk = (current_chunk + "\n\n" + para) if current_chunk else para
            else:
                if current_chunk:
                    chunks.append({
                        "text": current_chunk,
                        "chunk_index": chunk_index,
                        "char_count": len(current_chunk),
                    })
                    chunk_index += 1

                if len(para) > chunk_size:
                    sentences = para.replace(". ", ".|").split("|")
                    sub_chunk = ""
                    for sent in sentences:
                        if len(sub_chunk) + len(sent) + 1 <= chunk_size:
                            sub_chunk += sent + " "
                        else:
                            if sub_chunk:
                                chunks.append({
                                    "text": sub_chunk.strip(),
                                    "chunk_index": chunk_index,
                                    "char_count": len(sub_chunk),
                                })
                                chunk_index += 1

                            if chunks and overlap > 0:
                                prev = chunks[-1]["text"]
                                sub_chunk = prev[-overlap:] + " " + sent + " "
                            else:
                                sub_chunk = sent + " "
                    current_chunk = sub_chunk.strip()
                else:
                    if chunks and overlap > 0:
                        prev = chunks[-1]["text"]
                        current_chunk = prev[-overlap:] + "\n\n" + para
                    else:
                        current_chunk = para

        if current_chunk:
            chunks.append({
                "text": current_chunk,
                "chunk_index": chunk_index,
                "char_count": len(current_chunk),
            })

        return chunks


embedding_service = EmbeddingService()