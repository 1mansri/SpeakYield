from typing import Any

from app.catalog import CATALOG
from app.schemas import VoiceDraft


def _commodity_matches(a: str, b: str) -> bool:
    a, b = a.strip().lower(), b.strip().lower()
    return bool(a) and bool(b) and (a in b or b in a)


def _price_fit_score(price: float, low: float, high: float) -> float:
    if price <= 0:
        return 0.0
    if low <= price <= high:
        return 2.0
    distance = min(abs(price - low), abs(price - high))
    return max(0.0, 1.0 - distance / 20)


def _price_closeness_score(price: float, reference: float) -> float:
    if price <= 0:
        return 1.0  # no price given yet — neutral, don't penalize
    distance = abs(price - reference)
    return max(0.0, 2.0 - distance / 50)


def match_buyers(draft: VoiceDraft) -> list[dict[str, Any]]:
    """Score every buyer against a confirmed sell draft. Always returns all buyers,
    best match first — commodity/price/location are scoring signals, not filters,
    so the demo never dead-ends on an unrecognised commodity."""
    scored = []
    for buyer in CATALOG["buyers"]:
        score = 0.0
        if any(_commodity_matches(draft.commodity, c) for c in buyer["commodities"]):
            score += 3.0
        score += _price_fit_score(draft.price, buyer["price_min"], buyer["price_max"])
        if buyer["location"].strip().lower() == draft.location.strip().lower():
            score += 1.0
        scored.append((score, buyer))
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [buyer for _, buyer in scored]


def match_dealers(draft: VoiceDraft) -> list[dict[str, Any]]:
    """Score every dealer against a confirmed buy draft. Same always-returns-all-sorted
    contract as match_buyers."""
    scored = []
    for dealer in CATALOG["dealers"]:
        score = 0.0
        if any(_commodity_matches(draft.commodity, i) for i in dealer["inputs"]):
            score += 3.0
        score += _price_closeness_score(draft.price, dealer["price"])
        if dealer["location"].strip().lower() == draft.location.strip().lower():
            score += 1.0
        scored.append((score, dealer))
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [dealer for _, dealer in scored]


def mock_distance_km(partner_location: str, draft_location: str) -> float:
    return 2.3 if partner_location.strip().lower() == draft_location.strip().lower() else 12.5


def get_partner(action: str, partner_id: str) -> dict[str, Any] | None:
    """Look up a raw catalog partner by id, from the pool the action implies
    (sell -> buyers, buy -> dealers)."""
    pool = CATALOG["buyers"] if action == "sell" else CATALOG["dealers"]
    for partner in pool:
        if partner["id"] == partner_id:
            return partner
    return None


def _pros_tags(action: str, partner: dict[str, Any], pool: list[dict[str, Any]]) -> list[str]:
    """Which pros this partner leads on, relative to the others shown. For selling,
    a higher price is the farmer's win; for buying, a lower price is."""
    tags: list[str] = []
    if action == "sell":
        if partner["price"] == max(p["price"] for p in pool):
            tags.append("best_price")
    else:
        if partner["price"] == min(p["price"] for p in pool):
            tags.append("best_price")
    if partner["distance_km"] == min(p["distance_km"] for p in pool):
        tags.append("nearest")
    if partner["rating"] == max(p["rating"] for p in pool):
        tags.append("top_rated")
    return tags


def _to_option(action: str, partner: dict[str, Any], pool: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "id": partner["id"],
        "name": partner["name"],
        "role": "buyer" if action == "sell" else "dealer",
        "price": float(partner["price"]),
        "distance_km": float(partner["distance_km"]),
        "rating": float(partner["rating"]),
        "reviews": int(partner["reviews"]),
        "review": partner["review"],
        "location": partner["location"],
        "tags": _pros_tags(action, partner, pool),
    }


def build_options(draft: VoiceDraft) -> list[dict[str, Any]]:
    """Ranked list of partners the farmer can choose between, each carrying price /
    distance / rating / review plus the pros it leads on. This is the price-discovery
    surface: the farmer who didn't state a price sees who's trading at what."""
    ranked = match_buyers(draft) if draft.action == "sell" else match_dealers(draft)
    return [_to_option(draft.action, partner, ranked) for partner in ranked]
