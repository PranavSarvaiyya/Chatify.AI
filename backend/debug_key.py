import os
import requests
from dotenv import load_dotenv
import google.generativeai as genai

# 1. Force Load .env
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
print(f"Reading .env from: {env_path}")
load_dotenv(env_path, override=True)

api_key = os.environ.get("GOOGLE_API_KEY")
print(f"Key Length: {len(api_key) if api_key else 0}")
print(f"Key Prefix: {api_key[:5] if api_key else 'None'}")
print(f"Key Suffix: {api_key[-4:] if api_key else 'None'}")

if not api_key:
    print("❌ NO KEY FOUND")
    exit(1)

# 2. Test via REST API (Bypassing SDK to be sure)
print("\n--- Testing via Raw HTTP ---")
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
data = {
    "contents": [{
        "parts": [{"text": "Hello, are you working?"}]
    }]
}
try:
    resp = requests.post(url, json=data)
    print(f"Status Code: {resp.status_code}")
    if resp.status_code == 200:
        print("✅ SUCCESS! Key is Valid.")
        print(resp.json())
    else:
        print("❌ FAILED! Key is Rejected.")
        print(resp.text)
except Exception as e:
    print(f"Network Check Failed: {e}")

# 3. Test SDK
print("\n--- Testing via SDK ---")
try:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.5-flash') # Checking the specific model we use
    response = model.generate_content("Hi")
    print(f"SDK Response: {response.text}")
except Exception as e:
    print(f"SDK Error: {e}")
