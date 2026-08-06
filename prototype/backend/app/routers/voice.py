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
    VOICE_FALLBACK,
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


# ---- Demo fallback -----------------------------------------------------------
# Only reachable when VOICE_FALLBACK is on (see config). These are a presentation
# safety net for a dead venue network — never a substitute for the real pipeline.


def _silent_wav(seconds: float = 0.3, rate: int = 8000) -> bytes:
    """A valid, silent PCM WAV. Read-back is a bonus feature, so when TTS is down the
    screen should carry on quietly rather than surface an error the farmer can't act on."""
    frames = int(seconds * rate)
    data = b"\x00\x00" * frames
    header = (
        b"RIFF"
        + (36 + len(data)).to_bytes(4, "little")
        + b"WAVEfmt "
        + (16).to_bytes(4, "little")
        + (1).to_bytes(2, "little")  # PCM
        + (1).to_bytes(2, "little")  # mono
        + rate.to_bytes(4, "little")
        + (rate * 2).to_bytes(4, "little")
        + (2).to_bytes(2, "little")
        + (16).to_bytes(2, "little")
        + b"data"
        + len(data).to_bytes(4, "little")
    )
    return header + data


SILENT_WAV = _silent_wav()

FALLBACK_TRANSCRIPT = "50 किलो टमाटर बेचना है"
FALLBACK_LANGUAGE = "hi-IN"

FALLBACK_INTENT = {
    "action": "sell",
    "commodity": "Tomato",
    "quantity": 50,
    "unit": "kg",
    "price": 0,
    "location": "Kharagpur",
    "confidence": 0.9,
}

# Affirmative answer per decision screen, so a spoken "yes" still advances the flow.
FALLBACK_COMMAND_INTENT = {
    "confirm": "confirm",
    "choose": "choose",
    "pay": "pay",
    "done": "done",
    "review": "submit",
    "language": "select",
}


def _fallback_or_raise(stage: str, detail: str) -> None:
    """Raise unless the demo safety net is on, in which case log loudly and continue."""
    if not VOICE_FALLBACK:
        raise HTTPException(status_code=502, detail=detail)
    logger.warning("FALLBACK[%s]: %s", stage, detail)


def _require_api_key() -> None:
    if not SARVAM_API_KEY and not VOICE_FALLBACK:
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

    try:
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
    except httpx.HTTPError as exc:
        _fallback_or_raise("stt", f"Sarvam STT unreachable: {exc}")
        return {"transcript": FALLBACK_TRANSCRIPT, "language": FALLBACK_LANGUAGE}

    if response.status_code != 200:
        logger.error("STT failed (%s): %s", response.status_code, response.text)
        _fallback_or_raise("stt", f"Sarvam STT error: {response.text}")
        return {"transcript": FALLBACK_TRANSCRIPT, "language": FALLBACK_LANGUAGE}

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

    try:
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
    except httpx.HTTPError as exc:
        _fallback_or_raise("intent", f"Sarvam chat unreachable: {exc}")
        return VoiceDraft(**FALLBACK_INTENT)  # type: ignore[arg-type]

    if response.status_code != 200:
        _fallback_or_raise("intent", f"Sarvam chat error: {response.text}")
        return VoiceDraft(**FALLBACK_INTENT)  # type: ignore[arg-type]

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
    # With the safety net on, treat an unreachable model as the affirmative answer for
    # this screen — the farmer still has the on-screen buttons either way.
    fallback = CommandResponse(
        intent=FALLBACK_COMMAND_INTENT[payload.decision],
        index=0,
        rating=5,
        language="hi",
        confidence=0.5,
    )

    try:
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
    except httpx.HTTPError as exc:
        _fallback_or_raise("command", f"Sarvam chat unreachable: {exc}")
        return fallback

    if response.status_code != 200:
        logger.error("COMMAND chat failed (%s): %s", response.status_code, response.text)
        _fallback_or_raise("command", f"Sarvam chat error: {response.text}")
        return fallback

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

    try:
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
    except httpx.HTTPError as exc:
        _fallback_or_raise("tts", f"Sarvam TTS unreachable: {exc}")
        return Response(content=SILENT_WAV, media_type="audio/wav")

    if response.status_code != 200:
        _fallback_or_raise("tts", f"Sarvam TTS error: {response.text}")
        return Response(content=SILENT_WAV, media_type="audio/wav")

    audio_b64 = "".join(response.json().get("audios", []))
    if not audio_b64:
        _fallback_or_raise("tts", "Sarvam TTS returned no audio")
        return Response(content=SILENT_WAV, media_type="audio/wav")

    return Response(content=base64.b64decode(audio_b64), media_type="audio/wav")
