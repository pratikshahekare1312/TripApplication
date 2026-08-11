import requests
from config import GROQ_API_KEY

url = "https://api.groq.com/openai/v1/chat/completions"
headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
data = {"model": "llama-3.3-70b-versatile", "messages": [{"role": "user", "content": "hi"}], "max_tokens": 5}

response = requests.post(url, headers=headers, json=data)

if response.status_code == 200:
    print("✓ Ready hai, TPD reset ho gaya — enrich.py chala sakta hai")
else:
    print("✗ Abhi nahi —", response.json()["error"]["message"])