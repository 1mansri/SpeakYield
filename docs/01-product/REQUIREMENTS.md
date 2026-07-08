# REQUIREMENTS — Speak Yield

> **Status:** Draft, idea stage. Requirements are derived from the product overview and pitch deck; scale/NFR numbers are **reasoned assumptions from the deck's ambitions and are flagged as such** — confirm before building.

---

## 1. Actors / roles

Single shared marketplace with role-based accounts (see [ARCHITECTURE.md](../02-architecture/ARCHITECTURE.md)):

| Role | Description |
|---|---|
| **Farmer** | Small/marginal farmer; buys inputs, sells produce. Phone + OTP auth. |
| **Buyer / Trader** | Wholesaler, restaurant, institution, household buying produce. |
| **Input Dealer / Retailer** | Sells agri-inputs (seeds, fertilizer, pesticide). |
| **Delivery Partner** | Local youth with bike/e-rickshaw; fulfils hyperlocal delivery, receives payouts. |
| **FPO** | Farmer Producer Organisation; an `organization` grouping multiple farmers. |
| **Admin / Ops** | Speak Yield field/ops team; onboarding, moderation, dispute handling. |

Business roles (Buyer, Dealer, Delivery Partner) must pass **KYC verification before transacting at volume** (see thresholds in [SECURITY.md](../05-security-legal/SECURITY.md)).

---

## 2. Functional requirements (user stories)

### Voice & language (the core differentiator)
- **FR-V1.** As a farmer, I can tap a single mic button and speak my request in Hindi or Bengali, so that I never have to type.
- **FR-V2.** As a farmer, my speech is transcribed accurately even in noisy, low-bandwidth conditions, so that the system understands me the first time.
- **FR-V3.** As a farmer, the system extracts intent + entities (action, commodity, quantity, price, location) from my speech and **reads the drafted action back to me** (on screen and as voice), so that I can catch errors before anything happens.
- **FR-V4.** As a farmer, I must **explicitly confirm by tap or spoken "yes"** before any order, listing, or payment commits, so that a misheard number never costs me money.
- **FR-V5.** As a farmer, I can switch language at any time, so that I use whichever regional language I'm comfortable in.
- **FR-V6.** As a farmer, I can complete key flows via **WhatsApp or IVR (voice call)** if I don't use the app, so that channel is never a barrier.

### Buying inputs
- **FR-B1.** As a farmer, I can say what input I want ("5 L organic pesticide") and see matching listings from nearby dealers with price and availability.
- **FR-B2.** As a farmer, I can place an input order and pay via UPI after confirming.
- **FR-B3.** As a dealer, I can list inputs with price, stock, and coverage radius, and receive/accept orders.

### Selling produce
- **FR-S1.** As a farmer, I can say "Sell my 50 kg tomatoes for ₹20/kg" and create a produce listing after confirmation.
- **FR-S2.** As a farmer, I'm matched to nearby buyers/traders interested in my produce.
- **FR-S3.** As a buyer, I can discover produce listings near me, filter by commodity, and place a purchase order.

### Matching & marketplace
- **FR-M1.** As a user, the system matches my buy/sell request to the nearest suitable counterparty (hyperlocal discovery, location-aware).
- **FR-M2.** As a user, I can browse/search listings by commodity, distance, and price.

### Logistics
- **FR-L1.** As a buyer/farmer, when an order is placed, a nearby delivery partner is offered the job.
- **FR-L2.** As a delivery partner, I receive job offers, accept/decline, and update status (picked up / delivered).
- **FR-L3.** As a user, I get real-time order + delivery status with voice/notification updates.

### Payments & billing
- **FR-P1.** As a user, I pay/receive via **UPI (Razorpay)** with a clear itemised breakdown (item price, platform take rate, delivery fee).
- **FR-P2.** As a user, I receive a **GST-compliant invoice** where applicable.
- **FR-P3.** As a delivery partner/dealer, I receive automated payouts to my verified account.

### Accounts, orders, notifications
- **FR-A1.** As a user, I sign up / log in with phone number + OTP.
- **FR-A2.** As a business user, I complete KYC to unlock at-volume transacting and payouts.
- **FR-A3.** As a user, I can view and manage my orders/listings (create, track, cancel per policy).
- **FR-A4.** As a user, I receive notifications (push/SMS/WhatsApp/voice) for key events.

### Admin
- **FR-AD1.** As ops, I can onboard/verify users, moderate listings, and resolve disputes.
- **FR-AD2.** As ops, I can view transactions and pilot metrics (transaction success, intent accuracy).

---

## 3. Non-functional requirements

> ⚠️ **Assumption flag:** The deck is idea/pilot stage with *illustrative* unit economics (AOV ₹500). Concrete SLOs below are **reasoned targets sized for a district pilot growing toward regional scale**, not numbers stated in the inputs. Confirm/adjust.

| Category | v1 (pilot) target | Rationale |
|---|---|---|
| **Uptime** | 99.5% monthly (app + API) | Pilot-appropriate; tighten to 99.9% at regional scale. |
| **Voice round-trip latency** | ≤ 4 s p90 from end-of-speech to spoken/visual draft | STT + LLM intent + match. Perceived responsiveness matters for low-literacy users. See [PERFORMANCE.md](../04-infra/PERFORMANCE.md). |
| **API latency (non-voice)** | p95 ≤ 300 ms for reads, ≤ 800 ms for writes | Standard marketplace budget. |
| **Concurrency** | ~500 concurrent active users, ~5k daily transactions at pilot peak (assumption) | Sized above Kharagpur 15 km pilot with headroom. |
| **Low bandwidth** | Usable on 2G/3G; audio uploaded in compressed chunks; **offline-capable PWA that syncs when online** | Explicitly required by deck ("Works in Low Internet", "syncs when online"). |
| **Data residency** | All user + payment data stored in **India (AWS ap-south-1)** | DPDP Act 2023 + RBI localization. See [COMPLIANCE.md](../05-security-legal/COMPLIANCE.md). |
| **Accessibility** | Voice-first, large tap targets, minimal text, icon + audio labels | Core to serving low-literacy users. |
| **Localization** | Hindi + Bengali at launch; architecture supports adding Odia (Odisha expansion) | Deck target geography. |
| **Payment security** | PCI-DSS scope minimised via Razorpay hosted checkout (SAQ-A) | No card data touches our servers. See [COMPLIANCE.md](../05-security-legal/COMPLIANCE.md). |
| **Durability (RPO/RTO)** | RPO ≤ 1 h, RTO ≤ 4 h at pilot | See [INFRASTRUCTURE.md](../04-infra/INFRASTRUCTURE.md). |

---

## 4. Out of scope for v1

See [ROADMAP.md](./ROADMAP.md#not-doing-yet). Notably: fully autonomous voice-to-payment, credit/insurance/advisory, national coverage, native iOS/Android apps (PWA first).
