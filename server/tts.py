import sys
import os
from gtts import gTTS

if len(sys.argv) < 3:
    print("Usage: python tts.py <text> <lang>", file=sys.stderr)
    sys.exit(1)

text = sys.argv[1].strip()
lang = sys.argv[2].strip().lower()

if not text:
    print("No text to speak", file=sys.stderr)
    sys.exit(1)

lang_map = {
    "english": "en",
    "telugu": "te",
    "hindi": "hi",
    "spanish": "es"
}

lang_code = lang_map.get(lang)

if not lang_code:
    print(f"Unsupported TTS language: {lang}", file=sys.stderr)
    sys.exit(1)

output_dir = os.path.join(os.path.dirname(__file__), "audio")
os.makedirs(output_dir, exist_ok=True)

output_file = os.path.join(output_dir, "output.mp3")

tts = gTTS(text=text, lang=lang_code)
tts.save(output_file)

print("audio/output.mp3")