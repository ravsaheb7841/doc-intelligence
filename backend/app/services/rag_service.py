from typing import Dict, Any, List, Optional
from app.services.llm_service import llm_service
from app.services.vector_service import vector_service


class RAGService:
    SYSTEM_PROMPT = """You are a document analysis assistant.
Answer questions based ONLY on the provided document excerpts.

RULES:
1. Only use information from the provided context
2. If the answer is not in the context, say "I could not find this information in the document"
3. Be concise and direct
4. Quote specific values when relevant
5. Do not make up information"""
    
    async def chat(self, question: str, document_id: Optional[str] = None, top_k: int = 5,
                   conversation_history: Optional[List[Dict]] = None) -> Dict[str, Any]:
        chunks = await vector_service.search(query=question, document_id=document_id, top_k=top_k)
        
        if not chunks:
            return {
                "answer": "I could not find any relevant information. Please make sure you have uploaded and processed documents.",
                "sources": [], "chunks_used": 0, "source": "no_context"
            }
        
        context_parts = []
        for i, chunk in enumerate(chunks, 1):
            similarity = chunk.get("similarity", 0)
            context_parts.append(f"[Excerpt {i} | Relevance: {similarity:.2%}]\n{chunk['text']}")
        context = "\n\n---\n\n".join(context_parts)
        
        user_prompt = f"""DOCUMENT EXCERPTS:
{context}

QUESTION: {question}

Answer based only on the excerpts above."""
        
        result = await llm_service.chat(system_prompt=self.SYSTEM_PROMPT, user_prompt=user_prompt,
                                         temperature=0.2, max_tokens=1000)
        
        sources = [{
            "chunk_index": c.get("chunk_index"),
            "document_id": c.get("document_id"),
            "similarity": c.get("similarity"),
            "preview": c["text"][:200] + ("..." if len(c["text"]) > 200 else ""),
        } for c in chunks]
        
        return {
            "answer": result["content"],
            "sources": sources,
            "chunks_used": len(chunks),
            "avg_similarity": round(sum(c.get("similarity", 0) for c in chunks) / len(chunks), 4),
            "source": "rag",
            "model": result.get("model"),
        }
    
    async def summarize_document(self, document_id: str, max_length: str = "medium") -> Dict:
        chunks = vector_service.get_document_chunks(document_id)
        if not chunks:
            raise Exception("No chunks found")
        
        full_text = "\n\n".join(c["text"] for c in chunks)[:10000]
        length_map = {"short": "2-3 sentences", "medium": "1 paragraph", "long": "3-4 paragraphs"}
        
        result = await llm_service.chat(
            system_prompt="You are a document summarizer.",
            user_prompt=f"Summarize in {length_map.get(max_length, '1 paragraph')}:\n\n{full_text}",
            temperature=0.3, max_tokens=800,
        )
        
        return {"document_id": document_id, "summary": result["content"], "length": max_length, "chunks_analyzed": len(chunks)}
    
    async def extract_entities(self, document_id: str) -> Dict:
        chunks = vector_service.get_document_chunks(document_id)
        if not chunks:
            raise Exception("No chunks found")
        
        full_text = "\n\n".join(c["text"] for c in chunks)[:8000]
        result = await llm_service.extract_json(
            system_prompt="Extract named entities. Return JSON only.",
            user_prompt=f"""Extract entities from this document.

Return JSON:
{{
  "people": [], "organizations": [], "locations": [],
  "dates": [], "amounts": [], "emails": [], "phones": [], "ids": []
}}

DOCUMENT:
{full_text}""",
        )
        return {"document_id": document_id, "entities": result["data"]}


rag_service = RAGService()