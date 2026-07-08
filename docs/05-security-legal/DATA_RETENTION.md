# DATA_RETENTION — Speak Yield

> **Status:** Draft, idea stage. **Not legal advice** — retention periods are reasoned defaults (⚠️) to be confirmed with counsel against DPDP, RBI, and GST record-keeping rules. All data India-resident.

---

## Principles
- **Minimise & expire:** keep data only as long as there's a purpose or legal duty; auto-expire the rest.
- **Voice is sensitive:** default to short retention for raw audio.
- **Deletion is end-to-end:** a delete must also purge backups on their cycle, not just the live record.

## Retention schedule (proposed ⚠️)
| Data | Retention | Rationale |
|---|---|---|
| **Raw voice audio** (S3) | **Short — e.g. 30 days**, then auto-delete (or delete immediately after successful transcription unless user opts into retention for quality) | Minimise sensitive-data exposure; lifecycle rule enforces. |
| **Transcripts / intents** (`voice_sessions`) | 12 months (analytics/quality), then anonymise | Improve NLU while limiting PII lifetime. |
| **Account/profile** (`users`) | Life of account + 30–90 days after deletion request | Allow recovery window, then purge. |
| **KYC records** | Per RBI/KYC rules (commonly multi-year after relationship ends) — **confirm exact period** | Regulatory record-keeping via/with Razorpay. |
| **Orders & payments** | **8 years** | Aligns with Indian tax/accounting record-keeping (GST/Companies Act) — confirm. |
| **GST invoices** | **8 years** | Statutory. |
| **Notifications** | 90 days | Operational only. |
| **Application logs** | 30–90 days | Ops/debugging; **no plaintext PII** ([MONITORING_LOGGING.md](../04-infra/MONITORING_LOGGING.md)). |
| **Audit logs** (security) | 1–2 years | Investigations/compliance. |
| **Backups (Atlas/S3)** | 30 days rolling | DR window; deletions propagate on this cycle. |

## User-initiated deletion (DPDP right to erasure)
End-to-end process:
1. **Request** via app/WhatsApp/grievance channel; verify identity (phone OTP).
2. **Ticket + clock** — log the request; DPDP timeline starts.
3. **Live purge/anonymise** — remove/anonymise personal data in `users`, `voice_sessions`, `notifications`, and personal fields; audio deleted immediately if still present.
4. **Retain lawful-basis data** — orders/payments/invoices/KYC kept for the **statutory minimum** (tax, RBI) in a form dissociated from marketing use, with the reason recorded and communicated to the user.
5. **Backup purge** — flag records so they are **not restored** on recovery and are purged when the ≤30-day backup cycle rotates; confirm completion.
6. **Confirm** completion to the user; close ticket with audit trail.

## Anonymisation
Where full deletion conflicts with legal retention, **anonymise** (strip direct identifiers, keep aggregate/transaction facts) so analytics and statutory records survive without identifying the person.

## Automation
- S3 **lifecycle rules** for audio + logs.
- MongoDB **TTL indexes** for expiring listings, notifications, and audit logs.
- Scheduled anonymisation job for aged transcripts.
- Deletion-request workflow with backup-purge verification.

## Open confirmations
- Exact statutory periods (KYC, tax records) with counsel/tax advisor.
- Whether to offer opt-in longer audio retention for NLU improvement (needs its own consent).
