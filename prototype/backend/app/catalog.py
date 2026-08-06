import json
from pathlib import Path
from typing import Any

CATALOG_PATH = Path(__file__).resolve().parent / "data" / "catalog.json"
CATALOG: dict[str, Any] = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


def mandi_price(commodity: str) -> float | None:
    """Today's mandi rate for a commodity, or None if it isn't on the board.

    Used to show the farmer what an offer is worth *relative to what they'd get locally* —
    the difference is the platform's whole value proposition, so it belongs on screen.
    """
    needle = commodity.strip().lower()
    if not needle:
        return None
    for rate in CATALOG.get("rates", []):
        listed = rate["commodity"].strip().lower()
        if needle in listed or listed in needle:
            return float(rate["price"])
    return None
