# INCIDENT_RESPONSE — Speak Yield

> **Status:** Draft, idea stage. Right-sized for a solo/small team now, structured to grow. Money + personal data mean even a pilot needs a real process.

---

## Severity levels
| Sev | Definition | Examples | Response |
|---|---|---|---|
| **SEV-1** | Critical: money at risk, data breach, or full outage | Payments double-charging, personal-data exposure, API fully down, voice-without-consent processing | Immediate; all-hands; page now |
| **SEV-2** | Major: core function degraded, no data/money loss | Voice pipeline slow/erroring, matching down, high 5xx, queue backlog | Within 30 min |
| **SEV-3** | Minor: limited impact, workaround exists | One channel degraded (e.g. WhatsApp), non-critical bug | Next business day |
| **SEV-4** | Cosmetic / low | UI glitch, copy error | Backlog |

## Detection → paging
- Alerts from [MONITORING_LOGGING.md](./MONITORING_LOGGING.md) route to the on-call.
- **On-call at pilot stage:** founder-led rota (single/shared phone) with a documented escalation contact; move to PagerDuty/Opsgenie rotation as the team grows.
- **Any suspected personal-data breach is automatically SEV-1** and triggers the DPDP breach-notification clock (see [COMPLIANCE.md](../05-security-legal/COMPLIANCE.md)).

## Response workflow
1. **Acknowledge** the alert; declare severity.
2. **Assign an Incident Lead** (coordinates; at pilot scale usually the founder).
3. **Mitigate first** — stop the bleeding (e.g. disable a failing provider via feature flag, pause payouts, roll back deploy). Auto-rollback triggers on failed health checks.
4. **Communicate** — status to affected users where relevant (esp. payment issues); keep an internal incident timeline.
5. **Resolve & verify** — confirm metrics recovered.
6. **Postmortem** for SEV-1/SEV-2.

## Key mitigations available
- **Feature flags** to disable voice, IVR, ads, or a specific provider without a deploy.
- **Payment kill-switch** — pause new checkouts/payouts while investigating money issues.
- **Rollback** via CI/CD blue-green (see [CI_CD.md](../03-engineering/CI_CD.md)).
- **DR restore** per [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) (RPO ≤ 1 h, RTO ≤ 4 h).

## Postmortems
- **Blameless.** Focus on systems, not individuals ("Building for impact, not hype — no fake numbers" — founder value applies to honesty in retros too).
- Written within **3 business days** of a SEV-1/SEV-2.
- Contents: timeline, impact, root cause, what detected it, what went well/poorly, **action items with owners + dates**.
- Action items tracked to closure; recurring themes feed roadmap/hardening.

## Special playbooks (stubs to expand)
- **Payment incident:** reconcile with Razorpay, identify affected orders, refund/adjust, notify users.
- **Data-breach:** contain, assess scope, preserve evidence, DPDP notification, user comms.
- **Provider outage (STT/LLM):** fail over to alternate provider via provider interface; degrade gracefully (queue + retry).
