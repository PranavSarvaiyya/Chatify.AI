import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

models_to_test = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro',
    'gemini-1.0-pro',
    'gemini-pro',
    'models/gemini-1.5-flash',
    'models/gemini-1.5-flash-001',
    'models/gemini-1.5-flash-002'
]

log_content = "TEST RESULTS:\n"

for model_name in models_to_test:
    log_content += f"\n--- Testing {model_name} ---\n"
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Hello")
        log_content += "SUCCESS!\n"
        log_content += f"Response: {response.text}\n"
    except Exception as e:
        log_content += f"FAILED: {str(e)}\n"

with open("backend/model_test_results.txt", "w") as f:
    f.write(log_content)

print("Test complete. Results saved.")
