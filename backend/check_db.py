import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Try loading from possible locations
load_dotenv()
load_dotenv("../.env")

async def check_db():
    url = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
    print(f"Testing connection to: {url}")
    
    try:
        client = AsyncIOMotorClient(url, serverSelectionTimeoutMS=2000)
        # Trigger a connection
        info = await client.server_info()
        print("✅ MongoDB Connection Successful!")
        print(f"Server version: {info.get('version')}")
        
    except Exception as e:
        print("❌ MongoDB Connection Failed")
        print(f"Error: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure MongoDB Community Server is installed and running.")
        print("2. If using Atlas, check your MONGODB_URL in .env")

if __name__ == "__main__":
    asyncio.run(check_db())
