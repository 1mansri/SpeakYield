# Speak Yield — Prototype

Hardcoded-data web demo proving the voice-first flow, distinct from the real "v1 (MVP)" planned in the root [`/docs`](../docs). See [DECISIONS.md](../docs/DECISIONS.md) for why these are kept separate.

## Docs

- [DEPLOYMENT.md](./docs/DEPLOYMENT.md) — every CLI command to run the app locally and in prod, with or without Docker.

## Structure

```
prototype/
  docs/           planning docs (this folder's docs above)
  frontend/       Next.js app (src/app, src/components/screens, src/components/AnswerMic, src/lib; e2e/ Playwright smoke test)
  backend/        FastAPI app (app/routers: auth, voice, catalog, listings, orders, reviews; app/data JSON; tests/)
  docker-compose.yml
  docker-compose.override.yml   (dev)
  docker-compose.prod.yml
```

## Stack

Next.js (frontend) · Python/FastAPI (backend) · Sarvam AI (STT, intent extraction, TTS) — frontend and backend run as separate Docker containers via `docker compose up`; Sarvam is a hosted API call, not a container.

## Testing the app

The full voice flow is live end-to-end: log in (testing-only mock gate — see [PROTOTYPE.md §3](./docs/PROTOTYPE.md#3-scope)), pick a language, tap the mic, speak a sell or buy request in Hindi/Bengali/English, and go through Confirm → Options → Match → mock payment → order status → review — all hitting the real backend (Sarvam STT/intent/command/TTS + catalog matching). Every decision screen is also **voice-answerable**: it speaks its question and you tap its mic to answer (confirm, choose, pay, done, rate, language), with buttons kept as a fallback. Test accounts, the one-command setup, and the `pnpm test:e2e` smoke test are in [DEPLOYMENT.md](./docs/DEPLOYMENT.md).

Requires a `SARVAM_API_KEY` in `backend/.env` for the voice pipeline.
