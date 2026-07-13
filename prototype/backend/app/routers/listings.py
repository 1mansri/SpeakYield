from fastapi import APIRouter, HTTPException

from app.matching import match_buyers
from app.schemas import MatchCreateResponse, StatusResponse, VoiceDraft
from app.store import create_record, get_status

router = APIRouter(prefix="/api/listings", tags=["listings"])


@router.post("")
def create_listing(draft: VoiceDraft) -> MatchCreateResponse:
    best_buyer = match_buyers(draft)[0]
    return create_record(draft, best_buyer, role="buyer")


@router.get("/{listing_id}")
def get_listing(listing_id: str) -> StatusResponse:
    status = get_status(listing_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    return status
