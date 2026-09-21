from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "doc_intelligence")

client = None
db = None

async def connect_db():
    global client, db
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[MONGO_DB_NAME]
    await db.users.create_index("email", unique=True)
    await db.documents.create_index([("user_id", 1), ("created_at", -1)])
    await db.chat_history.create_index([("document_id", 1), ("created_at", -1)])
    print(f"Connected to MongoDB: {MONGO_DB_NAME}")
    return db

async def close_db():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")

async def get_db():
    return db