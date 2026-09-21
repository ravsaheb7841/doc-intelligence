from datetime import datetime
from app.services.llm_service import llm_service
from app.services.validation_service import validation_service
from app.services.prompt_templates import get_extraction_prompt, get_classifier_prompt


class ExtractionService:
    """Extract structured data from documents using LLM"""
    
    async def classify_document(self, text: str) -> dict:
        """Classify document type"""
        if not text or len(text.strip()) < 20:
            return {
                "document_type": "other",
                "confidence": 0.0,
                "reasoning": "Text too short",
            }
        
        try:
            system, user = get_classifier_prompt(text)
            result = await llm_service.extract_json(system, user)
            
            if not result or "data" not in result:
                print("[EXTRACT] Classification: no data returned")
                return {
                    "document_type": "other",
                    "confidence": 0.0,
                    "reasoning": "No data from LLM",
                }
            
            data = result["data"]
            
            return {
                "document_type": data.get("document_type", "other"),
                "confidence": float(data.get("confidence", 0.0)),
                "reasoning": data.get("reasoning", ""),
            }
        except Exception as e:
            print(f"[EXTRACT] Classification failed: {e}")
            return {
                "document_type": "other",
                "confidence": 0.0,
                "reasoning": f"Classification error: {str(e)[:100]}",
            }
    
    async def extract_fields(self, text: str, document_type: str = "other") -> dict:
        """Extract structured fields from document text"""
        
        if not text or len(text.strip()) < 20:
            raise Exception("Text too short for extraction")
        
        print(f"[EXTRACT] Text length: {len(text)} chars")
        print(f"[EXTRACT] Document type: {document_type}")
        
        try:
            system, user = get_extraction_prompt(document_type, text)
            
            print(f"[EXTRACT] Calling LLM...")
            result = await llm_service.extract_json(system, user)
            
            if not result:
                raise Exception("LLM returned None")
            
            if "data" not in result:
                raise Exception(f"Missing 'data' key in response: {result.keys()}")
            
            extracted = result["data"]
            
            if not extracted:
                raise Exception("Empty extraction result")
            
            # Log fields
            print(f"[EXTRACT] Extracted {len(extracted)} fields")
            for key, value in list(extracted.items())[:10]:
                if value is not None and value != "" and value != []:
                    preview = str(value)[:80]
                    print(f"  - {key}: {preview}")
            
            # Validate and clean
            print(f"[EXTRACT] Validating data...")
            cleaned = validation_service.validate_and_fix(extracted, document_type)
            
            filled_fields = sum(
                1 for v in cleaned.values()
                if v is not None and v != "" and v != []
            )
            
            print(f"[EXTRACT] Done: {filled_fields}/{len(cleaned)} fields filled")
            
            return {
                "document_type": document_type,
                "extracted_data": cleaned,
                "raw_extraction": extracted,
                "field_count": len(cleaned),
                "filled_fields": filled_fields,
                "extraction_method": "llm+validation",
                "model": result.get("usage", {}).get("model", "groq"),
            }
            
        except Exception as e:
            print(f"[EXTRACT] ERROR: {e}")
            import traceback
            traceback.print_exc()
            raise Exception(f"Extraction failed: {str(e)}")
    
    async def extract_with_classification(self, text: str) -> dict:
        """Auto-classify then extract"""
        classification = await self.classify_document(text)
        doc_type = classification["document_type"]
        
        print(f"[EXTRACT] Classified as: {doc_type}")
        
        # If classified as "other", try invoice as default (common case)
        if doc_type == "other":
            print(f"[EXTRACT] Retrying as 'invoice' (default)")
            doc_type = "invoice"
        
        extraction = await self.extract_fields(text, doc_type)
        extraction["classification"] = classification
        
        return extraction
    
    async def extract_from_document(self, document: dict) -> dict:
        """Extract data from a processed document"""
        text = document.get("extracted_text", "")
        
        if not text or len(text.strip()) < 20:
            raise Exception("No text available for extraction")
        
        result = await self.extract_with_classification(text)
        result["document_id"] = document.get("document_id")
        result["extracted_at"] = datetime.utcnow().isoformat()
        
        return result
    
    async def extract_from_pages(self, pages_text: list, document_type: str = "other") -> dict:
        """Extract from multiple pages"""
        combined_text = "\n\n".join(pages_text)
        return await self.extract_fields(combined_text, document_type)


extraction_service = ExtractionService()