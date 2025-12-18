from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")

# Keep a short server selection timeout so connection issues fail fast (useful on Render)
client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
db = client.chatwithdata

# Collections
users_collection = db.users
chats_collection = db.chats

async def ping_db() -> bool:
    """
    Verify MongoDB connectivity. Returns True/False and logs failures.
    """
    try:
        await db.command("ping")
        return True
    except Exception as e:
        # Do not print credentials; just log high-level error
        print(f"❌ MongoDB ping failed: {type(e).__name__}: {e}")
        return False

async def get_user(username: str):
    return await users_collection.find_one({"username": username})

async def create_user(user_data: dict):
    return await users_collection.insert_one(user_data)
