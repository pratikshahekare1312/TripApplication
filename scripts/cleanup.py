import pandas as pd
from config import CSV_OUTPUT

df = pd.read_csv(CSV_OUTPUT)
print(f"Cleanup se pehle: {len(df)} rows")

# Khali 'vibe' wali rows ko pehle hatao (agar dono same naam ke hai)
df = df.sort_values("vibe", na_position="first")
df = df.drop_duplicates(subset="name", keep="last")

df.to_csv(CSV_OUTPUT, index=False)
print(f"Cleanup ke baad: {len(df)} rows")