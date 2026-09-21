from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "doc_intelligence")

client = None
db = None

async def connect_db():
    global client, db
    print(f"[DB] Connecting to MongoDB...")
    print(f"[DB] URL: {MONGO_URL[:30]}...")
    
    try:
        client = AsyncIOMotorClient(
            MONGO_URL,
            serverSelectionTimeoutMS=5000,  # 5 sec timeout (fail fast)
            connectTimeoutMS=5000,
        )
        db = client[MONGO_DB_NAME]
        
        # Test connection
        await db.command("ping")
        print(f"[DB] Connected successfully to {MONGO_DB_NAME}")
        
        # Create indexes
        await db.users.create_index("email", unique=True)
        await db.documents.create_index([("user_id", 1), ("created_at", -1)])
        await db.chat_history.create_index([("document_id", 1), ("created_at", -1)])
        return db
    except Exception as e:
        print(f"[DB] Connection failed: {e}")
        print(f"[DB] Continuing without database")
        db = None
        return None

async def close_db():
    global client
    if client:
        client.close()
        print("[DB] Connection closed")

async def get_db():
    return db