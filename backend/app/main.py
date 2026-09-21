from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.utils.warnings_config import suppress_warnings
from app.utils.config import settings
import logging
import os
import uvicorn

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)

# Suppress ChromaDB telemetry errors
logging.getLogger("chromadb.telemetry").setLevel(logging.CRITICAL)
logging.getLogger("chromadb.telemetry.product.posthog").setLevel(logging.CRITICAL)

suppress_warnings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Print port info for debugging
    port = os.getenv("PORT", "8000")
    print(f"[STARTUP] Application starting on port {port}")
    print(f"[STARTUP] Python version: {__import__('sys').version}")
    
    # Connect to MongoDB (non-blocking)
    try:
        from app.utils.database import connect_db, close_db
        await connect_db()
        print("[STARTUP] MongoDB connected")
    except Exception as e:
        print(f"[STARTUP] MongoDB connection failed: {e}")
        print("[STARTUP] App will continue without MongoDB")
    
    print("[STARTUP] Application started successfully")
    yield
    print("[STARTUP] Shutting down...")
    try:
        from app.utils.database import close_db
        await close_db()
    except Exception:
        pass

app = FastAPI(
    title="Document Intelligence API",
    description="AI-powered document extraction and analysis",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
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
        if db is None:
            return {"status": "degraded", "database": "not_initialized"}
        await db.command("ping")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "degraded", "database": "disconnected", "error": str(e)[:100]}