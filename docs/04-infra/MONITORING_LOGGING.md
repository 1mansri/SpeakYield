# MONITORING_LOGGING — Speak Yield

> **Status:** Draft, idea stage. What we log, what we alert on, tool choices, and the strict rule on PII.

---

## Principles
- **Observability from day one** — a voice + payments pilot fails silently without it.
- **Never log PII or voice content in plaintext.** (See PII rule below — this is a compliance requirement, not a preference.)
- Structured JSON logs, correlated by `requestId` / `voiceSessionId` / `orderId`.

## Tooling (assumed ⚠️)
| Concern | Tool |
|---|---|
| Metrics/dashboards | CloudWatch + Grafana (or Grafana Cloud) |
| Tracing | OpenTelemetry → collector |
| Error tracking | Sentry (or equivalent) |
| Logs | CloudWatch Logs (India region), structured JSON |
| Uptime/synthetic | External synthetic checks on core flows |
| Alerting/paging | PagerDuty/Opsgenie (or on-call phone rota at pilot scale) |

## What we log
- Request/response metadata (method, route, status, latency, `requestId`) — **no bodies with PII**.
- Voice sessions: `voiceSessionId`, language, provider, **intent/outcome and confidence** — **not** raw transcript or audio in logs (audio stored separately in S3 under retention rules).
- Order/payment lifecycle events (ids + status transitions + amounts) — no card/UPI credentials (we never hold them).
- Auth events (login attempt outcome, OTP throttle hits, KYC status changes) — phone **masked/hashed** in logs.
- Errors with stack traces (scrubbed of PII).
- `audit_logs` collection for security-relevant actions (see [DATABASE_SCHEMA.md](../02-architecture/DATABASE_SCHEMA.md)).

## PII / sensitive-data rule (mandatory)
- **No plaintext PII in logs**: phone numbers, names, addresses, exact geo, KYC details, transcripts, or audio must never appear in log lines.
- Phone numbers are **masked** (e.g. `+91XXXXXX4465`) or hashed for correlation.
- Voice audio + transcripts live only in their designated stores under retention/consent controls, never in general logs.
- Logs inherit the same **India residency** as other data.
- Access to logs is least-privilege and audited.

## Key metrics (golden signals + product)
- **Latency:** voice round-trip p50/p90, API p95, geo-query p95.
- **Traffic:** voice sessions/min, orders/min, active users.
- **Errors:** 5xx rate, failed payments, STT/LLM provider errors, webhook DLQ depth.
- **Saturation:** Fargate CPU/mem, Atlas CPU/replication lag, SQS queue depth, Redis memory.
- **Product/quality:** intent accuracy, **critical NLU error rate** (misheard qty/price), transaction success rate, provider spend per transaction, delivery SLA.

## Alert triggers (examples)
| Alert | Condition | Severity |
|---|---|---|
| Payments failing | payment failure rate > 5% for 5 min | SEV-1 |
| Voice down/slow | voice p90 > 8 s or STT/LLM error rate > 10% | SEV-2 |
| API errors | 5xx > 2% for 5 min | SEV-2 |
| Queue backing up | SQS age > 10 min / DLQ > 0 | SEV-2 |
| DB pressure | Atlas CPU > 80% 10 min or replication lag rising | SEV-2 |
| Auth abuse | OTP request spike / brute-force pattern | SEV-2 (security) |
| Residency/consent gap | voice processed without recorded consent flag | SEV-1 (compliance) |

Alerts route to on-call per [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md).

## Dashboards
- **Ops:** golden signals + queue/DB health.
- **Product/pilot:** transactions, intent accuracy, per-language performance, funnel (voice→draft→confirm→paid→delivered).
- **Cost/economics:** provider spend per transaction vs. contribution/order.
