from app.matching import match_buyers, match_dealers, mock_distance_km
from app.schemas import VoiceDraft


def _sell_draft(**overrides: object) -> VoiceDraft:
    base = dict(
        action="sell",
        commodity="Tomato",
        quantity=50,
        unit="kg",
        price=20,
        location="Kharagpur",
        confidence=0.9,
    )
    base.update(overrides)
    return VoiceDraft(**base)  # type: ignore[arg-type]


def _buy_draft(**overrides: object) -> VoiceDraft:
    base = dict(
        action="buy",
        commodity="Urea fertiliser",
        quantity=2,
        unit="bag",
        price=280,
        location="Kharagpur",
        confidence=0.9,
    )
    base.update(overrides)
    return VoiceDraft(**base)  # type: ignore[arg-type]


def test_match_buyers_prefers_commodity_and_location_match():
    results = match_buyers(_sell_draft())
    assert results[0]["id"] == "b1"  # Ramesh Traders: Tomato + Kharagpur + in-range price


def test_match_buyers_falls_back_when_commodity_unknown():
    results = match_buyers(_sell_draft(commodity="Mango", location="Nowhere"))
    assert len(results) == 3  # always returns every buyer, ranked — never a dead end


def test_match_buyers_price_fit_can_flip_ranking_between_equal_commodity_matches():
    # Neutral location so the location bonus doesn't mask the price signal.
    # b1's range is 15-25, b2's is 10-30 — both stock Tomato.
    at_price_in_both_ranges = match_buyers(_sell_draft(price=20, location="Somewhere"))
    at_price_only_closer_to_b2 = match_buyers(_sell_draft(price=35, location="Somewhere"))
    assert at_price_in_both_ranges[0]["id"] == "b1"
    assert at_price_only_closer_to_b2[0]["id"] == "b2"


def test_match_dealers_prefers_commodity_and_location_match():
    results = match_dealers(_buy_draft())
    assert results[0]["location"] == "Kharagpur"
    assert any("Urea fertiliser" in d["inputs"] for d in [results[0]])


def test_match_dealers_never_empty_for_unknown_input():
    results = match_dealers(_buy_draft(commodity="Tractor Fuel"))
    assert results


def test_mock_distance_km_same_location_is_closer():
    assert mock_distance_km("Kharagpur", "Kharagpur") < mock_distance_km("Kolkata", "Kharagpur")
