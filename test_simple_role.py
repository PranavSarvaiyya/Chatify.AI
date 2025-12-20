import os
from bytez import Bytez
from dotenv import load_dotenv

load_dotenv('.env')
api_key = os.environ.get("GOOGLE_API_KEY")
sdk = Bytez(api_key)

model_name = "google/gemini-2.5-flash"

print(f"Testing model: {model_name} with ONLY user role")
try:
    model = sdk.model(model_name)
    response = model.run([
        {"role": "user", "content": "Hello, are you there?"}
    ])
    if response.error:
        print(f"Error: {response.error}")
    else:
        print(f"Success! Output: {response.output}")
except Exception as e:
    print(f"Exception: {e}")
