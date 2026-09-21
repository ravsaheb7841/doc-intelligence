from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any


class EmbeddingService:
    def __init__(self):
        self._model = None
        self.model_name = "BAAI/bge-small-en-v1.5"
    
    def _load_model(self):
        if self._model is None:
            print(f"Loading embedding model: {self.model_name}...")
            self._model = SentenceTransformer(self.model_name)
            print("Embedding model loaded")
        return self._model
    
    def embed_text(self, text: str) -> List[float]:
        model = self._load_model()
        embedding = model.encode(text, normalize_embeddings=True)
        return embedding.tolist()
    
    def embed_batch(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        model = self._load_model()
        embeddings = model.encode(texts, batch_size=batch_size, normalize_embeddings=True, show_progress_bar=False)
        return [emb.tolist() for emb in embeddings]
    
    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[Dict[str, Any]]:
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
                    chunks.append({"text": current_chunk, "chunk_index": chunk_index, "char_count": len(current_chunk)})
                    chunk_index += 1
                if len(para) > chunk_size:
                    sentences = para.replace(". ", ".|").split("|")
                    sub_chunk = ""
                    for sent in sentences:
                        if len(sub_chunk) + len(sent) + 1 <= chunk_size:
                            sub_chunk += sent + " "
                        else:
                            if sub_chunk:
                                chunks.append({"text": sub_chunk.strip(), "chunk_index": chunk_index, "char_count": len(sub_chunk)})
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
            chunks.append({"text": current_chunk, "chunk_index": chunk_index, "char_count": len(current_chunk)})
        
        return chunks


embedding_service = EmbeddingService()