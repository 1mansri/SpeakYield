import os

SARVAM_API_KEY = os.environ.get("SARVAM_API_KEY", "")
SARVAM_STT_URL = os.environ.get("SARVAM_STT_URL", "https://api.sarvam.ai/speech-to-text")
SARVAM_CHAT_URL = os.environ.get("SARVAM_CHAT_URL", "https://api.sarvam.ai/v1/chat/completions")
SARVAM_TTS_URL = os.environ.get("SARVAM_TTS_URL", "https://api.sarvam.ai/text-to-speech")
SARVAM_CHAT_MODEL = os.environ.get("SARVAM_CHAT_MODEL", "sarvam-30b")
SARVAM_TTS_MODEL = os.environ.get("SARVAM_TTS_MODEL", "bulbul:v3")

# Comma-separated list of allowed browser origins for CORS. Defaults to the local dev
# frontend; in prod (e.g. Dokploy) set CORS_ALLOW_ORIGINS to the frontend's public URL,
# e.g. "https://speakyield.example.com".
CORS_ALLOW_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("CORS_ALLOW_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]
