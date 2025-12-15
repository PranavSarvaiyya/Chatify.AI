import requests
import time

def test_api():
    base_url = "http://127.0.0.1:8000"
    print(f"Testing connectivity to {base_url}...")
    
    try:
        # 1. Test Root
        resp = requests.get(f"{base_url}/")
        print(f"GET / status: {resp.status_code}")
        print(f"GET / response: {resp.json()}")
        
        # 2. Test Signup (to trigger DB and Auth)
        # Random user to avoid "Already registered"
        import random
        username = f"testuser_{random.randint(1000, 9999)}"
        password = "testpassword"
        
        print(f"Testing /signup with {username}...")
        resp = requests.post(f"{base_url}/signup", data={"username": username, "password": password})
        print(f"POST /signup status: {resp.status_code}")
        print(f"POST /signup response: {resp.text}")
        
    except Exception as e:
        print(f"❌ Connection Failed: {e}")

if __name__ == "__main__":
    test_api()
