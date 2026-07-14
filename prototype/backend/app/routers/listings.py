from fastapi import APIRouter, HTTPException

from app.matching import build_options
from app.schemas import (
    CreateMatchRequest,
    MatchCreateResponse,
    OptionsResponse,
    StatusResponse,
    VoiceDraft,
)
from app.store import create_record, get_status

router = APIRouter(prefix="/api/listings", tags=["listings"])


@router.post("/options")
def listing_options(draft: VoiceDraft) -> OptionsResponse:
    """Buyers who could take this produce, ranked — the farmer's price-discovery view
    when selling. Shown so the farmer picks who to sell to, rather than being auto-matched."""
    return OptionsResponse(options=build_options(draft))  # type: ignore[arg-type]


@router.post("")
def create_listing(req: CreateMatchRequest) -> MatchCreateResponse:
    options = build_options(req.draft)
    chosen = next((o for o in options if o["id"] == req.partner_id), None) if req.partner_id else None
    if chosen is None:
        chosen = options[0]  # no explicit pick -> fall back to the top-ranked buyer
    return create_record(req.draft, chosen)


@router.get("/{listing_id}")
def get_listing(listing_id: str) -> StatusResponse:
    status = get_status(listing_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    return status
