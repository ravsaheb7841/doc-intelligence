from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request
from fastapi.responses import FileResponse
from bson import ObjectId
from datetime import datetime
from pathlib import Path
import aiofiles
import os
import uuid
import traceback

from app.auth.utils import get_current_user
from app.utils.database import get_db
from app.utils.config import settings

router = APIRouter()


def validate_file(file: UploadFile) -> str:
    if not file.filename:
        raise HTTPException(400, "No filename provided")
    ext = Path(file.filename).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type: {ext}")
    return ext


@router.post("/upload")
async def upload_document(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    db = await get_db()
    ext = validate_file(file)
    content = await file.read()
    
    if len(content) == 0:
        raise HTTPException(400, "File is empty")
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(400, f"File too large. Max: {settings.MAX_FILE_SIZE // (1024*1024)}MB")
    
    document_id = str(uuid.uuid4())
    safe_filename = f"{document_id}{ext}"
    file_path = settings.UPLOAD_DIR / safe_filename
    
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)
    
    doc_record = {
        "_id": ObjectId(),
        "document_id": document_id,
        "user_id": current_user["id"],
        "filename": safe_filename,
        "original_filename": file.filename,
        "file_type": ext[1:],
        "file_size": len(content),
        "file_path": str(file_path),
        "status": "uploaded",
        "created_at": datetime.utcnow(),
        "page_count": 0,
    }
    
    result = await db.documents.insert_one(doc_record)
    return {
        "message": "File uploaded successfully",
        "document_id": document_id,
        "id": str(result.inserted_id),
        "filename": file.filename,
        "file_size": len(content),
        "status": "uploaded"
    }


@router.post("/{document_id}/process")
async def process_document(document_id: str, current_user: dict = Depends(get_current_user)):
    print(f"\n[PROCESS] Starting: {document_id}")
    db = await get_db()
    
    doc = await db.documents.find_one({"document_id": document_id, "user_id": current_user["id"]})
    if not doc:
        raise HTTPException(404, "Document not found")
    
    if doc["status"] == "ready":
        return {"message": "Already processed", "document_id": document_id, "status": "ready"}
    
    try:
        await db.documents.update_one({"_id": doc["_id"]}, {"$set": {"status": "converting"}})
        
        from app.services.pdf_service import pdf_service
        process_result = pdf_service.process_file(doc["file_path"], document_id)
        
        await db.documents.update_one({"_id": doc["_id"]}, {"$set": {"status": "ocr"}})
        
        from app.services.ocr_service import ocr_service
        ocr_result = ocr_service.extract_from_pages(process_result["pages"])
        
        await db.documents.update_one({"_id": doc["_id"]}, {
            "$set": {
                "status": "ready",
                "page_count": process_result["page_count"],
                "pages": process_result["pages"],
                "extracted_text": ocr_result["full_text"],
                "ocr_data": ocr_result,
                "ocr_confidence": ocr_result["avg_confidence"],
                "processed_at": datetime.utcnow(),
            }
        })
        
        return {
            "message": "Document processed successfully",
            "document_id": document_id,
            "status": "ready",
            "page_count": process_result["page_count"],
            "total_lines": ocr_result["total_lines"],
            "ocr_confidence": ocr_result["avg_confidence"],
            "preview": ocr_result["full_text"][:500]
        }
    except Exception as e:
        print(f"[PROCESS] ERROR: {e}")
        traceback.print_exc()
        await db.documents.update_one({"_id": doc["_id"]}, {"$set": {"status": "failed", "error": str(e)}})
        raise HTTPException(500, f"Processing failed: {str(e)}")


@router.get("")
async def list_documents(current_user: dict = Depends(get_current_user)):
    db = await get_db()
    docs = await db.documents.find(
        {"user_id": current_user["id"]},
        {"extracted_text": 0, "ocr_data": 0}
    ).sort("created_at", -1).to_list(None)
    
    for doc in docs:
        doc["_id"] = str(doc["_id"])
        if doc.get("created_at"):
            doc["created_at"] = doc["created_at"].isoformat()
    return {"documents": docs, "total": len(docs)}

@router.get("/{document_id}")
async def get_document(document_id: str, current_user: dict = Depends(get_current_user)):
    db = await get_db()
    doc = await db.documents.find_one({"document_id": document_id, "user_id": current_user["id"]})
    if not doc:
        raise HTTPException(404, "Document not found")
    
    doc["_id"] = str(doc["_id"])
    if doc.get("created_at"):
        doc["created_at"] = doc["created_at"].isoformat()
    if doc.get("processed_at"):
        doc["processed_at"] = doc["processed_at"].isoformat()
    return doc

from app.auth.utils import get_current_user, get_current_user_optional

@router.get("/{document_id}/page/{page_num}")
async def get_page_image(
    document_id: str,
    page_num: int,
    current_user: dict = Depends(get_current_user_optional)
):
    """Get page image"""
    db = await get_db()
    
    doc = await db.documents.find_one({
        "document_id": document_id,
        "user_id": current_user["id"]
    })
    
    if not doc:
        raise HTTPException(404, "Document not found")
    
    pages = doc.get("pages", [])
    if page_num < 1 or page_num > len(pages):
        raise HTTPException(404, "Page not found")
    
    page_path = pages[page_num - 1]
    if not os.path.exists(page_path):
        raise HTTPException(404, "Page image not found")
    
    return FileResponse(page_path, media_type="image/png")

@router.delete("/{document_id}")
async def delete_document(document_id: str, current_user: dict = Depends(get_current_user)):
    db = await get_db()
    doc = await db.documents.find_one({"document_id": document_id, "user_id": current_user["id"]})
    if not doc:
        raise HTTPException(404, "Document not found")
    
    try:
        if os.path.exists(doc["file_path"]):
            os.remove(doc["file_path"])
        import shutil
        processed_dir = settings.PROCESSED_DIR / document_id
        if processed_dir.exists():
            shutil.rmtree(processed_dir)
    except Exception as e:
        print(f"File deletion warning: {e}")
    
    await db.documents.delete_one({"_id": doc["_id"]})
    return {"message": "Document deleted"}