from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class DocumentMetadata(BaseModel):
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    page_count: int
    document_type: Optional[str] = None


class DocumentResponse(BaseModel):
    id: str
    user_id: str
    filename: str
    file_type: str
    file_size: int
    page_count: int
    status: str
    document_type: Optional[str] = None
    ocr_confidence: Optional[float] = None
    created_at: datetime
    processed_at: Optional[datetime] = None