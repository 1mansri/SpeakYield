import json
import secrets
from pathlib import Path

from fastapi import APIRouter, Header, HTTPException

from app.schemas import LoginRequest, LoginResponse, UserProfile

router = APIRouter(prefix="/api/auth", tags=["auth"])

USERS_PATH = Path(__file__).resolve().parent.parent / "data" / "users.json"
USERS = {user["id"]: user for user in json.loads(USERS_PATH.read_text(encoding="utf-8"))}

SESSIONS: dict[str, str] = {}  # token -> user id


@router.post("/login")
def login(payload: LoginRequest) -> LoginResponse:
    user = USERS.get(payload.id)
    if user is None or not secrets.compare_digest(user["password"], payload.password):
        raise HTTPException(status_code=401, detail="Invalid id or password")

    token = secrets.token_hex(16)
    SESSIONS[token] = user["id"]
    return LoginResponse(token=token, user=UserProfile(**user))


@router.get("/me")
def me(authorization: str = Header(default="")) -> UserProfile:
    token = authorization.removeprefix("Bearer ").strip()
    user_id = SESSIONS.get(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return UserProfile(**USERS[user_id])
