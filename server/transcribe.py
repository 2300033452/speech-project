import whisper
import sys
import json

# Load model
model = whisper.load_model("base")

audio_path = sys.argv[1]

# Transcribe
result = model.transcribe(audio_path)

text = result["text"].strip()
language = result.get("language", "unknown")

# Return both text + language as JSON
output = {
    "text": text,
    "language": language
}

print(json.dumps(output))