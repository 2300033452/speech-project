Real-Time Speech-to-Speech Translation System

 Project Overview

This project is a multilingual speech-to-speech translation system that takes microphone input from a user, 
converts speech into text, translates the text into a selected target language, and then generates translated speech output.

The system is designed as a full-stack modular pipeline combining frontend audio capture, backend orchestration, 
and AI-based language processing components. While the current version operates in a near real-time batch mode 
(record → process → output), it successfully demonstrates the complete speech processing pipeline and 
serves as a strong foundation for future real-time streaming systems.



## What This Project Does

The system performs the following steps:

1. Captures speech input from the microphone
2. Converts audio format for processing
3. Transcribes speech into text
4. Automatically detects the spoken language
5. Translates text into a selected target language
6. Generates translated speech output
7. Plays the translated audio back to the user


## Technologies Used and Why They Were Chosen

1. Frontend (HTML, CSS, JavaScript)

How it is used:
- Handles UI for recording and displaying results
- Captures microphone input using browser APIs
- Sends audio data to backend
- Displays transcription, translation, and audio output

Why chosen:
- Lightweight and easy to implement
- No need for heavy frontend frameworks for this prototype
- Direct access to browser APIs like MediaRecorder



2. MediaRecorder API

How it is used:
- Records microphone audio in chunks
- Stores audio as a Blob
- Sends audio to backend

Why chosen:
- Native browser support
- No external dependency required
- Easy integration with real-time audio capture



3. Node.js + Express.js

How it is used:
- Backend server for handling API requests
- Coordinates entire pipeline (upload → convert → transcribe → translate → TTS)
- Communicates with Python scripts

 Why chosen:
- Efficient for handling asynchronous operations
- Easy integration with frontend via REST APIs
- Good for orchestrating multiple processing stages



4. Multer

How it is used:
- Handles audio file uploads from frontend
- Stores recorded audio in backend `uploads` folder

Why chosen:
- Standard middleware for file handling in Node.js
- Simple and reliable



5. FFmpeg

How it is used:
- Converts recorded `.webm` audio into `.wav` format before transcription

Why chosen:
- Browser records audio in formats not always compatible with ML models
- Whisper works better with `.wav`
- FFmpeg is industry-standard for audio processing



 6. Whisper (Speech Recognition + Language Detection)

How it is used:
- Transcribes speech into text
- Detects spoken language automatically

Why chosen:
- High accuracy for multilingual speech recognition
- Supports language identification directly
- More robust than traditional speech APIs



7. deep_translator (GoogleTranslator)

How it is used:
- Translates transcribed text into selected target language

Why chosen:
- Supports multiple languages
- Simple API integration
- Works well for prototype-level translation tasks



8. gTTS (Text-to-Speech)

 How it is used:
- Converts translated text into speech audio
- Saves audio file and sends it to frontend

Why chosen:
- Easy to integrate
- Supports multiple languages
- Fast generation for demo-level systems



9. Python Scripts

How they are used:
- `transcribe.py` → speech recognition + language detection
- `translate_text.py` → translation
- `tts.py` → speech synthesis

Why chosen:
- Python has strong ecosystem for ML and language processing
- Easier integration with Whisper and NLP tools
- Clean separation of logic from Node backend


System Architecture

 Frontend
- Captures microphone input
- Sends audio to backend
- Displays results

Backend (Node.js)
- Receives audio
- Converts format
- Calls Python scripts
- Returns final result

Processing Layer (Python)
- Speech recognition
- Language detection
- Translation
- Text-to-speech



Completed Features

The following features are fully implemented:

Audio & Input
Speech Processing
Language Processing
Speech Output
- Text-to-Speech generation
- Audio playback in browser
System Features
- End-to-end pipeline (record → process → output)
- Modular architecture
- Basic error handling
- Logging for debugging


## Partially Implemented Features

- Near real-time chunk-based recording (not full streaming)
- Low-latency feel through UI improvements
- Realtime backend route (WebRTC) exists but limited by API quota



## Not Yet Implemented

The following features are not fully implemented yet:

Audio & Streaming
- Continuous real-time audio streaming
- Low-latency buffering (20–40 ms chunks)

Speech Detection
- Voice Activity Detection (VAD)
- Silence filtering
- Real-time segmentation

Speech Recognition
- Real-time ASR (live transcription while speaking)
- Timestamp alignment
- Sentence segmentation

Language Processing
- Confidence scoring
- Code-switching detection

Output
- Streaming audio playback
- Real-time translation output

System Level
- Fully real-time end-to-end processing
- Scalable deployment
- Monitoring dashboards



## Challenges Faced

 1. Audio Format Issues
Browser recorded audio was incompatible with transcription → solved using FFmpeg.

2. Language Mapping Errors
Translation libraries required lowercase codes → solved using mapping dictionaries.

 3. Unicode Errors (Windows)
Translation output caused encoding crashes → solved using UTF-8 configuration.

 4. Python File Path Issues
Backend could not locate scripts → solved using proper folder structure.

 5. Realtime Limitations
WebRTC-based realtime pipeline attempted but limited by API quota.



 Why This Project is Important

This project demonstrates how multiple AI and system components can be integrated into a single working pipeline. 
It showcases:

- speech processing systems
- multilingual AI workflows
- backend orchestration
- frontend-backend integration
- real-world problem solving in AI systems


## Future Work

The next improvements planned are:

- True real-time streaming pipeline
- WebSocket-based audio transmission
- Voice Activity Detection (VAD)
- Live transcript updates
- Low-latency optimization
- Advanced neural TTS voices
- Cloud deployment
inal Note

### How to Run the Project (Step-by-Step)
 
must have
Before running, install:
1. Node.js
   
2. https://nodejs.org/
Check:
node -v

3. Python (3.10+ recommended)
Check:
python --version

4. FFmpeg (VERY IMPORTANT)
Download:
 https://www.gyan.dev/ffmpeg/builds/
Add to PATH, then check:
ffmpeg -version
 Step 1 — Install Backend Dependencies

Go to server folder:
cd server

Install Node packages:
npm install
Step 2 — Install Python Libraries

Run:
pip install openai-whisper deep-translator gtts

Step 3 — Setup .env

Inside server/ create file:
.env
Add:
OPENAI_API_KEY=your_new_api_key_here
PORT=5000

IMPORTANT:
use new API key (old one was exposed)
never push .env to GitHub

Step 4 — Start Backend Server
node server.js

You should see:
Server running on http://localhost:5000

Step 5 — Open Frontend
Open browser:
http://localhost:5000

Step 6 — Use the App
Select target language
Click Start Recording
Speak
Click Stop Recording
Click Run Pipeline

Output you will see
Detected Language 
Original Text 
Translated Text 
Audio Output 

How the System Runs (Internally)

When you click Run Pipeline, this happens:
Audio → uploaded to backend
FFmpeg → converts .webm → .wav
Whisper → speech → text + language
Translator → text → target language
gTTS → text → audio
Backend → sends result to frontend

This project successfully implements a speech-to-speech translation pipeline with automatic language detection, 
transcription, translation, and speech synthesis. While it is currently near real-time, 
it provides a strong foundation for building a fully real-time multilingual speech translation system.
