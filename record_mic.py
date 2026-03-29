import sounddevice as sd
from scipy.io.wavfile import write

sample_rate = 16000
duration = 5  # seconds

print("Recording will start now...")
audio = sd.rec(int(duration * sample_rate), samplerate=sample_rate, channels=1, dtype="int16")
sd.wait()

write("recorded_audio.wav", sample_rate, audio)
print("Recording saved as recorded_audio.wav")