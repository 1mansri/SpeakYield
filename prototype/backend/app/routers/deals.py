from fastapi import APIRouter

from app.schemas import DealsResponse
from app.store import list_deals

router = APIRouter(prefix="/api/deals", tags=["deals"])


@router.get("")
def get_deals(user: str | None = None) -> DealsResponse:
    """This farmer's deals — live and completed — plus what they've earned this month.

    Listings and orders are deliberately served together: the farmer thinks in terms of
    "my deals", not in terms of which backend collection a trade landed in.
    """
    return list_deals(user)
