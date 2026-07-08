# SECURITY — Speak Yield

> **Status:** Draft, idea stage. Security posture for a phone-first, money-handling, personal-data platform. Reflects confirmed decisions: phone+OTP for all, KYC-gated business accounts, Razorpay hosted payments.

---

## Authentication
- **Primary:** phone number + **OTP** (SMS/WhatsApp). No passwords — fits low-literacy users and matches the phone-as-identity model.
- **Sessions:** short-lived **JWT access token** + longer refresh token. Refresh tokens rotated on use; revocable via a Redis denylist (logout / suspected compromise).
- **OTP hardening:** time-boxed OTPs (`OTP_TTL_SECONDS`), max attempts + lockout (`OTP_MAX_ATTEMPTS`), per-phone and per-IP rate limits, no OTP in logs.
- **KYC gate (business accounts):** Buyer/Dealer/Delivery roles must complete **KYC (via Razorpay)** before transacting at volume or receiving payouts. Threshold ⚠️ (proposed): unverified business accounts capped at a low per-day transaction value/count; payouts blocked until `kycStatus = verified`. Confirm thresholds with ops/compliance.
- **IVR auth (v2):** caller-ID + spoken OTP.

## Authorization
- **Role- + ownership- + geo-based** access control enforced in the API layer on every query (the security boundary for our single shared marketplace — see [ARCHITECTURE.md](../02-architecture/ARCHITECTURE.md)).
- Every user-owned document carries `ownerId` (+ `orgId` where relevant); no query runs unscoped by the authenticated principal.
- Admin/ops actions gated by `admin` role and audit-logged.

## Payments & PCI scope
- **Razorpay hosted checkout / UPI** — **no card or UPI credentials ever touch our servers**, keeping us in the smallest PCI-DSS scope (**SAQ-A**). See [COMPLIANCE.md](./COMPLIANCE.md).
- Webhooks signature-verified (`RAZORPAY_WEBHOOK_SECRET`) and idempotent.
- Payment kill-switch + payout pause available for incidents.

## Data protection
- **In transit:** TLS everywhere (public + internal where feasible).
- **At rest:** encryption on MongoDB Atlas, S3, Redis (KMS-managed keys).
- **PII minimisation:** store only what's needed; phone masked/hashed in logs; **no raw KYC document images stored** (provider references only).
- **Voice data:** audio + transcripts stored under retention + consent controls ([DATA_RETENTION.md](./DATA_RETENTION.md)); cross-border STT/LLM processing is consented + disclosed.
- **Residency:** all primary data in India (ap-south-1).

## Secrets management
- All secrets in **AWS Secrets Manager / SSM**, injected at runtime — never in code, images, or committed env files. See [ENV_VARIABLES.md](../03-engineering/ENV_VARIABLES.md).
- Least-privilege IAM; separate credentials per environment; rotation policy for keys/tokens.

## Rate limiting & abuse
- Global + per-user + per-IP rate limits (auth, voice, checkout especially).
- Bot/abuse protection at the edge (WAF); anomaly alerts on OTP and payment patterns.
- Voice endpoint quotas to bound provider cost/abuse.

## Application security
- Validate all input at the boundary (schemas); output encoding; parameterised queries.
- Standard headers (CSP, HSTS, etc.) on the PWA.
- Principle of least privilege for services and DB users.

## Dependency & vulnerability management
- **Dependency scanning on every PR** (audit) + weekly scheduled scan; **critical/high vulns block release** (gate in [CI_CD.md](../03-engineering/CI_CD.md)).
- Secret scanning in CI (block on detected secrets).
- Container image scanning on build.
- Patch cadence: critical within 48 h, high within 1 week (⚠️ confirm).

## Vulnerability disclosure
- Publish a **`security.txt`** and a `security@speakyield.in` contact.
- Responsible-disclosure policy: acknowledge within 3 business days, no legal action against good-faith researchers, coordinated fix + credit.
- Track reports privately; feed fixes through the normal release + postmortem process.

## Backups & recovery security
- Backups encrypted, India-resident, access-controlled; restore drills quarterly (see [INFRASTRUCTURE.md](../04-infra/INFRASTRUCTURE.md)).

## Open confirmations
- KYC transaction thresholds for unverified business accounts.
- Patch SLAs and pen-test cadence (recommend a pre-launch review before pilot handles real money).
