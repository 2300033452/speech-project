const recordStartBtn = document.getElementById("recordStartBtn");
const recordStopBtn = document.getElementById("recordStopBtn");
const runPipelineBtn = document.getElementById("runPipelineBtn");

const statusEl = document.getElementById("status");
const detectedLanguageEl = document.getElementById("detectedLanguage");
const originalTextBox = document.getElementById("originalTextBox");
const translatedTextBox = document.getElementById("translatedTextBox");
const outputAudio = document.getElementById("outputAudio");
const targetLangEl = document.getElementById("targetLang");

let mediaRecorder = null;
let audioChunks = [];
let recordedBlob = null;
let uploadedFilename = null;
let currentStream = null;

function setStatus(msg) {
  statusEl.textContent = msg;
}

function resetOutput() {
  detectedLanguageEl.textContent = "-";
  originalTextBox.textContent = "";
  translatedTextBox.textContent = "";
  outputAudio.src = "";
  uploadedFilename = null;
}

function getAudioUrl(audioFile) {
  if (!audioFile) return "";

  if (audioFile.startsWith("http://") || audioFile.startsWith("https://")) {
    return audioFile;
  }

  if (audioFile.startsWith("audio/")) {
    return `http://localhost:5000/${audioFile}`;
  }

  return `http://localhost:5000/audio/${audioFile}`;
}

// -----------------------------
// Start Recording
// -----------------------------
recordStartBtn.onclick = async () => {
  try {
    setStatus("Requesting microphone...");

    currentStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        noiseSuppression: true,
        echoCancellation: true,
        autoGainControl: true,
      },
    });

    audioChunks = [];
    recordedBlob = null;
    resetOutput();

    let mimeType = "";
    if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
      mimeType = "audio/webm;codecs=opus";
    } else if (MediaRecorder.isTypeSupported("audio/webm")) {
      mimeType = "audio/webm";
    }

    mediaRecorder = mimeType
      ? new MediaRecorder(currentStream, { mimeType })
      : new MediaRecorder(currentStream);

    mediaRecorder.onstart = () => {
      console.log("Recorder started");
      setStatus("Recording...");
    };

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        audioChunks.push(e.data);
        console.log("Chunk received:", e.data.size, "bytes");
        setStatus("Recording... capturing audio");
      }
    };

    mediaRecorder.onerror = (e) => {
      console.error("Recorder error:", e);
      setStatus("Recorder error");
    };

    mediaRecorder.onstop = () => {
      console.log("Recorder stopped");

      recordedBlob = new Blob(audioChunks, {
        type: mimeType || "audio/webm",
      });

      console.log("Final blob size:", recordedBlob.size);

      if (recordedBlob.size > 0) {
        setStatus("Recording stopped. Ready to process.");
        runPipelineBtn.disabled = false;
      } else {
        setStatus("No valid audio captured.");
        runPipelineBtn.disabled = true;
      }

      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
        currentStream = null;
      }
    };

    mediaRecorder.start(2000);

    recordStartBtn.disabled = true;
    recordStopBtn.disabled = false;
    runPipelineBtn.disabled = true;
  } catch (err) {
    console.error(err);
    setStatus(`Mic error: ${err.message || "Unknown error"}`);
  }
};

// -----------------------------
// Stop Recording
// -----------------------------
recordStopBtn.onclick = () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }

  recordStartBtn.disabled = false;
  recordStopBtn.disabled = true;
};

// -----------------------------
// Upload + Full Pipeline
// -----------------------------
runPipelineBtn.onclick = async () => {
  try {
    if (!recordedBlob || recordedBlob.size === 0) {
      alert("No recording found");
      return;
    }

    setStatus("Uploading audio...");

    const formData = new FormData();
    formData.append("audio", recordedBlob, "recording.webm");

    const uploadRes = await fetch("http://localhost:5000/upload-audio", {
      method: "POST",
      body: formData,
    });

    const uploadText = await uploadRes.text();
    console.log("Upload raw response:", uploadText);

    if (!uploadRes.ok) {
      throw new Error(`Upload failed: ${uploadText}`);
    }

    const uploadData = JSON.parse(uploadText);
    uploadedFilename = uploadData.filename;

    setStatus("Transcribing audio...");

    const pipelineRes = await fetch("http://localhost:5000/full-pipeline", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: uploadedFilename,
        targetLang: targetLangEl.value,
      }),
    });

    const pipelineText = await pipelineRes.text();
    console.log("Pipeline raw response:", pipelineText);

    if (!pipelineRes.ok) {
      let parsedError = null;

      try {
        parsedError = JSON.parse(pipelineText);
      } catch {
        throw new Error(`Pipeline failed: ${pipelineText}`);
      }

      const errorMessage = parsedError.details
        ? `${parsedError.error}: ${parsedError.details}`
        : parsedError.error || pipelineText;

      throw new Error(errorMessage);
    }

    const result = JSON.parse(pipelineText);

    setStatus("Updating results...");

    detectedLanguageEl.textContent = result.detectedLanguage || "English";
    originalTextBox.textContent = result.originalText || "";
    translatedTextBox.textContent = result.translatedText || "";

    if (result.audioFile) {
      outputAudio.src = getAudioUrl(result.audioFile);
      outputAudio.load();
    }

    setStatus("Done ✅");
  } catch (err) {
    console.error(err);
    setStatus(err.message || "Error in pipeline");
  }
};