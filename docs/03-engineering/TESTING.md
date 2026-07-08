# TESTING — Speak Yield

> **Status:** Draft, idea stage. Test strategy by layer with a hard coverage bar for money/auth code.

---

## Philosophy
Voice + payments + hyperlocal matching means the expensive failures are **misunderstood intent** and **money moving wrongly**. Testing effort is weighted there, not spread evenly.

## Test layers

| Layer | Scope | Tooling (assumed ⚠️) |
|---|---|---|
| **Unit** | Domain logic: pricing/fee math, intent-to-action mapping, state machines (order/delivery), validation schemas. | Vitest/Jest |
| **Integration** | API + DB (MongoDB), provider interfaces with mocked vendors, webhook idempotency. | Supertest + ephemeral Mongo (test container / mongodb-memory-server) |
| **Contract** | Razorpay/WhatsApp/STT/LLM provider adapters against recorded/mocked responses; verify signature handling. | Recorded fixtures |
| **E2E** | Core journeys: voice→draft→confirm→order→pay→deliver; phone OTP login; KYC gate. | Playwright (PWA) + seeded backend |
| **Voice/NLU quality** | Golden set of Hindi/Bengali utterances → expected intent+entities; track accuracy over time. | Custom eval harness + labelled dataset |

## Coverage bar
- **Global:** ≥ 70% lines (guardrail, not a goal).
- **Mandatory ≥ 90% branch coverage** for: `payments`, `auth` (OTP + JWT + KYC gating), order/refund state transitions, and the **voice confirm** logic (draft→commit boundary). CI fails below this on those paths.
- Every bug fix ships with a regression test.

## Voice/NLU evaluation (special)
- Maintain a **labelled golden dataset** of real-world utterances per language (buy/sell/query, with numbers, prices, commodities, dialect variants).
- Track: intent accuracy, entity extraction F1, and **critical-error rate** (misheard quantity/price) — the last must trend toward zero because it directly threatens money.
- Run the eval in CI on any change to prompts, STT/LLM provider, or parsing; block regressions past a threshold.
- Because v1 requires **explicit human confirm**, NLU errors are recoverable — but the eval still gates quality.

## Environments & data
- Tests never hit real Razorpay/telephony — use sandbox/mocks. Razorpay **test mode** for payment E2E.
- No real PII in fixtures; use synthetic Indian phone numbers / names.
- Seed scripts create representative users (each role), listings, and geo data around the pilot area.

## Definition of done (testing)
A feature is testable-done when: unit + integration tests pass, coverage bars met, E2E covers the happy path + one failure path, and (for voice changes) the NLU eval shows no regression.
