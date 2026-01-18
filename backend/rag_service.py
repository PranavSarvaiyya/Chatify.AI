import os
import time
from openai import OpenAI
from pypdf import PdfReader
from dotenv import load_dotenv

# Load env from parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'), override=True)

# OpenRouter Configuration (Primary - Unlimited Credits)
openrouter_api_key = os.environ.get("OPENROUTER_API_KEY")
openrouter_client = None

if not openrouter_api_key:
    print("❌ Error: OPENROUTER_API_KEY not found in .env")
else:
    openrouter_client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=openrouter_api_key,
    )
    print(f"✅ OpenRouter Configured (Key starts with: {openrouter_api_key[:10]}...)")

class RagService:
    def __init__(self):
        # Multiple Free OpenRouter Models (All Free - Auto Fallback)
        self.free_models = [
            "meta-llama/llama-3.3-70b-instruct:free",
            "google/gemma-3n-e4b-it:free",
            "mistralai/mistral-small-3.1-24b-instruct:free",
            "z-ai/glm-4.5-air:free",
            "meta-llama/llama-3.1-405b-instruct:free",
            "google/gemini-flash-1.5:free",
            "meta-llama/llama-3.1-8b-instruct:free",
            "deepseek/deepseek-r1-0528:free",
        ]
        self.model_index = 0  # Start with first model
        self.chunks = []

    def chunk_text(self, text, chunk_size=1000, overlap=100):
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunks.append(text[start:end])
            start += (chunk_size - overlap)
        return chunks

    def find_relevant_chunks(self, query, top_k=3):
        if not self.chunks:
            return []
        
        query_words = set(query.lower().split())
        scored_chunks = []

        for chunk in self.chunks:
            score = 0
            chunk_lower = chunk.lower()
            for word in query_words:
                if len(word) > 3 and word in chunk_lower:
                    score += 1
            scored_chunks.append((score, chunk))
        
        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        return [chunk for score, chunk in scored_chunks[:top_k]]

    async def ingest_file(self, file_content: bytes, filename: str):
        try:
            with open(filename, "wb") as f:
                f.write(file_content)
            
            reader = PdfReader(filename)
            text = ""
            for page in reader.pages:
                t = page.extract_text()
                if t: text += t + "\n"
            
            self.chunks = self.chunk_text(text)
            
            if os.path.exists(filename):
                os.remove(filename)
            
            msg = f"Processed {len(self.chunks)} chunks from {filename}."
            print(msg)
            return {"status": "success", "message": msg}
        except Exception as e:
            if os.path.exists(filename):
                os.remove(filename)
            return {"status": "error", "message": str(e)}

    def ask_question(self, query: str):
        if not self.chunks:
            return {"answer": "Please upload a document first."}
        
        if not openrouter_client:
            return {"answer": "API Key not configured. Please add OPENROUTER_API_KEY in .env file."}

        relevant_chunks = self.find_relevant_chunks(query)
        context = "\n...\n".join(relevant_chunks)
        if not context:
             context = "\n...\n".join(self.chunks[:3])

        system_prompt = """You are an intelligent analyst.
        - Answer naturally and professionally.
        - Format with Markdown.
        - Use the provided context to answer the question."""

        user_prompt = f"CONTEXT:\n{context}\n\nQUESTION: {query}"

        # Try all free models with automatic fallback
        max_model_attempts = len(self.free_models)
        for model_attempt in range(max_model_attempts):
            current_model = self.free_models[self.model_index]
            
            # Retry logic for each model
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    completion = openrouter_client.chat.completions.create(
                        extra_headers={
                            "HTTP-Referer": "http://localhost:3000",
                            "X-Title": "Chatify.AI",
                        },
                        model=current_model,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ]
                    )
                    
                    # Success! Reset to first model for next time
                    self.model_index = 0
                    print(f"✅ Response from {current_model}")
                    return {"answer": completion.choices[0].message.content}
                    
                except Exception as e:
                    error_str = str(e)
                    print(f"⚠️ Error (Model: {current_model}, Attempt: {attempt+1}): {e}")
                    
                    # Check if it's a 429 rate limit error
                    if "429" in error_str or "rate" in error_str.lower() or "rate-limited" in error_str.lower():
                        # If last retry for this model, try next model immediately
                        if attempt == max_retries - 1:
                            print(f"🔄 Model {current_model} rate-limited, switching to next model...")
                            # Move to next model
                            self.model_index = (self.model_index + 1) % len(self.free_models)
                            time.sleep(1)  # Short wait before trying next model
                            break  # Break retry loop, try next model
                        else:
                            # Wait before retrying same model
                            wait_time = min((2 ** attempt) + 1, 5)  # Max 5 seconds
                            print(f"⏳ Rate limited, waiting {wait_time} seconds before retry...")
                            time.sleep(wait_time)
                            continue
                    else:
                        # Other errors - retry with delay
                        if attempt < max_retries - 1:
                            time.sleep(2)
                            continue
                        # If last retry, try next model
                        if model_attempt < max_model_attempts - 1:
                            print(f"🔄 Model {current_model} failed, trying next model...")
                            self.model_index = (self.model_index + 1) % len(self.free_models)
                            time.sleep(1)
                            break
            
            # If we've tried all models, return helpful error
            if model_attempt == max_model_attempts - 1:
                return {"answer": "Sorry, all free models are currently rate-limited. Please wait 5-10 minutes and try again, or check your OpenRouter account limits."}
        
        return {"answer": "Error: Unable to generate response. Please try again."}

rag_service = RagService()
