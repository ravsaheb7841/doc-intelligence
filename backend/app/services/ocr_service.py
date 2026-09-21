import os
import warnings
from typing import List, Dict, Any
from PIL import Image

warnings.filterwarnings("ignore")

# Try importing PaddleOCR, fallback to Tesseract
try:
    from paddleocr import PaddleOCR
    PADDLE_AVAILABLE = True
except ImportError:
    PADDLE_AVAILABLE = False
    print("PaddleOCR not available, will use Tesseract")

try:
    import pytesseract
    import pytesseract.pytesseract as pt
    possible_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        "/usr/bin/tesseract",
        "/usr/local/bin/tesseract",
    ]
    for path in possible_paths:
        if os.path.exists(path):
            pt.tesseract_cmd = path
            break
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    print("Tesseract not available")


class OCRService:
    """OCR service using PaddleOCR with Tesseract fallback"""
    
    def __init__(self):
        self._paddle_ocr = None
    
    def _get_paddle_ocr(self):
        """Lazy load PaddleOCR"""
        if self._paddle_ocr is None and PADDLE_AVAILABLE:
            print("Initializing PaddleOCR (first time may take 30s)...")
            self._paddle_ocr = PaddleOCR(
                use_angle_cls=True,
                lang='en',
                show_log=False,
                use_gpu=False,
                det_db_thresh=0.3,
                det_db_box_thresh=0.5,
                det_db_unclip_ratio=1.6,
                drop_score=0.3,
                rec_batch_num=6,
            )
            print("PaddleOCR initialized")
        return self._paddle_ocr
    
    def extract_with_paddle(self, image_path: str) -> Dict[str, Any]:
        """Extract text with PaddleOCR"""
        ocr = self._get_paddle_ocr()
        if ocr is None:
            raise Exception("PaddleOCR not available")
        
        result = ocr.ocr(image_path, cls=True)
        
        if not result or not result[0]:
            return {
                "text": "",
                "lines": [],
                "confidence": 0.0,
                "engine": "paddleocr",
                "line_count": 0,
            }
        
        lines = []
        full_text = []
        confidences = []
        
        for line in result[0]:
            bbox = line[0]
            text = line[1][0]
            confidence = line[1][1]
            
            y_center = sum(p[1] for p in bbox) / 4
            x_left = min(p[0] for p in bbox)
            
            lines.append({
                "text": text,
                "bbox": [[float(p[0]), float(p[1])] for p in bbox],
                "confidence": float(confidence),
                "y_center": float(y_center),
                "x_left": float(x_left),
            })
            full_text.append(text)
            confidences.append(confidence)
        
        lines.sort(key=lambda x: (x["y_center"], x["x_left"]))
        avg_conf = sum(confidences) / len(confidences) if confidences else 0
        
        return {
            "text": "\n".join(full_text),
            "lines": lines,
            "confidence": round(avg_conf, 4),
            "engine": "paddleocr",
            "line_count": len(lines),
        }
    
    def extract_with_tesseract(self, image_path: str) -> Dict[str, Any]:
        """Extract text with Tesseract fallback"""
        if not TESSERACT_AVAILABLE:
            raise Exception("Tesseract not available")
        
        img = Image.open(image_path)
        data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
        
        lines = []
        full_text = []
        confidences = []
        current_line = []
        current_line_num = -1
        
        for i in range(len(data["text"])):
            text = data["text"][i].strip()
            conf = int(data["conf"][i])
            
            if not text or conf < 30:
                continue
            
            line_num = data["line_num"][i]
            
            if line_num != current_line_num:
                if current_line:
                    full_text.append(" ".join(current_line))
                    lines.append({
                        "text": " ".join(current_line),
                        "confidence": sum(confidences[-len(current_line):]) / len(current_line) / 100,
                    })
                current_line = []
                current_line_num = line_num
            
            current_line.append(text)
            confidences.append(conf)
        
        if current_line:
            full_text.append(" ".join(current_line))
            lines.append({
                "text": " ".join(current_line),
                "confidence": sum(confidences[-len(current_line):]) / len(current_line) / 100,
            })
        
        avg_conf = sum(confidences) / len(confidences) / 100 if confidences else 0
        
        return {
            "text": "\n".join(full_text),
            "lines": lines,
            "confidence": round(avg_conf, 4),
            "engine": "tesseract",
            "line_count": len(lines),
        }
    
    def extract_text(self, image_path: str, prefer_paddle: bool = True) -> Dict[str, Any]:
        """Extract text using best available OCR engine"""
        errors = []
        
        if prefer_paddle and PADDLE_AVAILABLE:
            try:
                return self.extract_with_paddle(image_path)
            except Exception as e:
                errors.append(f"PaddleOCR: {e}")
                print(f"PaddleOCR failed: {e}")
        
        if TESSERACT_AVAILABLE:
            try:
                return self.extract_with_tesseract(image_path)
            except Exception as e:
                errors.append(f"Tesseract: {e}")
                print(f"Tesseract failed: {e}")
        
        raise Exception(f"All OCR engines failed: {errors}")
    
    def clean_ocr_text(self, text: str) -> str:
        """Clean common OCR artifacts"""
        import re
        
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\n\s*\n', '\n\n', text)
        
        # Fix camelCase splitting
        text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)
        
        # Common OCR replacements
        text = text.replace('|', ' ')
        text = text.replace('~', '-')
        
        return text.strip()
    
    def extract_from_pages(self, image_paths: List[str]) -> Dict[str, Any]:
        """Extract text from multiple pages"""
        all_pages = []
        all_text = []
        
        for i, img_path in enumerate(image_paths, 1):
            try:
                result = self.extract_text(img_path)
                result["page_num"] = i
                result["image_path"] = img_path
                result["text"] = self.clean_ocr_text(result["text"])
                
                all_pages.append(result)
                all_text.append(f"--- Page {i} ---\n{result['text']}")
                
                print(f"OCR page {i}/{len(image_paths)}: {result['line_count']} lines, confidence: {result['confidence']}")
            except Exception as e:
                print(f"OCR failed for page {i}: {e}")
                all_pages.append({
                    "page_num": i,
                    "text": "",
                    "lines": [],
                    "confidence": 0.0,
                    "error": str(e),
                })
        
        return {
            "pages": all_pages,
            "full_text": "\n\n".join(all_text),
            "total_pages": len(image_paths),
            "total_lines": sum(p.get("line_count", 0) for p in all_pages),
            "avg_confidence": round(
                sum(p.get("confidence", 0) for p in all_pages) / len(all_pages), 4
            ) if all_pages else 0,
        }


ocr_service = OCRService()