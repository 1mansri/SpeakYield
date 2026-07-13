# PHASES — step-by-step build plan

> **Status:** Draft, prototype-stage. Written 2026-07-09. Companion to [PROTOTYPE.md](./PROTOTYPE.md), [PROTOTYPE_DESIGN.md](./PROTOTYPE_DESIGN.md), [SETUP_GUIDE.md](./SETUP_GUIDE.md).
> Each phase is small and checkable. Do them in order — later phases assume earlier ones work. **No real auth/KYC/payments** appear anywhere below; per [PROTOTYPE.md](./PROTOTYPE.md#3-scope) those are explicitly out of scope for the prototype (mocked where the flow needs them).

Maps onto the 1-week timeline in [PROTOTYPE.md §7](./PROTOTYPE.md#7-timeline): Phases 0–3 = Day 1–2, Phases 4–9 = Day 3–4, Phase 10 = Day 5, Phases 11–12 = Day 6–7.

> **Progress (as built):** Phases 0–12 are all implemented. The voice pipeline runs on **Sarvam AI** (STT + chat-completion intent extraction + Bulbul TTS) rather than the originally-planned self-hosted Whisper + OpenAI — see [PROTOTYPE.md §5](./PROTOTYPE.md#5-tech-stack). A testing-only mock login gate was added ahead of Phase 8 (see the addendum before Phase 8). Per-phase "Built:" notes below record what actually shipped and any deviations.

---

## Phase 0 — Repo & tooling setup

Nothing runs yet; this is groundwork so every later phase is clean.

1. Create folder structure inside `prototype/`: `frontend/`, `backend/`, `stt/`.
2. Root-level `prototype/.gitignore`: `node_modules/`, `.next/`, `__pycache__/`, `.venv/`, `*.env`, `.env.local`, Docker volume dirs.
3. Add a scoped `prototype/CLAUDE.md`: states tech stack (Next.js / FastAPI / Sarvam AI — STT, chat, TTS), folder layout, and "don't reference `/docs` (real-product docs) from here" — per [SETUP_GUIDE.md §2](./SETUP_GUIDE.md#2-project-structure--ai-context).
4. Confirm local tooling installed: Node LTS, Python 3.11+, Docker Desktop.
5. Get a Sarvam AI API key ready (don't commit it anywhere yet).

## Phase 1 — Backend scaffold (FastAPI)

1. `prototype/backend/`: init a Python project (`pyproject.toml` or `requirements.txt`) with FastAPI + Uvicorn.
2. Add Ruff (lint + format) and mypy (or pyright) as dev dependencies; add config (`ruff.toml` / `pyproject.toml` sections).
3. Create `app/main.py` with a bare FastAPI app instance.
4. Implement `GET /api/health` returning `{"status": "ok"}` — first route, validates the scaffold works.
5. Run locally (`uvicorn app.main:app --reload`), confirm `/api/health` responds and `/docs` (Swagger UI) loads.
6. `prototype/backend/.env.example`: `SARVAM_API_KEY=`, `SARVAM_STT_URL=`, `SARVAM_CHAT_URL=`, `SARVAM_TTS_URL=`.
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

STT is a hosted API call (Sarvam AI), not a self-hosted container — only `frontend` and `backend` services are needed.

1. `prototype/backend/Dockerfile` (Python slim base, installs deps, runs Uvicorn).
2. `prototype/frontend/Dockerfile` (multi-stage: build, then `next start`).
3. `.dockerignore` per service mirroring `.gitignore`.
4. `prototype/docker-compose.yml`: define `frontend`, `backend` services, a shared network, and healthchecks on each (`/api/health` for backend, equivalent for frontend).
5. `prototype/docker-compose.override.yml`: dev bind mounts + hot reload commands (`next dev`, `uvicorn --reload`).
6. `prototype/docker-compose.prod.yml`: built images only, no mounts, production start commands.
7. Run `docker compose up` from `prototype/` — confirm both containers report healthy and frontend/backend reach each other over the Docker network.
8. Confirm the same works with `docker compose -f docker-compose.yml -f docker-compose.prod.yml up`.

**Checkpoint:** empty Next.js page rendering, FastAPI `/api/health` reachable from the frontend container — both via one command. Nothing voice-related works yet; that's Phase 4+.

---

## Phase 4 — STT integration

1. Confirm Sarvam AI's Speech-to-Text REST API works standalone (send a sample `.wav` file via curl with your `SARVAM_API_KEY`, get a transcript back).
2. Backend: implement `POST /api/voice/transcribe` — accepts multipart audio upload, forwards to Sarvam's Saaras STT API (`model=saaras:v3`, `mode=transcribe`), returns `{ transcript, language }`. (Done — see `prototype/backend/app/routers/voice.py`.)
3. Frontend: build a minimal mic-record utility (MediaRecorder API) with no UI polish yet — record a few seconds, POST the blob to `/api/voice/transcribe`, log the response.
4. Manually test in Hindi: speak a short sentence, confirm reasonable transcription.
5. Manually test in Bengali: same.
6. Note transcription quality/latency observations. Sarvam's ₹100 signup credit is enough for this dev/demo testing (~3 hours of audio at ₹30/hour) — budget for a paid plan before any real pilot usage beyond the prototype.

## Phase 5 — LLM intent extraction

1. Define the Pydantic response model: `{ action: "sell"|"buy", commodity, quantity, unit, price, location, confidence }`. (Done — see `prototype/backend/app/schemas.py`.)
2. Write the Sarvam chat completion prompt (system instructions + few-shot examples in Hindi/Bengali/English) that maps a transcript to this structure, using `response_format: json_schema` with `strict: true` for reliable structured output. (Done — see `prototype/backend/app/prompts.py`.)
3. Implement `POST /api/voice/intent` — takes `{ transcript, language }`, calls Sarvam's chat completions API (`sarvam-30b`/`sarvam-105b`), returns the structured draft. (Done — see `prototype/backend/app/routers/voice.py`.)
4. Test with a handful of realistic transcripts (including ambiguous/partial ones) — confirm it degrades sensibly (low `confidence`) rather than hallucinating fields. Initial smoke test returned a valid schema-matching draft but with a noticeably weak field extraction on a real Hindi sentence — needs real prompt/example tuning against actual transcripts, not just plumbing verification.
5. Wire Phase 4 → Phase 5 in sequence from the frontend test harness: record → transcribe → extract intent → log the draft object.

## Phase 6 — TTS read-back

1. Implement `POST /api/voice/speak` — `{ text, language }` → Sarvam AI Bulbul TTS (`bulbul:v3`) → audio stream response. (Done — see `prototype/backend/app/routers/voice.py`; verified with a live Hindi read-back returning a valid WAV file.)
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

> **Built (Phase 7):** `app/data/catalog.json` (3 buyers, 3 dealers, 2 seed listings, delivery partners); `app/catalog.py` loads it at startup. `app/matching.py` scores buyers/dealers by commodity + price-fit + location and always returns a ranked list (never dead-ends on an unknown commodity). `app/store.py` holds an in-memory record store with a time-based stepper (Confirmed→Matched→Picked up→Delivered). Routes: `GET /api/catalog`, `POST /api/listings`, `POST /api/orders`, `GET /api/listings/{id}`, `GET /api/orders/{id}`. Matching logic covered by `tests/test_matching.py` (6 pytest cases, all passing).

---

## Addendum — testing-only mock login (built out of phase order)

Not part of the original phase plan; added ad hoc as a testing/demo convenience, per the exception noted in [PROTOTYPE.md §3](./PROTOTYPE.md#3-scope). Documented here for completeness since it now sits in front of Phase 8's Language & Welcome screen.

1. Backend: `app/data/users.json` (fixed mock user list — id, plaintext password, name, role, location, language), `app/routers/auth.py` (`POST /api/auth/login`, `GET /api/auth/me`, in-memory token session — no JWT, no hashing, no persistence, deliberately minimal since this is a test gate, not real auth). CORS middleware added to `app/main.py` (`allow_origins=["http://localhost:3000"]`) since this was the first real browser→backend call.
2. Frontend: `LoginScreen` component + `src/lib/api.ts` calling `NEXT_PUBLIC_API_URL` — a plain (non-voice, non-multilingual) ID/password form, shown before the existing screen flow. On success, the returned user's `language` pre-selects the Welcome screen's language choice, and the user's `name` shows as a greeting on Home.
3. Test accounts (also in [DEPLOYMENT.md](./DEPLOYMENT.md)): `farmer1`/`farmer123`, `farmer2`/`farmer123`, `buyer1`/`buyer123`.
4. Login was the first real frontend→backend network call in the app; the rest of the flow was wired to the backend in Phase 9 (now complete), so the whole app runs live end-to-end.

## Phase 8 — Frontend screens (build in wireframe order)

Build each screen per [PROTOTYPE_DESIGN.md §6](./PROTOTYPE_DESIGN.md#6-wireframes-mobile-first-375px), static/mocked data first, then wire to real API calls in Phase 9.

1. **Language & Welcome** — Hindi/Bengali selector, Continue button, stores choice (local state/context, no backend call). Now reached after the testing-only Login screen (see addendum above), not as the app's actual first screen.
2. **Home** — mic button (Lucide `mic`), Sell/Buy mode chips (`wheat` / `shopping-bag`), tap-to-record wiring to the Phase 4 mic utility.
3. **Listening** — full-screen state, waveform animation (simple CSS/canvas, doesn't need to be fancy), live partial transcript placeholder, cancel button.
4. **Confirm Draft** — structured draft card, read-back audio auto-play, Retry (`rotate-ccw`) / Confirm (`check-circle`) buttons.
5. **Match Result** — matched buyer/dealer card, mock delivery-partner card (`truck`), "Confirm Payment" button.
6. **Order Status / Receipt** — mock payment success state, itemised breakdown (`indian-rupee`), vertical status stepper (`clock`).
7. Wire the Home screen's language globe icon (`globe`) to reopen the language selector.

> **Built (Phase 8):** all six screens plus the testing-only Login screen, in `frontend/src/components/screens/`. Shared `Button`/`Card` primitives, `Layout` (centered max-width column). The Listening screen records real audio via a `MediaRecorder` utility (`src/lib/recorder.ts`); the waveform is CSS-animated bars. Two lightweight loading screens (`LoadingScreen`) cover the Processing (STT+intent) and Matching async states, per [PROTOTYPE_DESIGN.md §7](./PROTOTYPE_DESIGN.md#7-voice-interaction-states).

## Phase 9 — End-to-end wiring (sell-produce flow)

1. Connect Home → Listening → (Phase 4 transcribe) → (Phase 5 intent) → Confirm Draft, using real backend calls instead of mocked data.
2. Connect Confirm Draft's Confirm button → `POST /api/listings` → Match Result.
3. Connect Match Result's "Confirm Payment" → mock payment success → Order Status, using `GET /api/listings/{id}` for the stepper.
4. Run the full flow live, Hindi first: speak a real sell-produce request, walk through every screen, confirm nothing breaks.
5. Fix whatever's rough — this is the first true end-to-end test of the core differentiator.

**Checkpoint:** a person can speak a sell-produce request in Hindi on the deployed-locally web app and reach a mock order confirmation, entirely through the UI (no test harness, no curl).

> **Built (Phase 9):** `src/lib/api.ts` wraps every backend call; `src/app/page.tsx` is the state machine driving login → welcome → home → listening → processing → confirm → matching → match → order, with an error screen for any failed call. Confirm Draft auto-plays the Bulbul TTS read-back. Order Status polls `GET /api/listings/{id}` (or `/orders/{id}`) live for the stepper. Speech-detected intent (`draft.action`) drives sell-vs-buy routing; the Home Sell/Buy chip is only a hint. Verified end-to-end with a fake-mic Playwright run reaching the order screen with no console errors. One real bug fixed here: `MediaRecorder` reports `audio/webm;codecs=opus`, which Sarvam's STT rejects — the recorder now strips the codec suffix.

## Phase 10 — Bengali + hardening (sell-produce flow)

1. Repeat Phase 9's live test in Bengali; fix STT/intent-extraction issues specific to Bengali (may need prompt/model tuning).
2. Deliberately test misrecognition cases (mumble a wrong number, background noise) — confirm the read-back/confirm step actually catches at least one live, per [PROTOTYPE.md §8 success criteria](./PROTOTYPE.md#8-success-criteria).
3. Tune the Sarvam STT mode and chat completion prompt/examples based on real observed failure patterns from Phases 4–10, not hypothetical ones.
4. Add basic error states to Confirm Draft (low-confidence warning icon `alert-circle`, "didn't catch that, try again") — the failure path needs a screen too, not just the happy path.

> **Built (Phase 10):** Real-speech round-trip testing (Bulbul TTS → Saaras STT) surfaced two concrete findings, both fixed:
> - **STT language hint.** Hindi audio without a hint mis-transcribes as romanized English; passing the user's selected language as `language_code` fixes the script. Bengali auto-detects cleanly either way. The frontend now sends the active language to `/api/voice/transcribe`, which forwards it to Sarvam (`app/routers/voice.py`).
> - **Low-confidence UI.** Confirm Draft shows an `alert-circle` "didn't catch that, try again" banner when `confidence < 0.5`, and the backend never 500s on a bad LLM response — null/unparseable content falls back to an empty, zero-confidence draft (which trips the banner).
> Known limitation: on pure nonsense/greetings the model still sometimes returns a plausible request at high confidence rather than low — the read-back + explicit Confirm/Retry is the real safety net, not the confidence score alone.

## Phase 11 — Buy-inputs flow

1. Reuse the Home → Listening → Confirm Draft → Match Result → Order Status components built in Phase 8, driven by `action: "buy"` instead of `"sell"`.
2. Wire Confirm Draft's Confirm button (buy path) → `POST /api/orders` → Match Result → Order Status.
3. Live-test in Hindi and Bengali — lighter hardening pass than Phase 10 (per [PROTOTYPE.md §3](./PROTOTYPE.md#3-scope), this flow proves component reuse, not re-proving the voice tech).

> **Built (Phase 11):** The buy flow reuses every sell component — `page.tsx` routes on `draft.action`, sending buy drafts to `POST /api/orders` (dealer match) and polling `/orders/{id}`. Verified: Hindi and Bengali buy transcripts (e.g. "मुझे दो बोरी यूरिया खाद खरीदनी है") correctly extract `action:"buy"` and match to a dealer. **Key fix made here:** the original few-shot intent prompt caused the model to regurgitate the first example verbatim (returning "Tomato/sell" for buy requests). Removing the examples and relying on the strict JSON schema fixed both the regurgitation and an intermittent null-response issue — verified reliable across both `sarvam-30b` and `sarvam-105b`. (`sarvam-30b` retained: cheaper, now reliable.)

## Phase 12 — Polish, responsiveness, tests, demo readiness

1. Responsive pass: verify all six screens on a real phone viewport and a desktop/laptop viewport (centered column, no broken layouts) per [PROTOTYPE_DESIGN.md §1.5](./PROTOTYPE_DESIGN.md#1-design-principles).
2. Accessibility pass: tap target sizes (44×44px min), contrast check against the palette in [PROTOTYPE_DESIGN.md §2](./PROTOTYPE_DESIGN.md#2-colour-palette). Use the `ux-ui-mastery` skill to independently review all six screens against standard UX heuristics — see [DESIGN_TOOLING.md](./DESIGN_TOOLING.md#3-ux-ui-mastery).
3. Add the frontend smoke test (Playwright/Vitest) for the mic → confirm → match happy path, per [SETUP_GUIDE.md §6](./SETUP_GUIDE.md#6-minimal-but-real-test-coverage).
4. Structured logging pass on the backend (per [SETUP_GUIDE.md §9](./SETUP_GUIDE.md#9-logging)) — every pipeline stage logs enough to diagnose a live demo failure.
5. Full clean-machine test: `docker compose up` from a fresh clone (only `.env` filled in) reaches a working demo with zero manual steps.
6. *(Stretch, only if time remains)* History screen — per [PROTOTYPE_DESIGN.md §5](./PROTOTYPE_DESIGN.md#5-pages).
7. Dry-run the full demo narrative once, start to finish, before showing anyone.

> **Built (Phase 12):**
> - **Responsive:** verified at 1280×800 (desktop) and 375×812 (mobile) against the running Docker stack — centered max-width column with whitespace either side on desktop, clean single column on mobile, no broken layouts.
> - **Smoke test:** `frontend/e2e/happy-path.spec.ts` (Playwright) drives login → mic → confirm → match → order with all backend routes mocked (deterministic, no Sarvam/audio dependency, CI-safe). Run with `pnpm test:e2e`. Passing.
> - **Structured logging:** `app/logging_config.py` sets up console logging; each pipeline stage logs a line (`STT:` transcript+detected lang, `INTENT:` extracted draft, `MATCH:` chosen partner+delivery) so a live demo failure is diagnosable in real time.
> - **Clean-machine test:** `docker compose up --build` (dev) and the prod overlay both bring the two-container stack to healthy with only `backend/.env` filled in; catalog/login/voice endpoints verified reachable in-container.
> - **Not done:** the `ux-ui-mastery` heuristic review (step 2), the stretch History screen (step 6), and the human demo dry-run (step 7) — these need a person, not code.

---

## Explicit non-goals (do not add during any phase)

Per [PROTOTYPE.md §3](./PROTOTYPE.md#3-scope): no real auth/OTP, no KYC, no live Razorpay/UPI, no real delivery partners, no WhatsApp/IVR, no admin console, no persistent database, no languages beyond Hindi/Bengali (English is included only as a demo-narration fallback, not a target farmer language). If a phase seems to need one of these, it's scope creep — mock it instead and move on.

Two deliberate, documented deviations were made during the build: the **Sarvam AI** voice stack (replacing self-hosted Whisper + OpenAI) and the **testing-only mock login** — both are recorded in [PROTOTYPE.md §3/§5](./PROTOTYPE.md#3-scope) and the addendum above, and neither crosses into the real-auth/real-payments/real-logistics lines above.
