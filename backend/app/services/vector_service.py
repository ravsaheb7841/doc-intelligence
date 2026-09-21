import os

# Disable ChromaDB telemetry BEFORE import
os.environ["ANONYMIZED_TELEMETRY"] = "False"
os.environ["CHROMA_TELEMETRY_ENABLED"] = "False"

import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions
from typing import List, Dict, Any, Optional

from app.utils.config import settings as app_settings
from app.services.embedding_service import embedding_service


class VectorService:
    """ChromaDB vector store with built-in ONNX embedder (no API needed, low memory)"""

    def __init__(self):
        self._client = None
        self._ef = None

    def _get_embedding_function(self):
        """
        Use ChromaDB's built-in ONNX embedder (all-MiniLM-L6-v2)
        - Downloads ~80MB on first use, then cached
        - Runs on ONNX runtime (no torch)
        - Memory: ~50MB loaded
        """
        if self._ef is None:
            try:
                self._ef = embedding_functions.DefaultEmbeddingFunction()
                print("✅ ChromaDB default embedder loaded (ONNX)")
            except Exception as e:
                print(f"⚠️ Default embedder failed: {e}")
                print("   Falling back to simple TF-IDF-like embedder")
                self._ef = None
        return self._ef

    def _get_client(self):
        if self._client is None:
            persist_dir = str(app_settings.VECTORDB_DIR)
            os.makedirs(persist_dir, exist_ok=True)

            self._client = chromadb.PersistentClient(
                path=persist_dir,
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True,
                ),
            )
            print(f"ChromaDB initialized at: {persist_dir}")
        return self._client

    def _get_collection(self, name: str = "documents"):
        client = self._get_client()
        ef = self._get_embedding_function()

        if ef:
            return client.get_or_create_collection(
                name=name,
                metadata={"hnsw:space": "cosine"},
                embedding_function=ef,
            )
        else:
            # No embedder — ChromaDB will use default
            return client.get_or_create_collection(
                name=name,
                metadata={"hnsw:space": "cosine"},
            )

    async def add_document(
        self,
        document_id: str,
        text: str,
        metadata: Optional[Dict[str, Any]] = None,
        chunk_size: int = 500,
    ) -> Dict[str, Any]:
        """Chunk text and store in ChromaDB (embeddings computed internally)"""
        chunks = embedding_service.chunk_text(text, chunk_size=chunk_size)

        if not chunks:
            raise Exception("No chunks generated from text")

        collection = self._get_collection()

        ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
        documents = [c["text"] for c in chunks]
        metadatas = []

        for i, chunk in enumerate(chunks):
            meta = {
                "document_id": document_id,
                "chunk_index": i,
                "char_count": chunk["char_count"],
            }
            if metadata:
                for k, v in metadata.items():
                    if isinstance(v, (str, int, float, bool)):
                        meta[k] = v
            metadatas.append(meta)

        # ChromaDB computes embeddings automatically using its embedder
        collection.add(
            ids=ids,
            documents=documents,
            metadatas=metadatas,
        )

        print(f"Added {len(chunks)} chunks for document {document_id}")

        return {
            "document_id": document_id,
            "chunks_added": len(chunks),
            "total_chars": sum(c["char_count"] for c in chunks),
        }

    async def search(
        self,
        query: str,
        document_id: Optional[str] = None,
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """Search using ChromaDB's embedder"""
        collection = self._get_collection()

        where = {"document_id": document_id} if document_id else None

        results = collection.query(
            query_texts=[query],
            n_results=top_k,
            where=where,
            include=["documents", "metadatas", "distances"],
        )

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

    async def delete_document(self, document_id: str) -> Dict[str, Any]:
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

    def get_document_chunks(self, document_id: str) -> List[Dict[str, Any]]:
        collection = self._get_collection()
        results = collection.get(
            where={"document_id": document_id},
            include=["documents", "metadatas"],
        )
        chunks = []
        if results and results["documents"]:
            for i, doc in enumerate(results["documents"]):
                chunks.append({
                    "text": doc,
                    "metadata": results["metadatas"][i],
                })
        return chunks

    def get_stats(self) -> Dict[str, Any]:
        collection = self._get_collection()
        return {
            "total_chunks": collection.count(),
            "collection": collection.name,
        }


vector_service = VectorService()