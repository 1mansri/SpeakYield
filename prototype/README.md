# Speak Yield — Prototype

Hardcoded-data web demo proving the voice-first flow, distinct from the real "v1 (MVP)" planned in the root [`/docs`](../docs). See [DECISIONS.md](../docs/DECISIONS.md) for why these are kept separate.

## Docs

- [PROTOTYPE.md](./docs/PROTOTYPE.md) — purpose, scope, audience, tech stack, timeline, success criteria.
- [PROTOTYPE_DESIGN.md](./docs/PROTOTYPE_DESIGN.md) — pages, wireframes, colour/icon system, API routes.
- [SETUP_GUIDE.md](./docs/SETUP_GUIDE.md) — pre-development checklist (env/secrets, linting, testing, pre-commit).

## Structure (once scaffolded)

```
prototype/
  docs/           planning docs (this folder's docs above)
  frontend/       Next.js app
  backend/        FastAPI app
  stt/            self-hosted Whisper service config
  docker-compose.yml
  docker-compose.override.yml   (dev)
  docker-compose.prod.yml
```

## Stack

Next.js (frontend) · Python/FastAPI (backend) · self-hosted Whisper (STT) · OpenAI (intent extraction + TTS) — all separate Docker containers, run via `docker compose up`.
