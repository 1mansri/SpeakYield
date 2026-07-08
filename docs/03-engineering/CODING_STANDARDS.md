# CODING_STANDARDS — Speak Yield

> **Status:** Draft, idea stage. Standards for a Next.js + Node/TypeScript stack. Kept lightweight for a solo/small team but strict where money and auth are involved.

---

## Language & style
- **TypeScript everywhere**, `strict: true`. No `any` in payment, auth, or order code (lint-enforced).
- **ESLint** (`@typescript-eslint`, `next/core-web-vitals`) + **Prettier** for formatting. Formatting is not debated in review — Prettier decides.
- Prefer pure functions in the domain layer; keep I/O (DB, providers) at the edges for testability.
- All money as integer paise; never floats. Use a shared `Money` helper.
- All external-provider calls (STT/LLM/TTS/Razorpay/WhatsApp) go through the provider-interface modules — no direct SDK calls scattered in feature code.

## Project conventions
- Domain modules mirror the monolith boundaries: `auth`, `voice`, `catalog`, `orders`, `matching`, `logistics`, `payments`, `notifications`, `admin`.
- Validate all external input with a schema library (e.g. Zod) at the boundary; types flow from schemas.
- Localised user-facing strings live in i18n resource files (`hi`, `bn`, `od`) — never hard-coded in code.
- Secrets only from environment / secrets manager — never in code or committed. See [ENV_VARIABLES.md](./ENV_VARIABLES.md).

## Git & commits
- **Conventional Commits:** `type(scope): summary` — e.g. `feat(voice): add Bengali intent parsing`, `fix(payments): idempotent razorpay webhook`.
  Types: `feat, fix, chore, refactor, test, docs, perf, build, ci`.
- Trunk-based with short-lived branches: `feat/…`, `fix/…`. See [CI_CD.md](./CI_CD.md).
- Small, focused PRs. No direct commits to `main`.

## PR checklist
- [ ] Scope is small and single-purpose; title is a Conventional Commit.
- [ ] Lint + typecheck + tests pass in CI.
- [ ] New/changed behaviour has tests (see coverage bar in [TESTING.md](./TESTING.md)).
- [ ] No secrets, keys, or PII in code, logs, or fixtures.
- [ ] Money/auth/voice-confirm paths reviewed with extra care.
- [ ] User-facing text is localised (hi/bn), not hard-coded.
- [ ] External input validated at the boundary.
- [ ] Migration/rollback considered if schema/index changed.
- [ ] Docs updated if API or env vars changed.

## Naming
- `camelCase` variables/functions, `PascalCase` types/components, `SCREAMING_SNAKE` env vars, `kebab-case` files.
- Collection field names match [DATABASE_SCHEMA.md](../02-architecture/DATABASE_SCHEMA.md).
