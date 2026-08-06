from fastapi import APIRouter

from app.catalog import CATALOG
from app.schemas import DemandSummary, MarketRate, MarketResponse

router = APIRouter(prefix="/api/market", tags=["market"])

# Only surface commodities that at least this many buyers are actually taking — a
# "demand" card for a commodity nobody is buying would be a lie about liquidity.
MIN_BUYERS_FOR_DEMAND = 1


def _commodity_matches(a: str, b: str) -> bool:
    a, b = a.strip().lower(), b.strip().lower()
    return bool(a) and bool(b) and (a in b or b in a)


def _demand_for(rate: dict) -> DemandSummary | None:
    """Live demand for one commodity, derived from the buyers currently taking it.
    Returns None when nobody is buying, so the dashboard never shows empty demand."""
    buyers = [
        b
        for b in CATALOG["buyers"]
        if any(_commodity_matches(rate["commodity"], c) for c in b["commodities"])
    ]
    if len(buyers) < MIN_BUYERS_FOR_DEMAND:
        return None

    prices = [float(b["price"]) for b in buyers]
    return DemandSummary(
        commodity=rate["commodity"],
        name_hi=rate["name_hi"],
        name_bn=rate["name_bn"],
        unit=rate["unit"],
        emoji=rate["emoji"],
        buyers=len(buyers),
        price_min=min(prices),
        price_max=max(prices),
        mandi_price=float(rate["price"]),
    )


@router.get("")
def get_market() -> MarketResponse:
    """The market dashboard payload: today's rates plus who is buying what, at what
    spread. Served as one call so the home screen renders in a single round trip."""
    rates = [MarketRate(**rate) for rate in CATALOG["rates"]]
    demand = [d for d in (_demand_for(rate) for rate in CATALOG["rates"]) if d is not None]
    # Most competitive commodities first — the strongest liquidity signal leads.
    demand.sort(key=lambda d: (d.buyers, d.price_max), reverse=True)
    return MarketResponse(rates=rates, demand=demand)
