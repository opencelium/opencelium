import pandas as pd
import json
from pathlib import Path

BASE_DIR = Path(__file__).parent

EXCEL_FILE = BASE_DIR / "compatibility.xlsx"
OUTPUT_FILE = (
    BASE_DIR.parent.parent / "_static" / "data" / "compatibility.json"
)

df = pd.read_excel(EXCEL_FILE)

records = []

for _, row in df.iterrows():
    records.append({
        "source": str(row.get("Source", "")),
        "target": str(row.get("Target", "")),
        "status": str(row.get("Status", "")),
        "database": str(row.get("Database", "")),
        "php": str(row.get("PHP", "")),
        "docker": str(row.get("Docker", "")),
        "os": str(row.get("OS", "")),
        "notes": str(row.get("Notes", "")),
    })

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(records, f, indent=2)

print("compatibility.json generated")
