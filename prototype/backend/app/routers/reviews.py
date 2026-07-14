from fastapi import APIRouter

from app.schemas import ReviewRequest, ReviewResponse
from app.store import add_review

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


@router.post("")
def submit_review(review: ReviewRequest) -> ReviewResponse:
    """Capture the farmer's rating of a completed sell/buy. Stored in memory only —
    it feeds nothing back into matching in the prototype, but proves the loop closes."""
    add_review(review)
    return ReviewResponse(ok=True)
