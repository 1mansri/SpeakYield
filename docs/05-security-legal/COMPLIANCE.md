# COMPLIANCE — Speak Yield

> **Status:** Draft, idea stage. **Not legal advice** — requires review by an Indian lawyer before launch. States which regulations apply, which don't, and why, based on the confirmed target geography (India / Eastern India) and business model (marketplace + UPI payments + personal data + voice).

---

## Applicability summary
| Regulation | Applies? | Why |
|---|---|---|
| **DPDP Act 2023 (India)** | ✅ **Yes** | We process personal data (phone, name, location, **voice**) of individuals in India. Core obligation. |
| **IT Act 2000 + SPDI Rules 2011** | ✅ Yes | Baseline Indian data/security obligations until fully superseded by DPDP rules. |
| **PCI-DSS** | ✅ Yes (**minimised scope, SAQ-A**) | We accept payments, but via **Razorpay hosted checkout / UPI** — no card/UPI credentials touch our systems. |
| **RBI payment-data localization** | ✅ Yes | Payment data must be stored in India → drives ap-south-1 residency. Razorpay (RBI-regulated PA) handles rails. |
| **GST law (India)** | ✅ Yes | We earn commission/fees on India-billed transactions → GST registration + **GST-compliant invoicing**. |
| **DLT / TRAI commercial-comms rules** | ✅ Yes | Sending SMS/WhatsApp (OTP + notifications) requires DLT entity/template registration. |
| **Consumer Protection Act 2019 + e-commerce rules** | ✅ Likely | We operate a marketplace → transparency, grievance redressal, seller info obligations. |
| **Legal Metrology / agri-commerce norms** | ⚠️ Review | Selling produce/inputs by weight/measure may attract packaged-commodity/agri rules. Confirm with counsel. |
| **GDPR (EU)** | ❌ No | No EU users in scope (deck targets Bharat/India only). Revisit only if EU users are ever onboarded. |
| **CCPA/CPRA (US)** | ❌ No | No US/California users in scope. |

## DPDP Act 2023 — key obligations (primary)
- **Consent:** clear, specific, informed consent for collecting personal data and **voice recordings**, and **separately** for the **cross-border transfer** to STT/LLM providers (OpenAI/Gemini, Deepgram/Wispr). Record consent (`voice_sessions.consentCrossBorder`).
- **Notice:** plain-language notice (in the user's language) of what we collect and why.
- **Purpose limitation & minimisation:** collect only what's needed; use only for stated purposes.
- **Data-principal rights:** access, correction, erasure, grievance redressal — implement request handling (ties to [DATA_RETENTION.md](./DATA_RETENTION.md)).
- **Security safeguards:** encryption, access control, breach handling (see [SECURITY.md](./SECURITY.md)).
- **Breach notification:** notify the Data Protection Board + affected principals per DPDP timelines → any suspected breach is SEV-1 ([INCIDENT_RESPONSE.md](../04-infra/INCIDENT_RESPONSE.md)).
- **Children's data:** if any user may be a minor, verifiable-parental-consent rules apply — recommend restricting accounts to adults (18+) and stating so in Terms.
- **Grievance Officer:** appoint and publish a contact (India-based).

## Cross-border data flow (the notable exception)
- **Primary data stays in India** (ap-south-1). But **voice/text is sent abroad to STT/LLM providers** for processing.
- **v1 stance (confirmed):** permitted **with explicit, separate user consent + clear disclosure**, rather than self-hosting models.
- **Controls:** disclose provider categories in the Privacy Policy; consent captured before first voice use; DPAs signed with providers; minimise/transient-handle audio; revisit self-hosting/on-shore models if DPDP transfer rules tighten or scale justifies (deferred — see [ROADMAP.md](../01-product/ROADMAP.md)).

## Payments / PCI
- **SAQ-A** posture via Razorpay hosted checkout — document and keep evidence.
- Never store card/UPI credentials; only Razorpay references.
- Reconciliation + refund process documented; payout KYC via Razorpay.

## GST & invoicing
- Register for GST; issue **GST-compliant invoices** (GSTIN, HSN/SAC codes, tax breakup) for platform fees/commissions and applicable transactions. See `invoices` in [DATABASE_SCHEMA.md](../02-architecture/DATABASE_SCHEMA.md).
- Determine GST treatment of marketplace commission vs. facilitated sales with a tax advisor (marketplace/TCS provisions may apply).

## Marketplace / consumer obligations
- Transparent pricing (deck promises "no hidden charges") — show item price, platform fee, delivery fee before confirm.
- Grievance redressal mechanism + timelines.
- Seller identity/traceability for produce and inputs.

## Action items before launch (flag)
- [ ] Engage Indian counsel to review DPDP + e-commerce + agri obligations.
- [ ] Sign DPAs with STT/LLM/payment/messaging providers.
- [ ] Complete GST registration + DLT registration (long lead time).
- [ ] Appoint & publish Grievance Officer + Data Protection contact.
- [ ] Finalise consent flows (personal data + voice + cross-border).
- [ ] Confirm Legal Metrology / agri-trade applicability.
