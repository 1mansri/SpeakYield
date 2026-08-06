# Speak Yield — Prototype (scoped context)

This `prototype/` folder is a **hardcoded-data demo**, fully separate from the real product planning in the root `/docs`. Do not read or reference `/docs` (real-product docs, e.g. `VISION.md`, `ROADMAP.md`, `TECH_STACK.md`) from here — this prototype has its own docs in `prototype/docs/`.

## Tech stack
- Frontend: Next.js (App Router, TypeScript), Tailwind CSS v4, `lucide-react` icons.
- Backend: Python + FastAPI, `uv`-managed.
- Voice pipeline: Sarvam AI, all three stages — hosted API calls, no self-hosted container. Requires `SARVAM_API_KEY`.
  - STT: Saaras (`saaras:v3`).
  - Intent extraction (LLM): chat completions (`sarvam-30b`/`sarvam-105b`), structured via `response_format: json_schema`. Two uses: the opening-request draft (`/api/voice/intent`) and per-screen decision answers (`/api/voice/command`).
  - TTS: Bulbul (`bulbul:v3`) — Confirm-Draft read-back and each decision screen's spoken prompt.
- Voice-driven answers: every decision screen carries an `AnswerMic` (tap-to-answer) so confirm/choose/pay/done/rate/language are voice-answerable; on-screen buttons kept as fallback. See `docs/PROTOTYPE_DESIGN.md §7.1` and the PHASES.md end addendum.
- Data: fixed JSON dataset, no database — `app/data/catalog.json` (buyers/dealers/listings) and `app/data/users.json` (mock login users). In-memory record store for listings/orders (`app/store.py`).

## Folder layout
```
prototype/
  docs/       planning docs — PROTOTYPE.md, PROTOTYPE_DESIGN.md, PHASES.md, SETUP_GUIDE.md, DESIGN_TOOLING.md, DEPLOYMENT.md
  frontend/   Next.js app
    src/app/page.tsx            screen state machine + app-shell tab state
    src/components/AppShell.tsx   persistent chrome: brand, mandi location, bottom tab bar
    src/components/screens/     Login, Welcome, Market, Deals, Rates, Profile (tabs);
                                Listening, Loading, ConfirmDraft, Options, MatchResult,
                                Counterparty, OrderStatus, Review (flow)
    src/components/            AnswerMic, OrderSlip, SpreadBar, RatesStrip, DemandCard, DealCard
    src/lib/                    api.ts, recorder.ts, readback.ts, tts.ts, copy.ts, types.ts,
                                language.ts, commodities.ts
    e2e/happy-path.spec.ts      Playwright smoke test (mocked backend)
  backend/    FastAPI app
    app/routers/                auth (mock login), voice (Sarvam STT/intent/command/TTS),
                                catalog, market (rates + demand), deals, listings, orders, reviews
    app/matching.py, store.py, schemas.py, prompts.py, config.py, logging_config.py
    tests/test_matching.py      pytest
```

## Positioning (why the UI looks the way it does)
At the semi-finals the jury read this prototype as an AI chatbot rather than a marketplace.
`docs/REPOSITIONING_PLAN.md` diagnoses why and records the six blocks of work that fixed it.
The governing rule when changing any screen: **a chatbot has no inventory, no counterparties,
no money, and no memory** — so the market (rates, competing buyers, deals, earnings) stays on
screen, and voice reads as the way *into* it rather than as the product itself. Concretely:
no first-person AI persona in copy ("सुन रहा हूँ" ✗), no quoting the farmer's words back as a
hero element, no mic alone on an empty canvas. `docs/DEMO_SCRIPT.md` is the presentation run.

## Status
All build phases (0–12 in `docs/PHASES.md`) are implemented: the full voice flow runs end-to-end (real Sarvam calls, real catalog matching, live order stepper). Post-plan additions (see the PHASES.md end addendum): price-discovery Options + Review screens, and fully voice-driven decision answers (`AnswerMic` + `/api/voice/command`). Per-phase "Built:" notes and known limitations are in `docs/PHASES.md`.

## Conventions
- Follow `docs/PROTOTYPE_DESIGN.md` for colour palette, typography, icon set, and wireframes exactly — no blue/purple anywhere.
- Follow `docs/PHASES.md` build order — later phases assume earlier ones work.
- No real auth/KYC/payments — mock these per `docs/PROTOTYPE.md` scope. **Exception:** `app/routers/auth.py` is a deliberate, minimal, testing-only login gate (plaintext password check, in-memory session, fixed JSON user list) — it exists so testers can access the app, not as part of the farmer-facing product. Don't upgrade it toward real auth (hashing, JWT, persistence) without the user asking — that would misrepresent it as more than a test scaffold. See `docs/PROTOTYPE.md §3` for the full rationale.
- Keep this folder self-contained: it should be deletable/rebuildable without touching root `/docs`.
