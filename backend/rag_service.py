import os
import time
from bytez import Bytez
from pypdf import PdfReader
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'), override=True)

api_key = os.environ.get("GOOGLE_API_KEY") # Bytez API Key
if not api_key:
    print("❌ Error: API Key not found")
else:
    print(f"✅ Loaded key: {api_key[:5]}...")

# Bytez SDK Configuration
sdk = Bytez(api_key)

class RagService:
    def __init__(self):
        # Bytez Model - using Gemini 1.5 Pro
        self.model_name = "google/gemini-1.5-pro-latest" 
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

        relevant_chunks = self.find_relevant_chunks(query)
        context = "\n...\n".join(relevant_chunks)
        if not context:
             context = "\n...\n".join(self.chunks[:3])

        system_prompt = """You are an intelligent analyst.
        - Answer naturally and professionally.
        - Format with Markdown.
        - Use the provided context to answer the question."""

        user_prompt = f"CONTEXT:\n{context}\n\nQUESTION: {query}"

        max_retries = 3
        for attempt in range(max_retries):
            try:
                model = sdk.model(self.model_name)
                response = model.run([
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ])
                
                output = response.output
                error = response.error
                
                if error:
                    raise Exception(f"Bytez API Error: {error}")
                
                return {"answer": output}
            except Exception as e:
                print(f"AI Service Error: {e}")
                if attempt < max_retries - 1:
                    time.sleep(2)
                    continue
                return {"answer": f"Error generating response: {str(e)}"}

rag_service = RagService()
