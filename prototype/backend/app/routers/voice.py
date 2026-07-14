import base64
import logging

import httpx
from fastapi import APIRouter, File, Form, HTTPException, Response, UploadFile
from pydantic import ValidationError

from app.config import (
    SARVAM_API_KEY,
    SARVAM_CHAT_MODEL,
    SARVAM_CHAT_URL,
    SARVAM_STT_URL,
    SARVAM_TTS_MODEL,
    SARVAM_TTS_URL,
)
from app.prompts import (
    COMMAND_INSTRUCTIONS,
    INTENT_SYSTEM_PROMPT,
    command_system_prompt,
)
from app.schemas import (
    COMMAND_INTENTS,
    INTENT_JSON_SCHEMA,
    CommandRequest,
    CommandResponse,
    IntentRequest,
    SpeakRequest,
    VoiceDraft,
    command_json_schema,
)

router = APIRouter(prefix="/api/voice", tags=["voice"])
logger = logging.getLogger("speak_yield.voice")

LANGUAGE_TO_SARVAM = {"hi": "hi-IN", "bn": "bn-IN", "en": "en-IN"}

FALLBACK_DRAFT_FIELDS = {
    "action": "sell",
    "commodity": "",
    "quantity": 0,
    "unit": "",
    "price": 0,
    "location": "",
    "confidence": 0,
}


def _require_api_key() -> None:
    if not SARVAM_API_KEY:
        raise HTTPException(status_code=500, detail="SARVAM_API_KEY not configured")


@router.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    language: str = Form(default=""),
) -> dict[str, str]:
    _require_api_key()

    audio_bytes = await audio.read()

    # Passing the user's selected language as a hint measurably improves Sarvam STT accuracy
    # for Hindi (which otherwise mis-detects as romanized English); Bengali auto-detects fine
    # either way. Verified in Phase 10 real-speech round-trip testing.
    data = {"model": "saaras:v3", "mode": "transcribe"}
    sarvam_lang = LANGUAGE_TO_SARVAM.get(language)
    if sarvam_lang:
        data["language_code"] = sarvam_lang

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            SARVAM_STT_URL,
            headers={"api-subscription-key": SARVAM_API_KEY},
            files={
                "file": (
                    audio.filename or "audio.wav",
                    audio_bytes,
                    audio.content_type or "audio/wav",
                )
            },
            data=data,
        )

    if response.status_code != 200:
        logger.error("STT failed (%s): %s", response.status_code, response.text)
        raise HTTPException(status_code=502, detail=f"Sarvam STT error: {response.text}")

    payload = response.json()
    transcript = payload.get("transcript", "")
    detected = payload.get("language_code", "")
    logger.info(
        "STT: %d bytes (hint=%s) -> lang=%s transcript=%r",
        len(audio_bytes),
        sarvam_lang or "none",
        detected,
        transcript,
    )
    return {"transcript": transcript, "language": detected}


@router.post("/intent")
async def extract_intent(payload: IntentRequest) -> VoiceDraft:
    _require_api_key()

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            SARVAM_CHAT_URL,
            headers={
                "api-subscription-key": SARVAM_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "model": SARVAM_CHAT_MODEL,
                "messages": [
                    {"role": "system", "content": INTENT_SYSTEM_PROMPT},
                    {"role": "user", "content": payload.transcript},
                ],
                "temperature": 0.1,
                "response_format": {
                    "type": "json_schema",
                    "json_schema": {
                        "name": "voice_draft",
                        "schema": INTENT_JSON_SCHEMA,
                        "strict": True,
                    },
                },
            },
        )

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Sarvam chat error: {response.text}")

    content = response.json()["choices"][0]["message"]["content"]
    if content is None:
        logger.warning("INTENT: Sarvam returned null content for transcript=%r", payload.transcript)
        return VoiceDraft(**FALLBACK_DRAFT_FIELDS)  # type: ignore[arg-type]

    try:
        draft = VoiceDraft.model_validate_json(content)
    except ValidationError:
        logger.warning("INTENT: unparseable content=%r", content)
        return VoiceDraft(**FALLBACK_DRAFT_FIELDS)  # type: ignore[arg-type]

    logger.info(
        "INTENT: %r -> action=%s commodity=%r qty=%s%s price=%s conf=%.2f",
        payload.transcript,
        draft.action,
        draft.commodity,
        draft.quantity,
        draft.unit,
        draft.price,
        draft.confidence,
    )
    return draft


@router.post("/command")
async def parse_command(payload: CommandRequest) -> CommandResponse:
    """Map a spoken answer on a decision screen to a structured intent. Mirrors /intent:
    Sarvam chat + strict JSON schema, with the intent enum narrowed to the decision.
    On any failure to parse, returns intent='unknown' so the caller keeps the buttons."""
    _require_api_key()

    intents = COMMAND_INTENTS[payload.decision]
    system_prompt = command_system_prompt(
        payload.decision, intents, COMMAND_INSTRUCTIONS[payload.decision]
    )

    user_content = payload.transcript
    if payload.decision == "choose" and payload.choices:
        numbered = "\n".join(f"{i}: {label}" for i, label in enumerate(payload.choices))
        user_content = f"CHOICES:\n{numbered}\n\nFARMER'S ANSWER: {payload.transcript}"

    unknown = CommandResponse(intent="unknown", confidence=0.0)

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            SARVAM_CHAT_URL,
            headers={
                "api-subscription-key": SARVAM_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "model": SARVAM_CHAT_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                "temperature": 0.1,
                "response_format": {
                    "type": "json_schema",
                    "json_schema": {
                        "name": "voice_command",
                        "schema": command_json_schema(payload.decision),
                        "strict": True,
                    },
                },
            },
        )

    if response.status_code != 200:
        logger.error("COMMAND chat failed (%s): %s", response.status_code, response.text)
        raise HTTPException(status_code=502, detail=f"Sarvam chat error: {response.text}")

    content = response.json()["choices"][0]["message"]["content"]
    if content is None:
        logger.warning("COMMAND: null content for %r (%s)", payload.transcript, payload.decision)
        return unknown

    try:
        command = CommandResponse.model_validate_json(content)
    except ValidationError:
        logger.warning("COMMAND: unparseable content=%r (%s)", content, payload.decision)
        return unknown

    logger.info(
        "COMMAND[%s]: %r -> intent=%s index=%s rating=%s lang=%s conf=%.2f",
        payload.decision,
        payload.transcript,
        command.intent,
        command.index,
        command.rating,
        command.language,
        command.confidence,
    )
    return command


@router.post("/speak")
async def speak(payload: SpeakRequest) -> Response:
    _require_api_key()

    target_language = LANGUAGE_TO_SARVAM.get(payload.language, "en-IN")

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            SARVAM_TTS_URL,
            headers={
                "api-subscription-key": SARVAM_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "text": payload.text,
                "target_language_code": target_language,
                "speaker": "shubh",
                "model": SARVAM_TTS_MODEL,
            },
        )

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Sarvam TTS error: {response.text}")

    audio_b64 = "".join(response.json().get("audios", []))
    if not audio_b64:
        raise HTTPException(status_code=502, detail="Sarvam TTS returned no audio")

    return Response(content=base64.b64decode(audio_b64), media_type="audio/wav")
