from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional, List
from datetime import timedelta, datetime
from bson import ObjectId

# Env helpers
import os

# Handle imports whether running directly or as module
try:
    from backend.rag_service import rag_service
    from backend.auth import (
        create_access_token, 
        get_current_user, 
        ACCESS_TOKEN_EXPIRE_MINUTES,
        get_password_hash,
        verify_password
    )
    from backend.database import get_user, create_user, chats_collection
except ImportError:
    from rag_service import rag_service
    from auth import (
        create_access_token, 
        get_current_user, 
        ACCESS_TOKEN_EXPIRE_MINUTES,
        get_password_hash,
        verify_password
    )
    from database import get_user, create_user, chats_collection

app = FastAPI()

# CORS origins from env (comma-separated). Default keeps current dev behavior.
_cors_origins_env = os.environ.get("CORS_ORIGINS", "*").strip()
if _cors_origins_env == "*" or _cors_origins_env == "":
    ALLOW_ORIGINS = ["*"]
else:
    ALLOW_ORIGINS = [o.strip().rstrip("/") for o in _cors_origins_env.split(",") if o.strip()]

# Input Models
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

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "ChatWithData API is running with MongoDB 🍃"}

# Render and some proxies may send HEAD / for health checks
@app.head("/")
def head_root():
    return Response(status_code=200)

# Browsers often request this; returning 204 avoids noisy 404s in DevTools
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
    existing_user = await get_user(form_data.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(form_data.password)
    user_data = {
        "username": form_data.username,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow()
    }
    await create_user(user_data)
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
        
        # Convert _id to str for JSON serialization
        chat['id'] = str(chat['_id'])
        del chat['_id']
        del chat['user_id'] # Don't expose user_id
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

# --- PROTECTED ROUTES ---
@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...), 
    current_user: dict = Depends(get_current_user)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    content = await file.read()
    
    # Deduplication: Check if chat already exists for this file
    existing_chat = await chats_collection.find_one({
        "user_id": current_user['_id'],
        "title": file.filename
    })

    if existing_chat:
        # If exists, switch to it without re-processing
        chat_id = str(existing_chat['_id'])
        return {
            "chat_id": chat_id,
            "message": "Opened existing chat for this file",
            "details": "Using cached version"
        }

    # Create new chat session if not exists
    new_chat = {
        "user_id": current_user['_id'],
        "title": file.filename,
        "created_at": datetime.utcnow(),
        "messages": [],
        "filename": file.filename
    }
    result = await chats_collection.insert_one(new_chat)
    chat_id = str(result.inserted_id)

    # Process file (RAG)
    rag_result = await rag_service.ingest_file(content, file.filename)
    
    return {
        "chat_id": chat_id,
        "message": "File processed and new chat created",
        "details": rag_result
    }

@app.post("/chat")
async def chat(
    request: QueryRequest, 
    current_user: dict = Depends(get_current_user)
):
    # Get answer from AI
    answer = rag_service.ask_question(request.query)
    ai_response = answer.get("answer", "Error")

    # Update Chat History if chat_id is provided
    if request.chat_id:
        await chats_collection.update_one(
            {"_id": ObjectId(request.chat_id)},
            {"$push": {"messages": {"$each": [
                {"role": "user", "text": request.query},
                {"role": "bot", "text": ai_response}
            ]}}}
        )
    
    return {"answer": ai_response}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
