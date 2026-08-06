from fastapi import APIRouter, HTTPException

from app.catalog import mandi_price
from app.matching import build_options
from app.schemas import (
    CreateMatchRequest,
    MatchCreateResponse,
    OptionsResponse,
    StatusResponse,
    VoiceDraft,
)
from app.store import create_record, get_status

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("/options")
def order_options(draft: VoiceDraft) -> OptionsResponse:
    """Dealers who could supply this input, ranked — the farmer's price-discovery view
    when buying. Shown so the farmer picks who to buy from, rather than being auto-matched."""
    return OptionsResponse(
        options=build_options(draft),  # type: ignore[arg-type]
        mandi_price=mandi_price(draft.commodity),
    )


@router.post("")
def create_order(req: CreateMatchRequest) -> MatchCreateResponse:
    options = build_options(req.draft)
    chosen = None
    if req.partner_id:
        chosen = next((o for o in options if o["id"] == req.partner_id), None)
    if chosen is None:
        chosen = options[0]  # no explicit pick -> fall back to the top-ranked dealer
    return create_record(req.draft, chosen, req.user_id)


@router.get("/{order_id}")
def get_order(order_id: str) -> StatusResponse:
    status = get_status(order_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return status
