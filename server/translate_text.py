import sys
import json
from deep_translator import GoogleTranslator

# Force UTF-8 stdout on Windows
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

if len(sys.argv) < 2:
    print("Missing input JSON file path", file=sys.stderr)
    sys.exit(1)

input_file = sys.argv[1]

with open(input_file, "r", encoding="utf-8") as f:
    data = json.load(f)

text = data.get("text", "").strip()
target_lang = data.get("targetLang", "").strip().lower()

if not text:
    print("No text to translate", file=sys.stderr)
    sys.exit(1)

lang_map = {
    "english": "en",
    "telugu": "te",
    "hindi": "hi",
    "spanish": "es"
}

target_code = lang_map.get(target_lang)

if not target_code:
    print(f"Unsupported target language: {target_lang}", file=sys.stderr)
    sys.exit(1)

translated = GoogleTranslator(source="auto", target=target_code).translate(text)

if not translated or not translated.strip():
    print("Translation returned empty text", file=sys.stderr)
    sys.exit(1)

print(translated.strip())