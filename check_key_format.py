import os
from dotenv import load_dotenv
load_dotenv('.env')
k = os.getenv('GOOGLE_API_KEY')
if k:
    print(f"Prefix: {k[:4]}")
    print(f"Length: {len(k)}")
else:
    print("No key found")
