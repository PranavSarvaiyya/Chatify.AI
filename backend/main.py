from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional, List
from datetime import timedelta, datetime
from bson import ObjectId
import os

try:
    from backend.rag_service import RagService
    from backend.auth import (
        create_access_token,
        get_current_user,
        ACCESS_TOKEN_EXPIRE_MINUTES,
        get_password_hash,
        verify_password
    )
    from backend.database import get_user, create_user, chats_collection, ping_db
except ImportError:
    from rag_service import RagService
    from auth import (
        create_access_token,
        get_current_user,
        ACCESS_TOKEN_EXPIRE_MINUTES,
        get_password_hash,
        verify_password
    )
    from database import get_user, create_user, chats_collection, ping_db

app = FastAPI()

# Global RAG Instance
rag = RagService()

# CORS origins from env (comma-separated). Default keeps current dev behavior.
_cors_origins_env = os.environ.get("CORS_ORIGINS", "*").strip()
if _cors_origins_env == "*" or _cors_origins_env == "":
    ALLOW_ORIGINS = ["*"]
else:
    ALLOW_ORIGINS = [o.strip().rstrip("/") for o in _cors_origins_env.split(",") if o.strip()]

# Input / Output Models
class QueryRequest(BaseModel):
    query: str
    chat_id: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class ChatHistoryItem(BaseModel):
    id: str
    title: str
    created_at: str

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def _startup_checks():
    ok = await ping_db()
    print("✅ MongoDB connected" if ok else "❌ MongoDB NOT connected (check Render env MONGODB_URL / Atlas user / IP allowlist)")

@app.get("/")
def read_root():
    return {"message": "ChatWithData API is running with MongoDB 🍃"}

@app.head("/")
def head_root():
    return Response(status_code=200)

@app.get("/favicon.ico")
def favicon():
    return Response(status_code=204)

# --- AUTH ROUTES ---
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await get_user(form_data.username)
    if not user or not verify_password(form_data.password, user['hashed_password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user['username']}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/signup")
async def signup(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        existing_user = await get_user(form_data.username)
    except Exception as e:
        print(f"❌ DB error on get_user during signup: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="Database connection error")
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(form_data.password)
    user_data = {
        "username": form_data.username,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow()
    }
    try:
        await create_user(user_data)
    except Exception as e:
        print(f"❌ DB error on create_user during signup: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="Database write error")
    return {"message": f"User {form_data.username} created successfully"}

# --- HISTORY ROUTES ---
@app.get("/history", response_model=List[ChatHistoryItem])
async def get_chat_history(current_user: dict = Depends(get_current_user)):
    user_id = current_user['_id']
    cursor = chats_collection.find({"user_id": user_id}).sort("created_at", -1)
    chats = await cursor.to_list(length=20)
    
    return [
        ChatHistoryItem(
            id=str(chat['_id']), 
            title=chat.get('title', 'Untitled Chat'),
            created_at=chat['created_at'].isoformat()
        ) 
        for chat in chats
    ]

@app.get("/history/{chat_id}")
async def get_chat_messages(chat_id: str, current_user: dict = Depends(get_current_user)):
    print(f"Fetching chat {chat_id} for user {current_user['username']}")
    try:
        chat = await chats_collection.find_one({"_id": ObjectId(chat_id), "user_id": current_user['_id']})
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        chat['id'] = str(chat['_id'])
        del chat['_id']
        del chat['user_id']
        return chat
    except Exception as e:
        print(f"Error fetching chat: {e}")
        raise HTTPException(status_code=400, detail="Invalid Chat ID")

@app.delete("/history/{chat_id}")
async def delete_chat(chat_id: str, current_user: dict = Depends(get_current_user)):
    try:
        result = await chats_collection.delete_one({"_id": ObjectId(chat_id), "user_id": current_user['_id']})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Chat not found")
        return {"message": "Chat deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid Chat ID")

class URLRequest(BaseModel):
    url: str

# --- PROTECTED RAG ROUTES ---
@app.post("/upload-url")
async def upload_url(
    request: URLRequest,
    current_user: dict = Depends(get_current_user)
):
    url = request.url.strip()
    if not url.startswith("http://") and not url.startswith("https://"):
        raise HTTPException(status_code=400, detail="Invalid URL. Must start with http:// or https://")

    # Deduplication check
    existing_chat = await chats_collection.find_one({
        "user_id": current_user['_id'],
        "title": url
    })

    if existing_chat:
        return {
            "chat_id": str(existing_chat['_id']),
            "message": "Opened existing chat for this URL",
            "details": "Using cached version"
        }

    try:
        rag.add_document(url, "url")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing Web URL: {str(e)}")

    new_chat = {
        "user_id": current_user['_id'],
        "title": url,
        "created_at": datetime.utcnow(),
        "messages": [],
        "filename": url
    }
    result = await chats_collection.insert_one(new_chat)
    chat_id = str(result.inserted_id)

    try:
        rag.add_document(url, "url", doc_id=chat_id)
    except Exception as e:
        await chats_collection.delete_one({"_id": result.inserted_id})
        raise HTTPException(status_code=500, detail=f"Error processing Web URL: {str(e)}")

    return {
        "chat_id": chat_id,
        "message": f"Web page '{url}' successfully processed!"
    }

@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...), 
    current_user: dict = Depends(get_current_user)
):
    file_ext = file.filename.split(".")[-1].lower()

    # Deduplication check in MongoDB
    existing_chat = await chats_collection.find_one({
        "user_id": current_user['_id'],
        "title": file.filename
    })

    if existing_chat:
        return {
            "chat_id": str(existing_chat['_id']),
            "message": "Opened existing chat for this file",
            "details": "Using cached version"
        }

    # Save new chat session in MongoDB to obtain chat_id
    new_chat = {
        "user_id": current_user['_id'],
        "title": file.filename,
        "created_at": datetime.utcnow(),
        "messages": [],
        "filename": file.filename
    }
    result = await chats_collection.insert_one(new_chat)
    chat_id = str(result.inserted_id)

    # Temporary file save for RAG Document Loader
    temp_path = f"./temp_{file.filename}"
    with open(temp_path, "wb") as f:
        f.write(await file.read())
    
    try:
        rag.add_document(temp_path, file_ext, doc_id=chat_id)
    except ValueError as e:
        await chats_collection.delete_one({"_id": result.inserted_id})
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        await chats_collection.delete_one({"_id": result.inserted_id})
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    return {
        "chat_id": chat_id,
        "message": f"Document '{file.filename}' successfully uploaded and processed!"
    }

@app.post("/chat")
async def chat(
    request: QueryRequest, 
    current_user: dict = Depends(get_current_user)
):
    if not request.query or not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    # Query AI using RAGService instance with document filtering
    try:
        response = rag.query(request.query, doc_id=request.chat_id)
        ai_response = response.get("Answer", "Sorry, I couldn't generate an answer.")
    except Exception as e:
        print(f"❌ RAG Query Error: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"AI Model Error: {str(e)}")

    # Save to MongoDB history if valid chat_id provided
    if request.chat_id and request.chat_id.strip():
        try:
            await chats_collection.update_one(
                {"_id": ObjectId(request.chat_id), "user_id": current_user['_id']},
                {"$push": {"messages": {"$each": [
                    {"role": "user", "text": request.query},
                    {"role": "bot", "text": ai_response}
                ]}}}
            )
        except Exception as e:
            print(f"⚠️ Could not update chat history: {e}")

    return {"answer": ai_response}

import uvicorn
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.main("main:app", host="0.0.0.0", port=port)
