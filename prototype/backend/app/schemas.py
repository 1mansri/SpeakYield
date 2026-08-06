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


# ---- Voice command (decision screens) ----------------------------------------
# The farmer answers a decision screen by voice (Confirm/Retry, pick an option,
# Proceed, Done, rate, pick language). `decision` selects which set of intents is
# valid; `choices` carries the human-readable option labels for the "choose" screen.
Decision = Literal["confirm", "choose", "pay", "done", "review", "language"]

# Allowed `intent` values per decision — used to build the strict JSON schema and to
# tell the model exactly what it may return. Keep in sync with COMMAND_INSTRUCTIONS.
COMMAND_INTENTS: dict[str, list[str]] = {
    "confirm": ["confirm", "retry", "cancel", "unknown"],
    "choose": ["choose", "back", "unknown"],
    "pay": ["pay", "back", "unknown"],
    "done": ["done", "unknown"],
    "review": ["submit", "skip", "unknown"],
    "language": ["select", "unknown"],
}


def command_json_schema(decision: str) -> dict:
    """Strict JSON schema for a command response, with the `intent` enum narrowed to
    the decision's valid intents. All fields are required (strict mode); unused ones
    carry harmless defaults the model is told to fill (index -1, rating 0, etc.)."""
    return {
        "type": "object",
        "properties": {
            "intent": {"type": "string", "enum": COMMAND_INTENTS[decision]},
            "index": {"type": "integer"},
            "rating": {"type": "integer"},
            "comment": {"type": "string"},
            "language": {"type": "string", "enum": ["hi", "bn", "en", ""]},
            "confidence": {"type": "number"},
        },
        "required": ["intent", "index", "rating", "comment", "language", "confidence"],
        "additionalProperties": False,
    }


class CommandRequest(BaseModel):
    transcript: str
    language: str
    decision: Decision
    choices: list[str] = []


class CommandResponse(BaseModel):
    intent: str
    index: int = -1
    rating: int = 0
    comment: str = ""
    language: str = ""
    confidence: float = Field(ge=0, le=1)


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
    # Today's local rate for this commodity, when it's on the board — lets the UI show
    # each offer as a gain or loss against what the farmer would get at the mandi.
    mandi_price: float | None = None


class DeliveryPartnerInfo(BaseModel):
    name: str
    vehicle: str


class CreateMatchRequest(BaseModel):
    """Create a record against a partner the farmer explicitly picked on the options
    screen. `partner_id` is optional — if omitted, the backend falls back to the
    top-ranked option, preserving the old auto-match behaviour."""

    draft: VoiceDraft
    partner_id: str | None = None
    user_id: str | None = None  # so the deal lands in this farmer's standing record


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


# ---- Market surface (dashboard) ----------------------------------------------
# The market screen is the first thing a farmer (and a demo audience) sees, so it
# leads with the two things a marketplace has and an assistant does not: today's
# going rates, and the counterparties currently trading.


class MarketRate(BaseModel):
    """Today's going rate for a commodity in the pilot mandi.

    Carries the columns a physical mandi board carries — session low/high, arrivals,
    and the week's closes — because a price with no range and no volume behind it is a
    number on a screen, not a market quote."""

    commodity: str
    name_hi: str
    name_bn: str
    unit: str
    price: float
    delta: float  # change vs. yesterday; drives the ▲/▼ indicator
    emoji: str
    low: float  # today's session low
    high: float  # today's session high
    arrivals_qtl: float  # quintals arrived at the mandi today
    trend: list[float]  # last 7 closes, oldest first — drives the sparkline


class DemandSummary(BaseModel):
    """How much live demand exists for one commodity right now — buyer count and the
    spread they're paying. This is the marketplace's core claim, on the home screen."""

    commodity: str
    name_hi: str
    name_bn: str
    unit: str
    emoji: str
    buyers: int
    price_min: float
    price_max: float
    mandi_price: float


class MandiInfo(BaseModel):
    """The physical market this board belongs to. A rate is only meaningful attached to
    a place and a trading session, so the board says which one and when it closes."""

    name: str
    name_hi: str
    name_bn: str
    code: str  # the mandi's regulated-market licence number
    opens: str  # "HH:MM", IST
    closes: str  # "HH:MM", IST


class TickerItem(BaseModel):
    """One line of the live market feed — a bid moving, a lot clearing, arrivals
    landing. Timestamped rather than relative so the client can age it as it sits."""

    kind: Literal["bid", "lot", "arrival", "settle"]
    text: str
    text_hi: str
    text_bn: str
    at: float  # epoch seconds


class MarketResponse(BaseModel):
    rates: list[MarketRate]
    demand: list[DemandSummary]
    mandi: MandiInfo
    ticker: list[TickerItem]
    # When the board was last chalked up, and whether trading is on right now. Both are
    # what turn a static price list into something the farmer can trust the age of.
    updated_at: float
    session: Literal["open", "closed"]


# ---- Deals (the farmer's standing record) ------------------------------------
# A marketplace remembers what you traded; a conversation does not. Every confirmed
# listing/order becomes a deal the farmer can come back to.


class DealSummary(BaseModel):
    id: str
    action: Literal["sell", "buy"]
    commodity: str
    quantity: float
    unit: str
    price: float
    partner: str
    status: OrderStep
    amount: float  # net to the farmer for a sell; what they paid for a buy
    created_at: float


class DealsResponse(BaseModel):
    deals: list[DealSummary]  # newest first
    earned_this_month: float
    deal_count: int


class ReviewRequest(BaseModel):
    record_id: str
    rating: int = Field(ge=1, le=5)
    comment: str = ""


class ReviewResponse(BaseModel):
    ok: bool
