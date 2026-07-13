# Speak Yield — Prototype

Hardcoded-data web demo proving the voice-first flow, distinct from the real "v1 (MVP)" planned in the root [`/docs`](../docs). See [DECISIONS.md](../docs/DECISIONS.md) for why these are kept separate.

## Docs

- [PROTOTYPE.md](./docs/PROTOTYPE.md) — purpose, scope, audience, tech stack, timeline, success criteria.
- [PROTOTYPE_DESIGN.md](./docs/PROTOTYPE_DESIGN.md) — pages, wireframes, colour/icon system, API routes.
- [SETUP_GUIDE.md](./docs/SETUP_GUIDE.md) — pre-development checklist (env/secrets, linting, testing, pre-commit).
- [PHASES.md](./docs/PHASES.md) — step-by-step build plan, from repo scaffolding through end-to-end demo readiness.
- [DESIGN_TOOLING.md](./docs/DESIGN_TOOLING.md) — installed animation/design plugins and where each one is (and isn't) appropriate for this app.
- [DEPLOYMENT.md](./docs/DEPLOYMENT.md) — every CLI command to run the app locally and in prod, with or without Docker.

## Structure

```
prototype/
  docs/           planning docs (this folder's docs above)
  frontend/       Next.js app (src/app, src/components/screens, src/lib; e2e/ Playwright smoke test)
  backend/        FastAPI app (app/routers: auth, voice, catalog, listings, orders; app/data JSON; tests/)
  docker-compose.yml
  docker-compose.override.yml   (dev)
  docker-compose.prod.yml
```

## Stack

Next.js (frontend) · Python/FastAPI (backend) · Sarvam AI (STT, intent extraction, TTS) — frontend and backend run as separate Docker containers via `docker compose up`; Sarvam is a hosted API call, not a container.

## Testing the app

The full voice flow is live end-to-end: log in (testing-only mock gate — see [PROTOTYPE.md §3](./docs/PROTOTYPE.md#3-scope)), pick a language, tap the mic, speak a sell or buy request in Hindi/Bengali/English, and go through Confirm → Match → mock payment → order status — all hitting the real backend (Sarvam STT/intent/TTS + catalog matching). Test accounts, the one-command setup, and the `pnpm test:e2e` smoke test are in [DEPLOYMENT.md](./docs/DEPLOYMENT.md).

Requires a `SARVAM_API_KEY` in `backend/.env` for the voice pipeline.
