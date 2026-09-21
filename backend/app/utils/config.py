import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

class Settings:
    MONGO_URL: str = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "doc_intelligence")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-this-secret")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    UPLOAD_DIR: Path = BASE_DIR / os.getenv("UPLOAD_DIR", "uploads")
    PROCESSED_DIR: Path = BASE_DIR / os.getenv("PROCESSED_DIR", "processed")
    VECTORDB_DIR: Path = BASE_DIR / os.getenv("VECTORDB_DIR", "vectordb")
    
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", "52428800"))
    ALLOWED_EXTENSIONS: set = {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".bmp"}
    
    ALLOWED_ORIGINS: list = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:5173"
    ).split(",")

settings = Settings()

for dir_path in [settings.UPLOAD_DIR, settings.PROCESSED_DIR, settings.VECTORDB_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)