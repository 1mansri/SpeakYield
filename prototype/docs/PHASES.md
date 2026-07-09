# PHASES — step-by-step build plan

> **Status:** Draft, prototype-stage. Written 2026-07-09. Companion to [PROTOTYPE.md](./PROTOTYPE.md), [PROTOTYPE_DESIGN.md](./PROTOTYPE_DESIGN.md), [SETUP_GUIDE.md](./SETUP_GUIDE.md).
> Each phase is small and checkable. Do them in order — later phases assume earlier ones work. **No real auth/KYC/payments** appear anywhere below; per [PROTOTYPE.md](./PROTOTYPE.md#3-scope) those are explicitly out of scope for the prototype (mocked where the flow needs them).

Maps onto the 1-week timeline in [PROTOTYPE.md §7](./PROTOTYPE.md#7-timeline): Phases 0–3 = Day 1–2, Phases 4–9 = Day 3–4, Phase 10 = Day 5, Phases 11–12 = Day 6–7.

---

## Phase 0 — Repo & tooling setup

Nothing runs yet; this is groundwork so every later phase is clean.

1. Create folder structure inside `prototype/`: `frontend/`, `backend/`, `stt/`.
2. Root-level `prototype/.gitignore`: `node_modules/`, `.next/`, `__pycache__/`, `.venv/`, `*.env`, `.env.local`, Docker volume dirs.
3. Add a scoped `prototype/CLAUDE.md`: states tech stack (Next.js / FastAPI / self-hosted Whisper / OpenAI), folder layout, and "don't reference `/docs` (real-product docs) from here" — per [SETUP_GUIDE.md §2](./SETUP_GUIDE.md#2-project-structure--ai-context).
4. Confirm local tooling installed: Node LTS, Python 3.11+, Docker Desktop.
5. Get an OpenAI API key ready (don't commit it anywhere yet).

## Phase 1 — Backend scaffold (FastAPI)

1. `prototype/backend/`: init a Python project (`pyproject.toml` or `requirements.txt`) with FastAPI + Uvicorn.
2. Add Ruff (lint + format) and mypy (or pyright) as dev dependencies; add config (`ruff.toml` / `pyproject.toml` sections).
3. Create `app/main.py` with a bare FastAPI app instance.
4. Implement `GET /api/health` returning `{"status": "ok"}` — first route, validates the scaffold works.
5. Run locally (`uvicorn app.main:app --reload`), confirm `/api/health` responds and `/docs` (Swagger UI) loads.
6. `prototype/backend/.env.example`: `OPENAI_API_KEY=`, `STT_SERVICE_URL=`.
7. Set up `pre-commit` config running Ruff + mypy on staged files.

## Phase 2 — Frontend scaffold (Next.js)

1. `prototype/frontend/`: `create-next-app` (TypeScript, App Router).
2. Install `lucide-react` for icons.
3. Set up Tailwind (or CSS variables — either works) with the design tokens from [PROTOTYPE_DESIGN.md §2](./PROTOTYPE_DESIGN.md#2-colour-palette): the full colour palette as theme variables (`--color-primary`, `--color-accent`, `--color-bg`, etc.) — no blue/purple values anywhere in the theme.
4. Add Google Fonts: Noto Sans + Noto Sans Devanagari + Noto Sans Bengali per [PROTOTYPE_DESIGN.md §3](./PROTOTYPE_DESIGN.md#3-typography).
5. Set base font size (18px mobile minimum) in global styles.
6. Build a minimal shared `<Layout>` component (centered max-width column, per [PROTOTYPE_DESIGN.md §6](./PROTOTYPE_DESIGN.md#6-wireframes-mobile-first-375px) responsive note).
7. ESLint + Prettier config; confirm `npm run lint` and `npm run build` both pass on the bare scaffold.
8. `prototype/frontend/.env.example`: `NEXT_PUBLIC_API_URL=`.

## Phase 3 — Docker & Compose wiring

1. `prototype/backend/Dockerfile` (Python slim base, installs deps, runs Uvicorn).
2. `prototype/frontend/Dockerfile` (multi-stage: build, then `next start`).
3. `prototype/stt/`: use a prebuilt self-hosted Whisper image (e.g. `whisper-asr-webservice`), CPU-only, small/medium model — add config/README note on model choice.
4. `.dockerignore` per service mirroring `.gitignore`.
5. `prototype/docker-compose.yml`: define `frontend`, `backend`, `stt` services, a shared network, and healthchecks on each (`/api/health` for backend, equivalent for stt).
6. `prototype/docker-compose.override.yml`: dev bind mounts + hot reload commands (`next dev`, `uvicorn --reload`).
7. `prototype/docker-compose.prod.yml`: built images only, no mounts, production start commands.
8. Run `docker compose up` from `prototype/` — confirm all three containers report healthy and frontend/backend reach each other over the Docker network.
9. Confirm the same works with `docker compose -f docker-compose.yml -f docker-compose.prod.yml up`.

**Checkpoint:** empty Next.js page rendering, FastAPI `/api/health` reachable from the frontend container, Whisper container healthy — all via one command. Nothing voice-related works yet; that's Phase 4+.

---

## Phase 4 — STT integration

1. Confirm the Whisper container's REST endpoint works standalone (send a sample `.wav`/`.webm` file via curl, get a transcript back).
2. Backend: implement `POST /api/voice/transcribe` — accepts multipart audio upload, forwards to the Whisper container, returns `{ transcript, language }`.
3. Frontend: build a minimal mic-record utility (MediaRecorder API) with no UI polish yet — record a few seconds, POST the blob to `/api/voice/transcribe`, log the response.
4. Manually test in Hindi: speak a short sentence, confirm reasonable transcription.
5. Manually test in Bengali: same.
6. Note transcription quality/latency observations — decide if a larger Whisper model is needed (trade-off vs. container startup/RAM).

## Phase 5 — LLM intent extraction

1. Define the Pydantic response model: `{ action: "sell"|"buy", commodity, quantity, unit, price, location, confidence }`.
2. Write the OpenAI prompt (system instructions + few-shot examples in Hindi/Bengali/English) that maps a transcript to this structure.
3. Implement `POST /api/voice/intent` — takes `{ transcript, language }`, calls OpenAI, returns the structured draft.
4. Test with a handful of realistic transcripts (including ambiguous/partial ones) — confirm it degrades sensibly (low `confidence`) rather than hallucinating fields.
5. Wire Phase 4 → Phase 5 in sequence from the frontend test harness: record → transcribe → extract intent → log the draft object.

## Phase 6 — TTS read-back

1. Implement `POST /api/voice/speak` — `{ text, language }` → OpenAI TTS → audio stream response.
2. Generate the read-back sentence template from the structured draft (e.g. "आपने कहा: 50 किलो टमाटर, ₹20 प्रति किलो" / Bengali equivalent).
3. Frontend: play the returned audio automatically when a draft is shown (this lands for real in Phase 8's Confirm Draft screen — for now, test standalone).

## Phase 7 — Fixed dataset & matching

1. Write `prototype/backend/app/data/catalog.json`: sample buyers (name, commodities wanted, price range, location), sample dealers (inputs, price, coverage radius), a couple of seed listings.
2. Backend: load this at startup; implement `GET /api/catalog` (debug/inspection endpoint).
3. Implement matching logic: given a confirmed sell draft, find the best-matching buyer(s) by commodity + rough location/price fit (simple scoring, not ML).
4. Implement matching logic: given a confirmed buy draft, find the best-matching dealer(s) similarly.
5. Implement `POST /api/listings` (sell draft → match → mock delivery partner assignment → returns match result).
6. Implement `POST /api/orders` (buy draft → match → mock delivery partner assignment → returns match result).
7. Implement `GET /api/listings/{id}` and `GET /api/orders/{id}` — status lookup with a simple time-based mock stepper (Confirmed → Matched → Picked up → Delivered).
8. Unit test the matching logic directly (no HTTP) — this is one of the two paths flagged in [SETUP_GUIDE.md §6](./SETUP_GUIDE.md#6-minimal-but-real-test-coverage) as needing real test coverage.

**Checkpoint:** every backend route from [PROTOTYPE_DESIGN.md §8](./PROTOTYPE_DESIGN.md#8-api-routes-fastapi-backend) works when hit directly (via `/docs` or curl), independent of any frontend UI.

---

## Phase 8 — Frontend screens (build in wireframe order)

Build each screen per [PROTOTYPE_DESIGN.md §6](./PROTOTYPE_DESIGN.md#6-wireframes-mobile-first-375px), static/mocked data first, then wire to real API calls in Phase 9.

1. **Language & Welcome** — Hindi/Bengali selector, Continue button, stores choice (local state/context, no backend call).
2. **Home** — mic button (Lucide `mic`), Sell/Buy mode chips (`wheat` / `shopping-bag`), tap-to-record wiring to the Phase 4 mic utility.
3. **Listening** — full-screen state, waveform animation (simple CSS/canvas, doesn't need to be fancy), live partial transcript placeholder, cancel button.
4. **Confirm Draft** — structured draft card, read-back audio auto-play, Retry (`rotate-ccw`) / Confirm (`check-circle`) buttons.
5. **Match Result** — matched buyer/dealer card, mock delivery-partner card (`truck`), "Confirm Payment" button.
6. **Order Status / Receipt** — mock payment success state, itemised breakdown (`indian-rupee`), vertical status stepper (`clock`).
7. Wire the Home screen's language globe icon (`globe`) to reopen the language selector.

## Phase 9 — End-to-end wiring (sell-produce flow)

1. Connect Home → Listening → (Phase 4 transcribe) → (Phase 5 intent) → Confirm Draft, using real backend calls instead of mocked data.
2. Connect Confirm Draft's Confirm button → `POST /api/listings` → Match Result.
3. Connect Match Result's "Confirm Payment" → mock payment success → Order Status, using `GET /api/listings/{id}` for the stepper.
4. Run the full flow live, Hindi first: speak a real sell-produce request, walk through every screen, confirm nothing breaks.
5. Fix whatever's rough — this is the first true end-to-end test of the core differentiator.

**Checkpoint:** a person can speak a sell-produce request in Hindi on the deployed-locally web app and reach a mock order confirmation, entirely through the UI (no test harness, no curl).

## Phase 10 — Bengali + hardening (sell-produce flow)

1. Repeat Phase 9's live test in Bengali; fix STT/intent-extraction issues specific to Bengali (may need prompt/model tuning).
2. Deliberately test misrecognition cases (mumble a wrong number, background noise) — confirm the read-back/confirm step actually catches at least one live, per [PROTOTYPE.md §8 success criteria](./PROTOTYPE.md#8-success-criteria).
3. Tune Whisper model size / OpenAI prompt based on real observed failure patterns from Phases 4–10, not hypothetical ones.
4. Add basic error states to Confirm Draft (low-confidence warning icon `alert-circle`, "didn't catch that, try again") — the failure path needs a screen too, not just the happy path.

## Phase 11 — Buy-inputs flow

1. Reuse the Home → Listening → Confirm Draft → Match Result → Order Status components built in Phase 8, driven by `action: "buy"` instead of `"sell"`.
2. Wire Confirm Draft's Confirm button (buy path) → `POST /api/orders` → Match Result → Order Status.
3. Live-test in Hindi and Bengali — lighter hardening pass than Phase 10 (per [PROTOTYPE.md §3](./PROTOTYPE.md#3-scope), this flow proves component reuse, not re-proving the voice tech).

## Phase 12 — Polish, responsiveness, tests, demo readiness

1. Responsive pass: verify all six screens on a real phone viewport and a desktop/laptop viewport (centered column, no broken layouts) per [PROTOTYPE_DESIGN.md §1.5](./PROTOTYPE_DESIGN.md#1-design-principles).
2. Accessibility pass: tap target sizes (44×44px min), contrast check against the palette in [PROTOTYPE_DESIGN.md §2](./PROTOTYPE_DESIGN.md#2-colour-palette). Use the `ux-ui-mastery` skill to independently review all six screens against standard UX heuristics — see [DESIGN_TOOLING.md](./DESIGN_TOOLING.md#3-ux-ui-mastery).
3. Add the frontend smoke test (Playwright/Vitest) for the mic → confirm → match happy path, per [SETUP_GUIDE.md §6](./SETUP_GUIDE.md#6-minimal-but-real-test-coverage).
4. Structured logging pass on the backend (per [SETUP_GUIDE.md §9](./SETUP_GUIDE.md#9-logging)) — every pipeline stage logs enough to diagnose a live demo failure.
5. Full clean-machine test: `docker compose up` from a fresh clone (only `.env` filled in) reaches a working demo with zero manual steps.
6. *(Stretch, only if time remains)* History screen — per [PROTOTYPE_DESIGN.md §5](./PROTOTYPE_DESIGN.md#5-pages).
7. Dry-run the full demo narrative once, start to finish, before showing anyone.

---

## Explicit non-goals (do not add during any phase)

Per [PROTOTYPE.md §3](./PROTOTYPE.md#3-scope): no real auth/OTP, no KYC, no live Razorpay/UPI, no real delivery partners, no WhatsApp/IVR, no admin console, no persistent database, no languages beyond Hindi/Bengali. If a phase seems to need one of these, it's scope creep — mock it instead and move on.
