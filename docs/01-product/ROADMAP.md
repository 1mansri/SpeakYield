# ROADMAP — Speak Yield

> **Status:** Draft, idea stage. Maps the deck's 5-step plan (Validate → Build MVP → Pilot & Test → Improve & Scale → Expand Impact) and Business-Model scaling (District → State → National) into phased engineering scope.

---

## Current position

Idea & prototype-planning stage. No external funding raised; solo founder. Deck describes a field pilot ambition in **Kharagpur, West Bengal (15 km radius)**. This roadmap assumes the immediate goal is a **working MVP for that pilot**.

---

## v1 — MVP for the Kharagpur pilot (District)

**Goal:** prove that real farmers can complete real buy/sell transactions end-to-end by voice in Hindi/Bengali.

**In scope**
- Voice pipeline: STT (Hindi/Bengali) → LLM intent/entity extraction → **read-back + explicit confirm**.
- Core flows: buy inputs, sell produce, browse/match listings (hyperlocal, location-aware).
- Marketplace matching within pilot radius.
- Hyperlocal logistics: delivery-partner job offer/accept, status updates.
- Payments: UPI via **Razorpay** with itemised breakdown + GST invoice.
- Auth: phone + OTP; **KYC gate** for business accounts before at-volume transacting/payouts.
- Channels: **PWA** (primary) + basic **WhatsApp** flow. IVR = stretch.
- Admin/ops console: onboarding, verification, moderation, disputes, pilot metrics.
- Languages: **Hindi, Bengali**.

**Success criteria:** completed end-to-end transactions by real users; measured intent accuracy; validated willingness to pay take rate.

---

## v2 — Improve & Scale (State: West Bengal + adjacent)

**Goal:** harden, broaden coverage, add ecosystem depth.

- **IVR** channel fully productionised (reach farmers without smartphones).
- **Odia** language (Odisha expansion prep).
- Ads & promoted listings revenue stream (dealers/brands).
- Premium business accounts.
- Ratings/reputation, dispute automation.
- Delivery network scaling: partner incentives, routing, live tracking.
- Analytics for input brands/suppliers (input-margin revenue stream).
- Improved offline sync + resilience.

---

## v3 — Expand Impact (National-ready ecosystem)

**Goal:** ecosystem services and multi-state scale.

- Ecosystem services: **credit, insurance, advisory** via fintech/insurance partners (KYC infra already in place).
- More languages / dialects; dialect adaptation of STT/LLM.
- Larger geographies (Jharkhand + beyond), multi-region readiness.
- Consider **fully autonomous voice-to-payment** for trusted, repeat, low-value transactions (only after intent accuracy and fraud controls proven).
- Native mobile apps if PWA hits limits.
- Local aggregator / field-partner tooling at scale.

---

## Not doing yet (explicit)

These are deliberately deferred to avoid scope creep and compliance/architecture risk before validation:

- ❌ **Fully autonomous voice-to-payment** (v1 always confirms first).
- ❌ **Credit / insurance / advisory products** (v3 ecosystem phase; heavy regulatory lift).
- ❌ **National / multi-state rollout** (pilot district first).
- ❌ **Native iOS/Android apps** (PWA-first).
- ❌ **On-shore/self-hosted STT/LLM models** (using OpenAI/Gemini/Deepgram with documented cross-border flow + consent for now — revisit if DPDP rules or scale demand it).
- ❌ **Languages beyond Hindi/Bengali** in v1 (Odia in v2).
- ❌ **Self-operated logistics fleet** (gig delivery-partner network only).
