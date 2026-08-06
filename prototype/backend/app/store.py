import logging
import random
import secrets
import time
from typing import Any

from app.catalog import CATALOG
from app.schemas import (
    DealsResponse,
    DealSummary,
    DeliveryPartnerInfo,
    MatchCreateResponse,
    OrderStep,
    PartnerOption,
    ReviewRequest,
    StatusResponse,
    VoiceDraft,
)

logger = logging.getLogger("speak_yield.match")

RECORDS: dict[str, dict[str, Any]] = {}
REVIEWS: list[dict[str, Any]] = []

# Mock fees, mirrored from the frontend's MOCK_FEES so a deal's stored amount matches the
# settlement card the farmer saw. Keep the two in sync if either changes.
PLATFORM_FEE = 20.0
DELIVERY_FEE = 15.0

DAY_SECONDS = 86400

# Fast, demo-paced thresholds (seconds since creation) — not meant to simulate
# real logistics timing, just to make the stepper visibly progress during a live demo.
STEP_THRESHOLDS: list[tuple[float, OrderStep]] = [
    (3, "confirmed"),
    (8, "matched"),
    (15, "picked-up"),
    (float("inf"), "delivered"),
]


def _compute_status(record: dict[str, Any]) -> OrderStep:
    """Live records advance on a demo-paced clock. Seeded history carries a fixed
    `status` instead, so a deal from last week doesn't restart its stepper on boot."""
    fixed = record.get("status")
    if fixed is not None:
        return fixed

    elapsed = time.time() - record["created_at"]
    for threshold, step in STEP_THRESHOLDS:
        if elapsed < threshold:
            return step
    return "delivered"


def create_record(
    draft: VoiceDraft, option: dict[str, Any], user_id: str | None = None
) -> MatchCreateResponse:
    """Persist a listing/order against the partner the farmer chose (`option` is a
    built option dict from `matching.build_options`)."""
    record_id = secrets.token_hex(4)
    match = PartnerOption(**option)
    delivery = DeliveryPartnerInfo(**random.choice(CATALOG["delivery_partners"]))

    RECORDS[record_id] = {
        "created_at": time.time(),
        "user_id": user_id,
        "draft": draft,
        "match": match,
        "delivery": delivery,
    }
    logger.info(
        "MATCH: %s %r -> %s %r (%.1f km, ₹%s, %.1f★), delivery=%s [id=%s]",
        draft.action,
        draft.commodity,
        match.role,
        match.name,
        match.distance_km,
        match.price,
        match.rating,
        delivery.name,
        record_id,
    )
    return MatchCreateResponse(id=record_id, draft=draft, match=match, delivery=delivery)


def add_review(review: ReviewRequest) -> None:
    record = RECORDS.get(review.record_id)
    partner_name = record["match"].name if record else "unknown"
    REVIEWS.append(
        {
            "record_id": review.record_id,
            "partner": partner_name,
            "rating": review.rating,
            "comment": review.comment,
            "created_at": time.time(),
        }
    )
    logger.info(
        "REVIEW: %d★ for %r %s [id=%s]",
        review.rating,
        partner_name,
        f"— {review.comment!r}" if review.comment else "",
        review.record_id,
    )


def get_status(record_id: str) -> StatusResponse | None:
    record = RECORDS.get(record_id)
    if record is None:
        return None
    return StatusResponse(
        id=record_id,
        status=_compute_status(record),
        match=record["match"],
        delivery=record["delivery"],
    )


def _deal_amount(draft: VoiceDraft) -> float:
    """What the farmer actually walks away with (sell) or pays (buy), fees included."""
    gross = draft.quantity * draft.price
    if draft.action == "sell":
        return max(0.0, gross - PLATFORM_FEE - DELIVERY_FEE)
    return gross + PLATFORM_FEE + DELIVERY_FEE


def _to_deal(record_id: str, record: dict[str, Any]) -> DealSummary:
    draft: VoiceDraft = record["draft"]
    return DealSummary(
        id=record_id,
        action=draft.action,
        commodity=draft.commodity,
        quantity=draft.quantity,
        unit=draft.unit,
        price=draft.price,
        partner=record["match"].name,
        status=_compute_status(record),
        amount=_deal_amount(draft),
        created_at=record["created_at"],
    )


def list_deals(user_id: str | None) -> DealsResponse:
    """Every deal this farmer has going or completed, newest first, plus what they've
    earned this month. This is the app's memory — the thing that makes it a place the
    farmer has a history in, rather than a session that resets."""
    cutoff = time.time() - 30 * DAY_SECONDS
    deals = [
        _to_deal(rid, rec)
        for rid, rec in RECORDS.items()
        if user_id is None or rec.get("user_id") == user_id
    ]
    deals.sort(key=lambda d: d.created_at, reverse=True)

    earned = sum(
        d.amount
        for d in deals
        if d.action == "sell" and d.status == "delivered" and d.created_at >= cutoff
    )
    return DealsResponse(deals=deals, earned_this_month=earned, deal_count=len(deals))


# ---- Demo seed ---------------------------------------------------------------
# The app must never open empty. An empty marketplace reads as a fresh chat thread,
# which is exactly the misreading this seed exists to prevent: on first open the farmer
# already has a trading history, money earned, and one deal in transit.

# (partner_id, action, commodity, quantity, unit, price, days_ago, status)
SEED_DEALS: list[tuple[str, str, str, float, str, float, float, OrderStep]] = [
    ("b2", "sell", "Tomato", 60, "kg", 23, 12, "delivered"),
    ("b3", "sell", "Rice", 100, "kg", 21, 5, "delivered"),
    ("d1", "buy", "Urea fertiliser", 2, "bag", 280, 2, "delivered"),
    ("b4", "sell", "Potato", 40, "kg", 19, 0.04, "picked-up"),
]

SEED_DELIVERY = ["Suresh", "Bablu", "Anwar", "Suresh"]


def _seed_partner(partner_id: str, action: str) -> PartnerOption | None:
    pool = CATALOG["buyers"] if action == "sell" else CATALOG["dealers"]
    raw = next((p for p in pool if p["id"] == partner_id), None)
    if raw is None:
        return None
    return PartnerOption(
        id=raw["id"],
        name=raw["name"],
        role="buyer" if action == "sell" else "dealer",
        price=float(raw["price"]),
        distance_km=float(raw["distance_km"]),
        rating=float(raw["rating"]),
        reviews=int(raw["reviews"]),
        review=raw["review"],
        location=raw["location"],
        tags=[],
    )


def seed_demo_deals(user_ids: list[str]) -> None:
    """Give each demo farmer a standing trade history. Ids are deterministic (`seed-…`)
    so re-running the seed is idempotent and the demo looks identical every time."""
    now = time.time()
    for user_id in user_ids:
        for i, (partner_id, action, commodity, qty, unit, price, days_ago, status) in enumerate(
            SEED_DEALS
        ):
            match = _seed_partner(partner_id, action)
            if match is None:
                continue

            record_id = f"seed-{user_id}-{i}"
            RECORDS[record_id] = {
                "created_at": now - days_ago * DAY_SECONDS,
                "user_id": user_id,
                "status": status,
                "draft": VoiceDraft(
                    action=action,  # type: ignore[arg-type]
                    commodity=commodity,
                    quantity=qty,
                    unit=unit,
                    price=price,
                    location="Kharagpur",
                    confidence=1.0,
                ),
                "match": match,
                "delivery": DeliveryPartnerInfo(
                    **next(
                        d
                        for d in CATALOG["delivery_partners"]
                        if d["name"] == SEED_DELIVERY[i % len(SEED_DELIVERY)]
                    )
                ),
            }
    logger.info("SEED: %d demo deals for %s", len(SEED_DEALS), ", ".join(user_ids))
