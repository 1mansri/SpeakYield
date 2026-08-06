from datetime import datetime, time, timedelta, timezone

from fastapi import APIRouter

from app.catalog import CATALOG
from app.schemas import (
    DemandSummary,
    MandiInfo,
    MarketRate,
    MarketResponse,
    TickerItem,
)

router = APIRouter(prefix="/api/market", tags=["market"])

# Only surface commodities that at least this many buyers are actually taking — a
# "demand" card for a commodity nobody is buying would be a lie about liquidity.
MIN_BUYERS_FOR_DEMAND = 1

# The pilot mandi runs on IST no matter where this process happens to be hosted.
IST = timezone(timedelta(hours=5, minutes=30))

# The board is re-chalked on a fixed cadence, so "updated at" lands on a round time
# rather than jittering by the second on every poll.
BOARD_REFRESH_MINUTES = 5


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


def _parse_hhmm(value: str) -> time:
    hour, minute = value.split(":")
    return time(int(hour), int(minute))


def _session_state(mandi: dict, now: datetime) -> tuple[str, datetime]:
    """Whether trading is on, and the moment the board last moved.

    While the session is open the board is live, refreshed on a fixed cadence. Once it
    closes the board freezes at the closing bell — a farmer checking at 9pm should see
    "closed, board from 6:00 PM", not a price pretending to be current.
    """
    opens = datetime.combine(now.date(), _parse_hhmm(mandi["opens"]), tzinfo=IST)
    closes = datetime.combine(now.date(), _parse_hhmm(mandi["closes"]), tzinfo=IST)

    if opens <= now < closes:
        stale_minutes = now.minute % BOARD_REFRESH_MINUTES
        return "open", now.replace(second=0, microsecond=0) - timedelta(minutes=stale_minutes)

    # Before the bell, the standing board is yesterday's close.
    return "closed", closes if now >= closes else closes - timedelta(days=1)


def _ticker(now: datetime) -> list[TickerItem]:
    """The live feed, newest first. Stored as minutes-before-now so the seed data ages
    with the demo instead of drifting into obviously stale absolute timestamps."""
    items = [
        TickerItem(
            kind=entry["kind"],
            text=entry["text"],
            text_hi=entry["text_hi"],
            text_bn=entry["text_bn"],
            at=(now - timedelta(minutes=entry["minutes_ago"])).timestamp(),
        )
        for entry in CATALOG.get("ticker", [])
    ]
    items.sort(key=lambda i: i.at, reverse=True)
    return items


@router.get("")
def get_market() -> MarketResponse:
    """The market dashboard payload: the mandi's board — today's rates with their
    session range and arrivals — plus who is buying what, and the live feed. Served as
    one call so the home screen renders in a single round trip."""
    now = datetime.now(IST)
    mandi = CATALOG["mandi"]
    session, updated_at = _session_state(mandi, now)

    rates = [MarketRate(**rate) for rate in CATALOG["rates"]]
    demand = [d for d in (_demand_for(rate) for rate in CATALOG["rates"]) if d is not None]
    # Most competitive commodities first — the strongest liquidity signal leads.
    demand.sort(key=lambda d: (d.buyers, d.price_max), reverse=True)

    return MarketResponse(
        rates=rates,
        demand=demand,
        mandi=MandiInfo(**mandi),
        ticker=_ticker(now),
        updated_at=updated_at.timestamp(),
        session=session,
    )
