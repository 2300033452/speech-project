require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { exec, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

const CLIENT_DIR = path.join(__dirname, "../client");
const UPLOAD_DIR = path.join(__dirname, "uploads");
const AUDIO_DIR = path.join(__dirname, "audio");

const TRANSCRIBE_PY = path.join(__dirname, "transcribe.py");
const TRANSLATE_PY = path.join(__dirname, "translate_text.py");
const TTS_PY = path.join(__dirname, "tts.py");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use(express.text({ type: ["application/sdp", "text/plain"] }));

app.use(express.static(CLIENT_DIR));
app.use("/audio", express.static(AUDIO_DIR));

const upload = multer({ dest: UPLOAD_DIR });

app.get("/", (req, res) => {
  const indexPath = path.join(CLIENT_DIR, "index.html");

  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  res.send("Server is working 🚀");
});

app.post("/upload-audio", upload.single("audio"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Audio file is required" });
  }

  res.json({
    message: "Audio uploaded successfully",
    filename: req.file.filename,
  });
});

app.post("/full-pipeline", (req, res) => {
  const { filename, targetLang } = req.body;

  if (!filename || !targetLang) {
    return res.status(400).json({ error: "filename and targetLang required" });
  }

  const inputPath = path.join(UPLOAD_DIR, filename);
  const wavPath = path.join(UPLOAD_DIR, `${filename}.wav`);

  setImmediate(() => {
    // Step 1: Convert uploaded audio to wav
    exec(`ffmpeg -y -i "${inputPath}" "${wavPath}"`, (ffmpegErr, ffmpegStdout, ffmpegStderr) => {
      if (ffmpegErr) {
        console.error("FFmpeg conversion error:", ffmpegStderr);
        return res.status(500).json({
          error: "Audio conversion failed",
          details: ffmpegStderr || ffmpegErr.message || "No stderr output",
        });
      }

      // Step 2: Transcribe wav file
      exec(`python "${TRANSCRIBE_PY}" "${wavPath}"`, (transcribeErr, transcribeStdout, transcribeStderr) => {
        if (transcribeErr) {
          console.error("Transcription error:", transcribeStderr);
          return res.status(500).json({
            error: "Transcription failed",
            details: transcribeStderr || transcribeErr.message || "No stderr output",
          });
        }

        let parsedTranscription;

        try {
          parsedTranscription = JSON.parse(transcribeStdout);
        } catch (err) {
          return res.status(500).json({
            error: "Failed to parse transcription output",
            details: transcribeStdout,
          });
        }

        const originalText = parsedTranscription.text;
        const detectedLanguage = parsedTranscription.language;

        if (!originalText) {
          return res.status(500).json({
            error: "Transcription returned empty text",
          });
        }

        // Convert Whisper code to readable label
        const langMap = {
          en: "English",
          te: "Telugu",
          hi: "Hindi",
          es: "Spanish",
        };

        const readableLang = langMap[detectedLanguage] || detectedLanguage || "Unknown";

        // Step 3: Write temp translation input
        const tempFile = path.join(__dirname, "pipeline_input.json");
        fs.writeFileSync(
          tempFile,
          JSON.stringify({ text: originalText, targetLang }),
          "utf-8"
        );

        // Step 4: Translate
        const translatePy = spawn("python", [TRANSLATE_PY, tempFile]);

        let translatedOutput = "";
        let translationError = "";

        translatePy.stdout.on("data", (data) => {
          translatedOutput += data.toString();
        });

        translatePy.stderr.on("data", (data) => {
          translationError += data.toString();
        });

        translatePy.on("close", (translateCode) => {
          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
          }

          if (translateCode !== 0) {
            console.error("Translation error:", translationError);
            return res.status(500).json({
              error: "Translation failed",
              details: translationError || "No stderr output",
            });
          }

          const translatedText = translatedOutput.trim();
          console.log("Translated text:", translatedText);

          if (!translatedText) {
            return res.status(500).json({
              error: "Translation returned empty text",
            });
          }

          // Step 5: Text-to-speech
          const ttsPy = spawn("python", [TTS_PY, translatedText, targetLang]);

          let audioOutput = "";
          let ttsError = "";

          ttsPy.stdout.on("data", (data) => {
            audioOutput += data.toString();
          });

          ttsPy.stderr.on("data", (data) => {
            ttsError += data.toString();
          });

          ttsPy.on("close", (ttsCode) => {
            if (ttsCode !== 0) {
              console.error("TTS error:", ttsError);
              return res.status(500).json({
                error: "TTS failed",
                details: ttsError || "No stderr output",
              });
            }

            res.json({
              detectedLanguage: readableLang,
              originalText,
              translatedText,
              audioFile: audioOutput.trim(),
            });
          });
        });
      });
    });
  });
});

app.post("/session", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).send("OPENAI_API_KEY is missing in .env");
    }

    if (!req.body || typeof req.body !== "string") {
      return res.status(400).send("SDP offer is required");
    }

    const sessionConfig = {
      type: "realtime",
      model: "gpt-realtime",
      instructions: `
You are a real-time speech translator.
Listen to the user's speech.
Identify the spoken language explicitly.
Translate the speech into the target language requested by the client.
Respond briefly in translated speech and translated text.
Keep latency low.
      `,
      audio: {
        input: {
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
          noise_reduction: {
            type: "near_field",
          },
        },
        output: {
          voice: "marin",
        },
      },
    };

    const fd = new FormData();
    fd.set("sdp", req.body);
    fd.set("session", JSON.stringify(sessionConfig));

    const response = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: fd,
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("Realtime API error:", responseText);
      return res.status(response.status).send(responseText);
    }

    res.set("Content-Type", "application/sdp");
    res.send(responseText);
  } catch (error) {
    console.error("Session creation error:", error);
    res.status(500).send("Failed to create realtime session");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});