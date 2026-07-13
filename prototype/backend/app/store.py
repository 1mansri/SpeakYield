import logging
import random
import secrets
import time
from typing import Any

from app.catalog import CATALOG
from app.matching import mock_distance_km
from app.schemas import (
    DeliveryPartnerInfo,
    MatchCreateResponse,
    MatchedPartner,
    OrderStep,
    StatusResponse,
    VoiceDraft,
)

logger = logging.getLogger("speak_yield.match")

RECORDS: dict[str, dict[str, Any]] = {}

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


def create_record(draft: VoiceDraft, partner: dict[str, Any], role: str) -> MatchCreateResponse:
    record_id = secrets.token_hex(4)
    match = MatchedPartner(
        name=partner["name"],
        role=role,  # type: ignore[arg-type]
        distance_km=mock_distance_km(partner["location"], draft.location),
    )
    delivery = DeliveryPartnerInfo(**random.choice(CATALOG["delivery_partners"]))

    RECORDS[record_id] = {
        "created_at": time.time(),
        "draft": draft,
        "match": match,
        "delivery": delivery,
    }
    logger.info(
        "MATCH: %s %r -> %s %r (%.1f km), delivery=%s [id=%s]",
        draft.action,
        draft.commodity,
        role,
        match.name,
        match.distance_km,
        delivery.name,
        record_id,
    )
    return MatchCreateResponse(id=record_id, draft=draft, match=match, delivery=delivery)


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
