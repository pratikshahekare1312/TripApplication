from openai import OpenAI
from config import OPENAI_API_KEY

client = OpenAI(api_key=OPENAI_API_KEY)
r = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "say hello"}]
)
print(r.choices[0].message.content)