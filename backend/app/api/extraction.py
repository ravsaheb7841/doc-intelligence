from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from bson import ObjectId
from app.auth.utils import get_current_user
from app.utils.database import get_db
from app.services.extraction_service import extraction_service

router = APIRouter()


class ExtractRequest(BaseModel):
    document_type: Optional[str] = None
    force: bool = False


@router.post("/{document_id}/extract")
async def extract_document(document_id: str, request: ExtractRequest = ExtractRequest(),
                            current_user: dict = Depends(get_current_user)):
    db = await get_db()
    doc = await db.documents.find_one({"document_id": document_id, "user_id": current_user["id"]})
    if not doc:
        raise HTTPException(404, "Document not found")
    
    if doc["status"] not in ["ready", "extracted", "indexed"]:
        raise HTTPException(400, f"Document must be processed first. Status: {doc['status']}")
    
    if not request.force and doc.get("extraction"):
        return {"message": "Extraction from cache", "document_id": document_id, "cached": True, "extraction": doc["extraction"]}
    
    text = doc.get("extracted_text", "")
    if not text or len(text.strip()) < 20:
        raise HTTPException(400, "No text available for extraction")
    
    try:
        if request.document_type and request.document_type != "auto":
            result = await extraction_service.extract_fields(text, request.document_type)
        else:
            result = await extraction_service.extract_with_classification(text)
        
        await db.documents.update_one({"_id": doc["_id"]}, {
            "$set": {
                "status": "extracted",
                "document_type": result.get("document_type", "other"),
                "extraction": result.get("extracted_data", {}),
                "extraction_metadata": {
                    "field_count": result.get("field_count", 0),
                    "filled_fields": result.get("filled_fields", 0),
                    "model": result.get("model"),
                    "extracted_at": datetime.utcnow().isoformat(),
                    "classification": result.get("classification", {}),
                },
                "extracted_at": datetime.utcnow(),
            }
        })
        
        return {
            "message": "Extraction successful",
            "document_id": document_id,
            "cached": False,
            "document_type": result.get("document_type"),
            "extraction": result.get("extracted_data"),
            "classification": result.get("classification"),
            "field_count": result.get("field_count"),
            "filled_fields": result.get("filled_fields"),
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Extraction failed: {str(e)}")


@router.get("/{document_id}/extraction")
async def get_extraction(document_id: str, current_user: dict = Depends(get_current_user)):
    db = await get_db()
    doc = await db.documents.find_one({"document_id": document_id, "user_id": current_user["id"]})
    if not doc:
        raise HTTPException(404, "Document not found")
    if not doc.get("extraction"):
        raise HTTPException(404, "No extraction available")
    return {
        "document_id": document_id,
        "document_type": doc.get("document_type"),
        "extraction": doc.get("extraction"),
        "metadata": doc.get("extraction_metadata", {}),
    }


@router.delete("/{document_id}/extraction")
async def delete_extraction(document_id: str, current_user: dict = Depends(get_current_user)):
    db = await get_db()
    doc = await db.documents.find_one({"document_id": document_id, "user_id": current_user["id"]})
    if not doc:
        raise HTTPException(404, "Document not found")
    await db.documents.update_one({"_id": doc["_id"]}, {
        "$unset": {"extraction": "", "extraction_metadata": "", "extracted_at": ""},
        "$set": {"status": "ready"}
    })
    return {"message": "Extraction deleted"}