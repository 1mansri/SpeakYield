from fastapi import APIRouter, HTTPException

from app.matching import match_dealers
from app.schemas import MatchCreateResponse, StatusResponse, VoiceDraft
from app.store import create_record, get_status

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("")
def create_order(draft: VoiceDraft) -> MatchCreateResponse:
    best_dealer = match_dealers(draft)[0]
    return create_record(draft, best_dealer, role="dealer")


@router.get("/{order_id}")
def get_order(order_id: str) -> StatusResponse:
    status = get_status(order_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return status
