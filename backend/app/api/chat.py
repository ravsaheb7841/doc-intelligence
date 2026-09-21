from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from bson import ObjectId
from app.auth.utils import get_current_user
from app.utils.database import get_db
from app.services.vector_service import vector_service
from app.services.rag_service import rag_service

router = APIRouter()


class ChatRequest(BaseModel):
    question: str
    document_id: Optional[str] = None
    top_k: int = 5


class IndexRequest(BaseModel):
    chunk_size: int = 500


@router.post("/{document_id}/index")
async def index_document(document_id: str, request: IndexRequest = IndexRequest(),
                          current_user: dict = Depends(get_current_user)):
    db = await get_db()
    doc = await db.documents.find_one({"document_id": document_id, "user_id": current_user["id"]})
    if not doc:
        raise HTTPException(404, "Document not found")
    
    if doc["status"] not in ["ready", "extracted", "indexed"]:
        raise HTTPException(400, f"Document must be processed. Status: {doc['status']}")
    
    text = doc.get("extracted_text", "")
    if not text or len(text.strip()) < 20:
        raise HTTPException(400, "No text available")
    
    try:
        await vector_service.delete_document(document_id)
        result = await vector_service.add_document(
            document_id=document_id,
            text=text,
            metadata={"filename": doc.get("original_filename", ""), "document_type": doc.get("document_type", "other")},
            chunk_size=request.chunk_size,
        )
        await db.documents.update_one({"_id": doc["_id"]}, {
            "$set": {"status": "indexed", "indexed_at": datetime.utcnow(), "chunk_count": result["chunks_added"]}
        })
        return {"message": "Document indexed successfully", "document_id": document_id, "chunks_added": result["chunks_added"]}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Indexing failed: {str(e)}")


@router.post("/chat")
async def chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    db = await get_db()
    if request.document_id:
        doc = await db.documents.find_one({"document_id": request.document_id, "user_id": current_user["id"]})
        if not doc:
            raise HTTPException(404, "Document not found")
    
    try:
        result = await rag_service.chat(
            question=request.question,
            document_id=request.document_id,
            top_k=request.top_k,
        )
        await db.chat_history.insert_one({
            "user_id": current_user["id"],
            "document_id": request.document_id,
            "question": request.question,
            "answer": result["answer"],
            "sources": result.get("sources", []),
            "created_at": datetime.utcnow(),
        })
        return result
    except Exception as e:
        raise HTTPException(500, f"Chat failed: {str(e)}")


@router.get("/chat/history")
async def get_chat_history(document_id: Optional[str] = None, limit: int = 50,
                          current_user: dict = Depends(get_current_user)):
    db = await get_db()
    query = {"user_id": current_user["id"]}
    if document_id:
        query["document_id"] = document_id
    history = await db.chat_history.find(query).sort("created_at", -1).limit(limit).to_list(None)
    for item in history:
        item["_id"] = str(item["_id"])
        if item.get("created_at"):
            item["created_at"] = item["created_at"].isoformat()
    return {"history": history, "total": len(history)}


@router.delete("/chat/history")
async def clear_chat_history(document_id: Optional[str] = None,
                              current_user: dict = Depends(get_current_user)):
    db = await get_db()
    query = {"user_id": current_user["id"]}
    if document_id:
        query["document_id"] = document_id
    result = await db.chat_history.delete_many(query)
    return {"message": "Chat history cleared", "deleted": result.deleted_count}


@router.post("/{document_id}/summarize")
async def summarize_document(document_id: str, current_user: dict = Depends(get_current_user)):
    db = await get_db()
    doc = await db.documents.find_one({"document_id": document_id, "user_id": current_user["id"]})
    if not doc:
        raise HTTPException(404, "Document not found")
    try:
        return await rag_service.summarize_document(document_id, "medium")
    except Exception as e:
        raise HTTPException(500, f"Summary failed: {str(e)}")


@router.get("/vector/stats")
async def vector_stats(current_user: dict = Depends(get_current_user)):
    return vector_service.get_stats()