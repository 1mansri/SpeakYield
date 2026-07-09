# PROTOTYPE — Speak Yield

> **Status:** Draft, prototype-stage. Written 2026-07-09.
> **Not the MVP.** This document scopes a **hardcoded-data demo**, distinct from the real "v1 (MVP)" defined in [VISION.md](../../docs/01-product/VISION.md) / [ROADMAP.md](../../docs/01-product/ROADMAP.md), which requires real farmers and real transactions. The Prototype exists to prove the voice-first interaction works before investing in the real backend, marketplace, and payments infrastructure.

---

## 1. Purpose

Prove — to both investors and potential pilot users (farmers/dealers) — that a farmer can speak a request in Hindi or Bengali and have it correctly transcribed, understood, read back, confirmed, and matched to a plausible counterparty, entirely by voice, on the web.

Success = a working demo that survives an unscripted "let me try it," not just a scripted click-through.

## 2. Audience

**Both**: investor pitch narrative *and* hands-on trial by real farmers/dealers in Kharagpur. This means the voice pipeline must handle genuine Hindi/Bengali speech reasonably well, not just a rehearsed script.

## 3. Scope

**In scope:**
- **Sell produce** flow — fully robust. Farmer speaks a listing (e.g. "Sell my 50 kg tomatoes for ₹20/kg"), gets transcription + intent extraction + spoken/visual read-back, confirms, gets matched to a sample buyer from the fixed dataset, sees a mock delivery partner assignment and mock UPI payment confirmation.
- **Buy inputs** flow — reuses the same voice-confirm component/pattern as sell-produce, lighter hardening (less edge-case tuning on STT/intent, since it's proving the pattern reuse, not re-proving the tech).
- Hindi + Bengali voice input.
- Fixed sample dataset: a small set of buyers, dealers, and listings that voice input actually matches against by commodity/price/location — not a single hardcoded happy path.

**Explicitly out of scope for the Prototype:**
- Real user accounts, phone+OTP auth, KYC.
- Real payments (UPI flow is mocked/simulated, no live Razorpay).
- Real delivery partners / logistics (mocked assignment).
- WhatsApp, IVR channels.
- Admin/ops console.
- Persistent database (fixed JSON dataset is enough; no Mongo/Postgres).
- Odia or any language beyond Hindi/Bengali.

## 4. Data

A **fixed sample dataset** (JSON, loaded by the backend) representing:
- Sample buyers/traders (name, commodities wanted, price range, location).
- Sample input dealers (name, inputs stocked, price, coverage radius).
- A couple of pre-seeded produce listings, so "browse nearby listings" has something to show if needed.

Matching logic is real (commodity + rough location/price matching against this fixed set), so the demo feels like a live marketplace rather than a single scripted path.

## 5. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js** | Carries forward toward the real MVP's PWA/offline requirements; own Docker container. |
| Backend | **Python + FastAPI** | Fast to wire up OpenAI + Whisper calls, Pydantic validates structured intent-extraction output, async-native for the STT→LLM call chain, auto-generated `/docs` contract for the frontend. Own Docker container. |
| STT | **Self-hosted Whisper** (Docker, CPU-only) | Free — avoids burning OpenAI credits on high-volume audio calls during dev/demo iteration. Own Docker container. |
| LLM (intent extraction) + TTS (read-back) | **OpenAI API** | Uses existing credits; low call volume relative to STT, so cost is manageable. |
| Data | Fixed JSON dataset, in-memory/file-backed | No real DB needed at prototype stage. |

Frontend and backend are **separate services**, communicating over REST (FastAPI auto-generates the OpenAPI contract).

Full design/API detail: [PROTOTYPE_DESIGN.md](./PROTOTYPE_DESIGN.md).

## 6. Docker setup

- `docker-compose.yml` — base service definitions (frontend, backend, stt).
- `docker-compose.override.yml` — dev overrides (bind-mounted source, hot reload); applied automatically by `docker compose up`.
- `docker-compose.prod.yml` — built images, no mounts; run via `docker compose -f docker-compose.yml -f docker-compose.prod.yml up`.

Goal: anyone can clone the repo and run one command to get the full stack (frontend + backend + STT) running locally, in dev or prod mode, without manually installing Python/Node/Whisper dependencies.

## 7. Timeline

**1 week.** Rough split:
- Days 1–2: scaffolding (repo structure, Docker/compose, bare mic → Whisper → OpenAI → read-back loop working end to end for one language).
- Days 3–4: sell-produce flow complete (matching, mock delivery, mock payment, read-back/confirm polish, Bengali added).
- Day 5: buy-inputs flow (reusing the voice-confirm component).
- Days 6–7: UI polish per [PROTOTYPE_DESIGN.md](./PROTOTYPE_DESIGN.md), responsive pass, real-speech testing/hardening on the sell-produce flow, buffer.

## 8. Success criteria

- A person who has never seen the demo can speak a real sell-produce request in Hindi or Bengali and complete the flow to a mock payment confirmation without being walked through it.
- The read-back/confirm step catches at least one deliberately-introduced misrecognition in a live test (proves the safety pattern, not just the happy path).
- Runs fully via `docker compose up` with no manual setup steps beyond providing an OpenAI API key.
