import re
from typing import List, Dict, Any


class EmbeddingService:
    """
    Lightweight embedding service.
    
    ChromaDB handles embeddings internally using its default ONNX embedder
    (all-MiniLM-L6-v2). This service only handles text chunking.
    
    Memory: ~50MB (vs sentence-transformers 500MB+)
    Quality: Good (384 dims, MTEB benchmark: 56.26)
    """

    def __init__(self):
        print("EmbeddingService: ChromaDB default embedder (ONNX, low memory)")

    def chunk_text(
        self,
        text: str,
        chunk_size: int = 500,
        overlap: int = 50,
    ) -> List[Dict[str, Any]]:
        """Split text into chunks"""
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
                    # Split long paragraph by sentences
                    sentences = re.split(r'(?<=[.!?])\s+', para)
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