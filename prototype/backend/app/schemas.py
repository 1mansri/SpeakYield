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


class PartnerOption(BaseModel):
    """A buyer (when selling) or dealer (when buying) the farmer can choose between.
    Carries everything the farmer weighs a choice on — price, distance, rating, a
    one-line review — plus computed `tags` (e.g. "best_price", "nearest") so the UI
    can surface the pros of each option at a glance."""

    id: str
    name: str
    role: Literal["buyer", "dealer"]
    price: float
    distance_km: float
    rating: float
    reviews: int
    review: str
    location: str
    tags: list[str]


class OptionsResponse(BaseModel):
    options: list[PartnerOption]


class DeliveryPartnerInfo(BaseModel):
    name: str
    vehicle: str


class CreateMatchRequest(BaseModel):
    """Create a record against a partner the farmer explicitly picked on the options
    screen. `partner_id` is optional — if omitted, the backend falls back to the
    top-ranked option, preserving the old auto-match behaviour."""

    draft: VoiceDraft
    partner_id: str | None = None


class MatchCreateResponse(BaseModel):
    id: str
    draft: VoiceDraft
    match: PartnerOption
    delivery: DeliveryPartnerInfo


OrderStep = Literal["confirmed", "matched", "picked-up", "delivered"]


class StatusResponse(BaseModel):
    id: str
    status: OrderStep
    match: PartnerOption
    delivery: DeliveryPartnerInfo


class ReviewRequest(BaseModel):
    record_id: str
    rating: int = Field(ge=1, le=5)
    comment: str = ""


class ReviewResponse(BaseModel):
    ok: bool
