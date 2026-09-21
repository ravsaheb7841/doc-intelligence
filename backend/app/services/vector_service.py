import os

# Disable ChromaDB telemetry - must be set before chromadb import
os.environ["ANONYMIZED_TELEMETRY"] = "False"
os.environ["CHROMA_TELEMETRY_ENABLED"] = "False"

import chromadb
from chromadb.config import Settings
from typing import List, Dict, Any, Optional

from app.utils.config import settings as app_settings
from app.services.embedding_service import embedding_service


class VectorService:
    def __init__(self):
        self._client = None
    
    def _get_client(self):
        """Lazy load ChromaDB client"""
        if self._client is None:
            persist_dir = str(app_settings.VECTORDB_DIR)
            os.makedirs(persist_dir, exist_ok=True)
        
            # Disable telemetry
            os.environ["ANONYMIZED_TELEMETRY"] = "False"
            os.environ["CHROMA_TELEMETRY_ENABLED"] = "False"
        
            self._client = chromadb.PersistentClient(
                path=persist_dir,
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True,
                    is_persistent=True,
                ),
            )
            print(f"ChromaDB initialized at: {persist_dir}")
        return self._client
    
    def _get_collection(self, name: str = "documents"):
        client = self._get_client()
        return client.get_or_create_collection(name=name, metadata={"hnsw:space": "cosine"})
    
    async def add_document(self, document_id: str, text: str, metadata: Optional[Dict] = None, chunk_size: int = 500) -> Dict:
        chunks = embedding_service.chunk_text(text, chunk_size=chunk_size)
        if not chunks:
            raise Exception("No chunks generated")
        
        chunk_texts = [c["text"] for c in chunks]
        embeddings = embedding_service.embed_batch(chunk_texts)
        collection = self._get_collection()
        
        ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
        metadatas = []
        for i, chunk in enumerate(chunks):
            meta = {"document_id": document_id, "chunk_index": i, "char_count": chunk["char_count"]}
            if metadata:
                for k, v in metadata.items():
                    if isinstance(v, (str, int, float, bool)):
                        meta[k] = v
            metadatas.append(meta)
        
        collection.add(ids=ids, embeddings=embeddings, documents=chunk_texts, metadatas=metadatas)
        return {"document_id": document_id, "chunks_added": len(chunks), "total_chars": sum(c["char_count"] for c in chunks)}
    
    async def search(self, query: str, document_id: Optional[str] = None, top_k: int = 5) -> List[Dict]:
        collection = self._get_collection()
        query_embedding = embedding_service.embed_text(query)
        where = {"document_id": document_id} if document_id else None
        
        results = collection.query(query_embeddings=[query_embedding], n_results=top_k, where=where,
                                    include=["documents", "metadatas", "distances"])
        
        formatted = []
        if results and results["documents"] and results["documents"][0]:
            for i, doc in enumerate(results["documents"][0]):
                meta = results["metadatas"][0][i]
                distance = results["distances"][0][i]
                formatted.append({
                    "text": doc,
                    "document_id": meta.get("document_id"),
                    "chunk_index": meta.get("chunk_index"),
                    "similarity": round(1 - distance, 4),
                    "metadata": meta,
                })
        return formatted
    
    async def delete_document(self, document_id: str) -> Dict:
        collection = self._get_collection()
        try:
            existing = collection.get(where={"document_id": document_id})
            count = len(existing["ids"]) if existing and existing["ids"] else 0
            if count > 0:
                collection.delete(where={"document_id": document_id})
            return {"document_id": document_id, "deleted_chunks": count}
        except Exception as e:
            print(f"Delete warning: {e}")
            return {"document_id": document_id, "deleted_chunks": 0}
    
    def get_document_chunks(self, document_id: str) -> List[Dict]:
        collection = self._get_collection()
        results = collection.get(where={"document_id": document_id}, include=["documents", "metadatas"])
        chunks = []
        if results and results["documents"]:
            for i, doc in enumerate(results["documents"]):
                chunks.append({"text": doc, "metadata": results["metadatas"][i]})
        return chunks
    
    def get_stats(self) -> Dict:
        collection = self._get_collection()
        return {"total_chunks": collection.count(), "collection": collection.name}


vector_service = VectorService()