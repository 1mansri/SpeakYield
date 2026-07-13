# DEPLOYMENT — running the prototype locally and in prod

> **Status:** Draft, prototype-stage. Companion to [PROTOTYPE.md](./PROTOTYPE.md), [PHASES.md](./PHASES.md), [SETUP_GUIDE.md](./SETUP_GUIDE.md).
> Covers every CLI command needed to get the frontend + backend running, both with Docker Compose and natively. No STT/LLM/TTS container to manage — [Sarvam AI](https://docs.sarvam.ai) is a hosted API, reached over the network from the backend.

---

## 1. Prerequisites

| Tool | Needed for | Check |
|---|---|---|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Compose-based setup (§3, §4) | `docker --version` / `docker compose version` |
| [uv](https://docs.astral.sh/uv/) | Native backend setup (§2) | `uv --version` |
| Node.js LTS + [pnpm](https://pnpm.io/) (`corepack enable`) | Native frontend setup (§2) | `node --version` / `pnpm --version` |
| A [Sarvam AI](https://www.sarvam.ai/) API key | STT, intent extraction, TTS — every voice call | Sign up, ₹100 free credit included |

Every command below assumes your shell is at the repo root unless a `cd` is shown.

## 2. Environment variables

Copy the example files and fill in your real key — **never commit the filled-in `.env` files** (both are gitignored):

```bash
cp prototype/backend/.env.example prototype/backend/.env
cp prototype/frontend/.env.example prototype/frontend/.env
```

Edit `prototype/backend/.env`:

```
SARVAM_API_KEY=your-real-sarvam-api-key
SARVAM_STT_URL=https://api.sarvam.ai/speech-to-text
SARVAM_CHAT_URL=https://api.sarvam.ai/v1/chat/completions
SARVAM_TTS_URL=https://api.sarvam.ai/text-to-speech
SARVAM_CHAT_MODEL=sarvam-30b
SARVAM_TTS_MODEL=bulbul:v3
```

Only `SARVAM_API_KEY` is required — the rest have working defaults baked into `app/config.py` and only need overriding if Sarvam changes an endpoint or you want to try a different model tier.

`prototype/frontend/.env`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 3. Local — Docker Compose (dev)

Recommended path: closest to prod, no local Python/Node version drift to debug.

```bash
cd prototype
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000/api/health, Swagger UI at http://localhost:8000/docs
- `docker-compose.override.yml` is loaded automatically — bind-mounts source for hot reload (`next dev`, `uvicorn --reload`), so edits to `frontend/src` or `backend/app` take effect without a rebuild.

Useful variants:

```bash
docker compose up -d --build      # detached (background)
docker compose logs -f backend    # tail one service's logs
docker compose ps                 # check container health status
docker compose down                # stop and remove containers + network
```

## 4. Production — Docker Compose (prod overlay)

```bash
cd prototype
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

Differences from dev: no bind mounts (runs the actual built image — `next build` output via the Next.js standalone server, backend without `--reload`), `restart: unless-stopped`, `NODE_ENV=production`.

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build   # detached
docker compose -f docker-compose.yml -f docker-compose.prod.yml down            # stop
```

## 5. Local — without Docker (native)

Two terminals, run concurrently.

**Backend:**
```bash
cd prototype/backend
uv sync
uv run --env-file .env uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd prototype/frontend
pnpm install
pnpm dev
```

Same ports as the Docker path (3000 / 8000) — pick one approach, not both at once, or you'll hit `EADDRINUSE`.

## 6. Verifying it's actually running

Both the frontend and backend need to be up for this — the login screen makes a real network call. **Both servers must be running before you open the app**, or the login screen will show "Couldn't reach the server."

Open http://localhost:3000 and log in with one of the mock test accounts:

| ID | Password | Name | Role | Language |
|---|---|---|---|---|
| `farmer1` | `farmer123` | Ramesh Kumar | farmer | Hindi |
| `farmer2` | `farmer123` | Sita Devi | farmer | Bengali |
| `buyer1` | `buyer123` | Ramesh Traders | buyer | English |

This is a **testing-only mock gate** (plaintext password check against a fixed JSON file, in-memory session) — not real auth, not part of the actual farmer product. See [PROTOTYPE.md §3](./PROTOTYPE.md#3-scope). A successful login pre-selects that user's language and shows their name on the Home screen.

Past login, the **full flow is live** (Phase 9+): tap the mic, speak a sell or buy request in Hindi/Bengali/English, and the app records real audio → Sarvam STT → Sarvam intent extraction → Confirm Draft (with spoken read-back) → real match against the catalog → mock payment → order stepper polled live from the backend. Everything hits the real backend; a valid `SARVAM_API_KEY` in `backend/.env` is required for the voice pipeline to work. Grant microphone permission when the browser prompts.

**Backend voice/auth routes — via Swagger UI:** open http://localhost:8000/docs, use "Try it out" on each route.

**Backend — via curl:**
```bash
# Health
curl http://localhost:8000/api/health

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"id": "farmer1", "password": "farmer123"}'

# Transcribe (needs a real .wav file)
curl -X POST http://localhost:8000/api/voice/transcribe -F "audio=@your-file.wav"

# Intent extraction
curl -X POST http://localhost:8000/api/voice/intent \
  -H "Content-Type: application/json" \
  -d '{"transcript": "50 किलो टमाटर बेचना है, बीस रुपए किलो", "language": "hi"}'

# TTS (saves audio to a file)
curl -X POST http://localhost:8000/api/voice/speak \
  -H "Content-Type: application/json" \
  -d '{"text": "आपने कहा: 50 किलो टमाटर", "language": "hi"}' \
  --output out.wav

# Catalog (buyers, dealers, seed listings)
curl http://localhost:8000/api/catalog

# Create a listing from a confirmed sell draft (returns match + delivery)
curl -X POST http://localhost:8000/api/listings \
  -H "Content-Type: application/json" \
  -d '{"action":"sell","commodity":"Tomato","quantity":50,"unit":"kg","price":20,"location":"Kharagpur","confidence":0.95}'
```

> **Note on curl + non-ASCII:** on some shells (notably Git Bash on Windows) inline Devanagari/Bengali in a `curl -d` string gets mangled to `?` before it's sent, which makes intent extraction hallucinate. This is a shell/curl quirk, not an app bug — the browser and any UTF-8-correct client send it fine. Post from a file (`curl --data-binary @body.json` with a UTF-8 file) if you need to test non-ASCII transcripts from the terminal.

## 7. Other useful commands

**Backend lint/typecheck/test** (from `prototype/backend/`):
```bash
uv run ruff check .
uv run ruff format .
uv run mypy app
uv run pytest
```

**Backend pre-commit hooks** (from the repo root — the config lives in `prototype/backend/`):
```bash
uv run --project prototype/backend pre-commit install -c prototype/backend/.pre-commit-config.yaml
uv run --project prototype/backend pre-commit run --all-files --config prototype/backend/.pre-commit-config.yaml
```

**Frontend lint/typecheck/build/test** (from `prototype/frontend/`):
```bash
pnpm lint
npx tsc --noEmit
pnpm build
pnpm start        # serve the production build locally, after `pnpm build`
pnpm test:e2e     # Playwright smoke test (mocks the backend; starts its own dev server)
```
First-time only, install the Playwright browser: `npx playwright install chromium`.

## 8. Troubleshooting

- **`EADDRINUSE` on port 3000/8000** — something is already bound to that port. `docker compose down` if a previous Compose run is still up, or find and kill the stray process (`lsof -i :8000` / on Windows: `Get-NetTCPConnection -LocalPort 8000`).
- **Backend 500s with "SARVAM_API_KEY not configured"** — `.env` is missing or not being loaded. Native: confirm you passed `--env-file .env` to `uv run`. Docker: confirm `prototype/backend/.env` exists (the compose `env_file` entry is `required: false`, so a missing file fails silently rather than erroring).
- **Sarvam calls return 401/403** — key is invalid, expired, or the ₹100 free credit is exhausted; check usage at the Sarvam dashboard.
- **Frontend container unhealthy on first boot** — first Next.js compile can take longer than the healthcheck's `start_period`; give it another `docker compose ps` after a few seconds before assuming it's broken.
- **Login screen says "Couldn't reach the server"** — the backend isn't running, or it's not on `localhost:8000`. Check `NEXT_PUBLIC_API_URL` in `frontend/.env` matches where the backend actually is.
- **Login screen says "Invalid ID or password"** — you're hitting the real backend correctly; double-check against the test account table in §6 (IDs/passwords are case-sensitive).
- **CORS error in the browser console on login** — the backend's `CORSMiddleware` only allows `http://localhost:3000` (see `app/main.py`). If you're accessing the frontend from a different host/port, add it there.
