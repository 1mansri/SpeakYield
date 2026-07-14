from app.matching import build_options, get_partner, match_buyers, match_dealers, mock_distance_km
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
    assert len(results) == 4  # always returns every buyer, ranked — never a dead end


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


def test_build_options_returns_every_partner_with_review_fields():
    options = build_options(_sell_draft())
    assert len(options) == 4
    first = options[0]
    expected_keys = {
        "id", "name", "role", "price", "distance_km", "rating", "reviews", "review", "tags"
    }
    assert expected_keys <= set(first)
    assert first["role"] == "buyer"


def test_build_options_tags_best_price_by_action():
    # Selling: the highest-paying buyer earns the best_price tag (farmer earns more).
    sell = build_options(_sell_draft())
    top_paid = max(sell, key=lambda o: o["price"])
    assert "best_price" in top_paid["tags"]

    # Buying: the cheapest dealer earns best_price (farmer pays less).
    buy = build_options(_buy_draft())
    cheapest = min(buy, key=lambda o: o["price"])
    assert "best_price" in cheapest["tags"]


def test_build_options_handles_missing_price():
    # Farmer who never stated a price still gets the full ranked option list.
    options = build_options(_buy_draft(price=0))
    assert len(options) == 4
    assert all(o["price"] > 0 for o in options)  # options carry the market prices


def test_get_partner_finds_by_action_pool():
    assert get_partner("sell", "b1")["name"] == "Ramesh Traders"
    assert get_partner("buy", "d1")["name"] == "Krishi Bhandar"
    assert get_partner("sell", "nope") is None
