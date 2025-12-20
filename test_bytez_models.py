import os
from bytez import Bytez
from dotenv import load_dotenv

load_dotenv('.env')
api_key = os.environ.get("GOOGLE_API_KEY")
sdk = Bytez(api_key)

models_to_try = [
    "google/gemini-1.5-flash",
    "google/gemini-2.5-flash",
    "google/gemini-1.5-pro",
    "google/gemini-2.5-pro",
    "gemini-1.5-flash",
    "gemini-1.5-pro"
]

for model_name in models_to_try:
    print(f"Trying model: {model_name}")
    try:
        model = sdk.model(model_name)
        response = model.run([
            {"role": "user", "content": "hi"}
        ])
        if response.error:
            print(f"  Result: Error - {response.error[:100]}...")
        else:
            print(f"  Result: Success! Output: {response.output}")
            break
    except Exception as e:
        print(f"  Result: Exception - {e}")
