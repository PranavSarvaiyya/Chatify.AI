from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")

client = AsyncIOMotorClient(MONGODB_URL)
db = client.chatwithdata

# Collections
users_collection = db.users
chats_collection = db.chats

async def get_user(username: str):
    return await users_collection.find_one({"username": username})

async def create_user(user_data: dict):
    return await users_collection.insert_one(user_data)
