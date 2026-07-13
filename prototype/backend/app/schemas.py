from typing import Literal

from pydantic import BaseModel, Field

INTENT_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "action": {"type": "string", "enum": ["sell", "buy"]},
        "commodity": {"type": "string"},
        "quantity": {"type": "number"},
        "unit": {"type": "string"},
        "price": {"type": "number"},
        "location": {"type": "string"},
        "confidence": {"type": "number"},
    },
    "required": ["action", "commodity", "quantity", "unit", "price", "location", "confidence"],
    "additionalProperties": False,
}


class VoiceDraft(BaseModel):
    action: Literal["sell", "buy"]
    commodity: str
    quantity: float
    unit: str
    price: float
    location: str
    confidence: float = Field(ge=0, le=1)


class TranscribeResponse(BaseModel):
    transcript: str
    language: str


class IntentRequest(BaseModel):
    transcript: str
    language: str


class SpeakRequest(BaseModel):
    text: str
    language: str


class LoginRequest(BaseModel):
    id: str
    password: str


class UserProfile(BaseModel):
    id: str
    name: str
    role: Literal["farmer", "buyer"]
    location: str
    language: str


class LoginResponse(BaseModel):
    token: str
    user: UserProfile


class MatchedPartner(BaseModel):
    name: str
    role: Literal["buyer", "dealer"]
    distance_km: float


class DeliveryPartnerInfo(BaseModel):
    name: str
    vehicle: str


class MatchCreateResponse(BaseModel):
    id: str
    draft: VoiceDraft
    match: MatchedPartner
    delivery: DeliveryPartnerInfo


OrderStep = Literal["confirmed", "matched", "picked-up", "delivered"]


class StatusResponse(BaseModel):
    id: str
    status: OrderStep
    match: MatchedPartner
    delivery: DeliveryPartnerInfo
