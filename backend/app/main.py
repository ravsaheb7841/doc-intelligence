from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.utils.warnings_config import suppress_warnings
from app.utils.config import settings
import logging

# Suppress ChromaDB telemetry errors
logging.getLogger("chromadb.telemetry").setLevel(logging.CRITICAL)
logging.getLogger("chromadb.telemetry.product.posthog").setLevel(logging.CRITICAL)

suppress_warnings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.utils.database import connect_db, close_db
    await connect_db()
    print("Application started")
    yield
    await close_db()
    print("Application stopped")

app = FastAPI(
    title="Document Intelligence API",
    description="AI-powered document extraction and analysis",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import auth, documents, extraction, chat
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(extraction.router, prefix="/api/documents", tags=["Extraction"])
app.include_router(chat.router, prefix="/api/documents", tags=["Chat"])

@app.get("/")
async def root():
    return {"message": "Document Intelligence API", "version": "1.0.0", "status": "running"}

@app.get("/health")
async def health():
    from app.utils.database import get_db
    try:
        db = await get_db()
        await db.command("ping")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "degraded", "database": "disconnected"}