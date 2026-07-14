import logging
import random
import secrets
import time
from typing import Any

from app.catalog import CATALOG
from app.schemas import (
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

# Fast, demo-paced thresholds (seconds since creation) — not meant to simulate
# real logistics timing, just to make the stepper visibly progress during a live demo.
STEP_THRESHOLDS: list[tuple[float, OrderStep]] = [
    (3, "confirmed"),
    (8, "matched"),
    (15, "picked-up"),
    (float("inf"), "delivered"),
]


def _compute_status(created_at: float) -> OrderStep:
    elapsed = time.time() - created_at
    for threshold, step in STEP_THRESHOLDS:
        if elapsed < threshold:
            return step
    return "delivered"


def create_record(draft: VoiceDraft, option: dict[str, Any]) -> MatchCreateResponse:
    """Persist a listing/order against the partner the farmer chose (`option` is a
    built option dict from `matching.build_options`)."""
    record_id = secrets.token_hex(4)
    match = PartnerOption(**option)
    delivery = DeliveryPartnerInfo(**random.choice(CATALOG["delivery_partners"]))

    RECORDS[record_id] = {
        "created_at": time.time(),
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
        status=_compute_status(record["created_at"]),
        match=record["match"],
        delivery=record["delivery"],
    )
