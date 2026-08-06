import os
from pathlib import Path

from dotenv import load_dotenv

# Load the backend's .env before any setting is read.
#
# Doing it here rather than relying on the launcher means the app is configured the same
# way however it was started — `uv run uvicorn`, a bare `python -m uvicorn`, pytest, or
# Docker. Previously the key only arrived if you remembered `--env-file .env`, and
# starting the server without it produced a confusing "SARVAM_API_KEY not configured"
# 500 from the voice routes that looked like a network fault to the farmer.
#
# `load_dotenv` does not overwrite variables already in the environment, so a real
# deployment's injected config still wins over anything sitting in a local file.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

SARVAM_API_KEY = os.environ.get("SARVAM_API_KEY", "")
SARVAM_STT_URL = os.environ.get("SARVAM_STT_URL", "https://api.sarvam.ai/speech-to-text")
SARVAM_CHAT_URL = os.environ.get("SARVAM_CHAT_URL", "https://api.sarvam.ai/v1/chat/completions")
SARVAM_TTS_URL = os.environ.get("SARVAM_TTS_URL", "https://api.sarvam.ai/text-to-speech")
# sarvam-30b was retired by Sarvam (the API now rejects it with a deprecation error), so
# the default tracks the current model. Override per-environment via SARVAM_CHAT_MODEL.
SARVAM_CHAT_MODEL = os.environ.get("SARVAM_CHAT_MODEL", "sarvam-105b")
SARVAM_TTS_MODEL = os.environ.get("SARVAM_TTS_MODEL", "bulbul:v3")

# Demo safety net. When on, a failed or unconfigured Sarvam call falls back to a canned
# response instead of erroring, so a bad venue network can't dead-end a live demo. Off by
# default — it must never mask a real STT/LLM failure during development or testing.
# Enable with VOICE_FALLBACK=1 only when presenting.
VOICE_FALLBACK = os.environ.get("VOICE_FALLBACK", "").strip().lower() in {"1", "true", "yes"}

# Comma-separated list of allowed browser origins for CORS. Defaults to the local dev
# frontend; in prod (e.g. Dokploy) set CORS_ALLOW_ORIGINS to the frontend's public URL,
# e.g. "https://speakyield.example.com".
CORS_ALLOW_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("CORS_ALLOW_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]
