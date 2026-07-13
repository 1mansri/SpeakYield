# SETUP GUIDE — pre-development checklist

> **Status:** Draft, prototype-stage. Written 2026-07-09. Companion to [PROTOTYPE.md](./PROTOTYPE.md) and [PROTOTYPE_DESIGN.md](./PROTOTYPE_DESIGN.md).
> Synthesized from current (2026) guidance on AI-assisted ("vibe coding") project setup — sources at the bottom. This is what to have in place **before** writing feature code, so AI-generated code stays reviewable and doesn't quietly rot.

---

## Why this matters

The consistent finding across current guidance: AI coding assistants produce code fast, but without guardrails that speed compounds into unreviewable, insecure, or broken output. The fix isn't "review harder" — it's structural: linters and tests catch what a tired reviewer won't, and secrets/env discipline prevents the most common AI-generated mistake (hardcoded credentials). Set these up once, before feature work starts, not retrofitted after.

## Checklist

### 1. Planning artifacts (done)
- [x] A short PRD-equivalent before prompting — [PROTOTYPE.md](./PROTOTYPE.md) (scope, audience, success criteria) + [PROTOTYPE_DESIGN.md](./PROTOTYPE_DESIGN.md) (pages, wireframes, API contract, visual system). Letting an AI assistant improvise architecture and scope from scratch produces disorganized results — defining the shape first is the single most-cited piece of advice.

### 2. Project structure & AI context
- [ ] A scoped `CLAUDE.md` (or equivalent) inside `prototype/` stating: tech stack, folder layout, naming conventions, and "don't touch `docs/` (real-product docs) from here." Keeps the assistant's context anchored to the prototype's actual stack instead of drifting toward the real-product `TECH_STACK.md`.
- [ ] Keep `prototype/` fully self-contained (frontend, backend, docker files, docs) so the prototype can be deleted or rebuilt without touching the real-product planning docs in `/docs`.

### 3. Secrets & environment
- [ ] `.env.example` per service (frontend, backend) listing required variables (`SARVAM_API_KEY`, etc.) with placeholder values — never real keys.
- [ ] `.gitignore` covering `.env`, `.env.local`, `node_modules/`, `__pycache__/`, `.venv/`, Docker volume data. This is the #1 AI-coding mistake cited across sources: hardcoded API keys because the assistant doesn't know a secret exists unless the env pattern is already established.
- [ ] Never paste a real API key into a prompt or commit message.

### 4. Linting & formatting (enforced, not optional)
- [ ] Frontend: ESLint + Prettier, TypeScript strict mode (`tsc --noEmit` runnable as a check).
- [ ] Backend: **Ruff** (lint + format in one tool for Python/FastAPI) + **mypy** or **pyright** for type checking.
- [ ] Rationale from current guidance: documentation and instructions are hints an AI can ignore; linter errors in CI/dev pipeline are not. A small, strict rule set (short functions, no magic values, consistent naming) measurably improves AI-generated code quality.

### 5. Pre-commit hooks
- [ ] `pre-commit` (Python) or `husky` + `lint-staged` (JS) running lint + format on staged files before every commit. This is the cited "particularly crucial when working with AI coding assistants" layer — catches issues locally before they're committed, regardless of whether the change was hand-written or AI-generated.

### 6. Minimal but real test coverage
- [x] Backend: `pytest` covering the matching logic — `backend/tests/test_matching.py`, 6 cases (commodity/price/location scoring, fallback-never-empty, distance). Intent-extraction *parsing* is guarded by the backend's null/unparseable-content fallback plus type validation rather than a unit test (the LLM output itself is non-deterministic, so the parse/validate/fallback path is what matters).
- [x] Frontend: one Playwright smoke test — `frontend/e2e/happy-path.spec.ts`, login → mic → confirm → match → order with all backend routes mocked (deterministic, CI-safe). Run `pnpm test:e2e`.
- [x] The two riskiest paths (voice→structured-intent, matching) both have coverage that fails loudly if broken.

### 7. Review discipline
- [ ] Treat every AI-generated diff like a PR from a junior dev: read it, run it, understand *why* before accepting — especially for the voice pipeline and payment-mock logic. Speed is the point of this prototype, but silent acceptance of unread diffs is the most-cited failure mode in current guidance.

### 8. Docker/CI baseline
- [ ] `.dockerignore` per service (mirrors `.gitignore`) so `node_modules`/`.venv`/env files never end up baked into images.
- [ ] Healthchecks on each service in `docker-compose.yml` (already planned — see [PROTOTYPE.md](./PROTOTYPE.md#6-docker-setup)) so a broken container fails visibly instead of silently.
- [ ] Optional but recommended even for a 1-week prototype: a minimal CI workflow (GitHub Actions) running lint + the smoke tests on push — catches AI-introduced breakage before a demo, not during one.

### 9. Logging
- [x] Structured console logging on the backend for each pipeline stage — `app/logging_config.py` plus per-stage log lines (`STT:`, `INTENT:`, `MATCH:`) in the voice/store modules, so a live demo failure can be diagnosed in real time rather than guessed at.

## Explicitly skipped for the prototype

Given the 1-week timeline and hardcoded-data scope, these are deliberately deferred (revisit for the real MVP):
- Full CI/CD pipeline, staging environments.
- Security/dependency scanning (e.g. GitGuardian, Snyk) — worth adding before any real user data touches the system, not needed for mocked data.
- Code-quality gating tools (CodeScene, Codacy) — team-scale tooling, overkill for a solo-founder 1-week build.

---

## Sources

- [Vibe Coding Best Practices: How To Get Consistent Results](https://roadmap.sh/vibe-coding/best-practices)
- [Vibe coding checklist](https://learnhowtovibecode.com/)
- [9 vibe coding best practices (2026 guide)](https://www.softr.io/blog/vibe-coding-best-practices)
- [9 Vibe Coding Best Practices That Prevent Broken Builds (2026)](https://www.memberstack.com/blog/9-vibe-coding-best-practices)
- [Succeed with AI-assisted Coding - the Guardrails and Metrics You Need](https://codescene.com/blog/implement-guardrails-for-ai-assisted-coding)
- [local-ai-coding-guide/guides/guardrails.md](https://github.com/murataslan1/local-ai-coding-guide/blob/main/guides/guardrails.md)
- [Prevent Vibe Coding Security Vulnerabilities with Automated Guardrails](https://blog.gitguardian.com/automated-guard-rails-for-vibe-coding/)
