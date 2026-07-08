# DECISIONS — consequential & hard-to-reverse

> Step-3 deliverable. These are the calls baked into the whole `/docs` structure. **Confirm or override before building** — reversing them later is costly. The first four you already confirmed; the rest are strong defaults I chose and flagged.

## Confirmed by founder (2026-07-08)
| # | Decision | Chosen | Reversal cost |
|---|---|---|---|
| 1 | **Tenancy model** | Single shared marketplace; role-based; FPO/dealer as optional `orgId` grouping (no data isolation). | High — reshapes data model + every query. |
| 2 | **Auth** | Phone + OTP for all; **KYC-gated** business accounts before at-volume transacting/payouts. | High — auth touches everything. |
| 3 | **v1 voice scope** | Voice-assisted with **explicit confirm** (tap/spoken) before pay/commit; Razorpay = payment authority. Full autonomy deferred. | Medium — changes flow + PCI exposure. |
| 4 | **Data residency** | AWS **ap-south-1 (Mumbai)**, all primary data in India; cross-border STT/LLM **with consent + disclosure**. | Very high — migration + legal. |

## Defaulted by me — please confirm or override
| # | Decision | Default chosen | Why / alternative |
|---|---|---|---|
| 5 | **Architecture shape** | Modular **monolith** (`api`) + separate async **worker**. | Fits solo founder/pilot; microservices deferred. Override if you expect a bigger team immediately. |
| 6 | **Backend language** | **Node.js + TypeScript** (shares types with Next.js). | Deck fixes Next.js/Mongo but not backend lang. Alt: Python (better ML ergonomics). |
| 7 | **PCI posture** | Razorpay **hosted checkout → SAQ-A** (no card data on our servers). | Lowest scope. Override only if you want custom in-app payment UX (raises PCI burden). |
| 8 | **Channel priority** | **PWA first**, WhatsApp basic in v1, **IVR in v2**. | Deck lists all three; IVR has telephony/DLT lead time. Confirm if IVR must be in v1. |
| 9 | **Languages** | **Hindi + Bengali** v1; **Odia** v2. | Matches pilot (WB) → Odisha expansion. Confirm launch languages. |
| 10 | **KYC thresholds** | Unverified business accounts capped at low daily value/count; payouts blocked until verified (exact numbers TBD). | Needs your risk appetite + ops input. |
| 11 | **Money storage** | Integer **paise**, no floats. | Standard; flagged for convention sign-off. |
| 12 | **Retention periods** | Short audio (~30d), 8y for tax/payment records, 30d backups (all ⚠️). | Must be confirmed with counsel/tax advisor — see [DATA_RETENTION.md](./05-security-legal/DATA_RETENTION.md). |
| 13 | **SLO/scale numbers** | Voice p90 ≤ 4s, ~500 concurrent pilot, 99.5% uptime (all ⚠️ reasoned, not from deck). | Sized for a district pilot; adjust to real ambition. |

## Pre-launch legal/compliance action items (from COMPLIANCE.md)
- Engage Indian counsel (DPDP + e-commerce + agri).
- GST + DLT registration (long lead time — start now).
- Sign DPAs with STT/LLM/payment/messaging providers.
- Appoint & publish Grievance / Data Protection Officer.
- Finalise consent flows (personal data + voice + cross-border) and the draft Privacy Policy & Terms.
