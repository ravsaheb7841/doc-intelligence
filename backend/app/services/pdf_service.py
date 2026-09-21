import fitz
from PIL import Image
import os
import io
from pathlib import Path
from typing import List, Dict, Any
from app.utils.config import settings


class PDFService:
    @staticmethod
    def is_pdf(file_path: str) -> bool:
        return file_path.lower().endswith('.pdf')
    
    @staticmethod
    def is_image(file_path: str) -> bool:
        ext = Path(file_path).suffix.lower()
        return ext in {'.png', '.jpg', '.jpeg', '.tiff', '.bmp'}
    
    @staticmethod
    def pdf_to_images(pdf_path: str, output_dir: str, dpi: int = 300) -> List[str]:
        os.makedirs(output_dir, exist_ok=True)
        image_paths = []
        try:
            doc = fitz.open(pdf_path)
            base_name = Path(pdf_path).stem
            for page_num in range(len(doc)):
                page = doc[page_num]
                mat = fitz.Matrix(dpi / 72, dpi / 72)
                pix = page.get_pixmap(matrix=mat, alpha=False)
                img_path = os.path.join(output_dir, f"{base_name}_page_{page_num + 1}.png")
                pix.save(img_path)
                image_paths.append(img_path)
                print(f"Converted page {page_num + 1}/{len(doc)}")
            doc.close()
            return image_paths
        except Exception as e:
            raise Exception(f"PDF conversion failed: {str(e)}")
    
    @staticmethod
    def extract_text_from_pdf(pdf_path: str) -> Dict[str, Any]:
        try:
            doc = fitz.open(pdf_path)
            pages = []
            full_text = []
            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text()
                pages.append({"page_num": page_num + 1, "text": text, "word_count": len(text.split())})
                full_text.append(text)
            doc.close()
            total_words = sum(p["word_count"] for p in pages)
            return {
                "pages": pages,
                "full_text": "\n\n".join(full_text),
                "page_count": len(pages),
                "is_text_pdf": total_words > 50,
                "total_words": total_words
            }
        except Exception as e:
            raise Exception(f"Text extraction failed: {str(e)}")
    
    @staticmethod
    def process_file(file_path: str, document_id: str) -> Dict[str, Any]:
        output_dir = str(settings.PROCESSED_DIR / document_id)
        os.makedirs(output_dir, exist_ok=True)
        
        if PDFService.is_pdf(file_path):
            image_paths = PDFService.pdf_to_images(file_path, output_dir)
            text_data = None
            try:
                text_data = PDFService.extract_text_from_pdf(file_path)
            except Exception as e:
                print(f"Text extraction warning: {e}")
            return {
                "type": "pdf",
                "page_count": len(image_paths),
                "pages": image_paths,
                "extracted_text": text_data,
                "output_dir": output_dir
            }
        elif PDFService.is_image(file_path):
            import shutil
            dest = os.path.join(output_dir, Path(file_path).name)
            shutil.copy2(file_path, dest)
            return {
                "type": "image",
                "page_count": 1,
                "pages": [dest],
                "extracted_text": None,
                "output_dir": output_dir
            }
        else:
            raise Exception(f"Unsupported file type: {file_path}")


pdf_service = PDFService()