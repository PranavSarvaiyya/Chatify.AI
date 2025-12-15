import requests

api_key = "4e0a94f273ca40e182810d1312e5a677"
base_url = "https://api.aimlapi.com/v1"

print(f"Testing Key: {api_key} against {base_url}")

# 1. List Models (to check validity and available models)
try:
    response = requests.get(
        f"{base_url}/models",
        headers={"Authorization": f"Bearer {api_key}"}
    )
    
    if response.status_code == 200:
        print("✅ API Key is Valid for AI/ML API!")
        models = response.json().get('data', [])
        print(f"Found {len(models)} models.")
        
        # Check for Gemini related models
        gemini_models = [m['id'] for m in models if 'gemini' in m['id'].lower()]
        print("\nAvailable Gemini Models:")
        for m in gemini_models:
            print(f"MODEL: {m}")
            
    else:
        print(f"❌ API Key Test Failed. Status: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"Network Error: {e}")
