# VISION — Speak Yield

> **Status:** Draft for a pre-code, idea-stage project. Written 2026-07-08.
> **One-liner:** Make agricultural commerce as simple as having a conversation.

---

## The problem

India's smallholder farmers — **86% of whom own less than 2 hectares** (NABARD, 2021) — are locked out of digital commerce by the tools built for them, not by a lack of willingness. Today's agri apps are:

- **Text-heavy** and assume comfort with typing (only ~23% of rural farmers are "smartphone-savvy" — Dalberg, 2021).
- **English- or Hindi-first**, when 65–70% of farmers are more comfortable transacting by *voice in their regional language* (Digital India Report, MeitY, 2019).
- **Fragmented** — separate channels for buying inputs, selling produce, arranging logistics, and paying — leaving farmers dependent on intermediaries. 70% of farm produce in India is sold through intermediaries (ICAR, 2020).

Technology expects farmers to learn apps. Speak Yield inverts that: the platform adapts to how farmers already communicate.

## Target user

**Primary:** small & marginal farmers in Eastern India (pilot: Kharagpur & nearby districts, West Bengal), speaking **Hindi and Bengali**.

**Secondary (same marketplace):** agri-input retailers/dealers, buyers & traders (wholesalers, restaurants, institutions, households), FPOs, and last-mile delivery partners (local youth on bikes / e-rickshaws).

## Why now

- Agritech + rural commerce in India is projected at **$40–50B by 2030**, growing at 28–30% CAGR (RedSeer, 2021).
- Voice interfaces, low-cost STT, and capable multilingual LLMs have only recently become good enough to understand noisy, dialect-rich rural speech.
- Incumbents (DeHaat, Ninjacart, AgroStar, Cropin, Plantix) are app-first and text-heavy; **no major player is voice-first, multilingual, and unified across buy + sell + delivery** — a greenfield for low-literacy users who form the majority of India's farming community.

## What we're building

A **voice-first, local-language, unified agri-commerce marketplace**: the farmer speaks → AI understands intent → the system matches buyers/sellers, arranges hyperlocal delivery, and settles payment over UPI — with the farmer confirming before money moves.

## Definition of "done" for v1 (MVP)

v1 is done when, in the Kharagpur pilot area, a farmer can — **entirely by voice in Hindi or Bengali, on a low-bandwidth phone** — do all of the following, with an explicit confirm step before anything commits:

1. **Speak a request** ("Sell my 50 kg tomatoes for ₹20/kg" / "Order 5 L organic pesticide") and have it correctly transcribed and understood.
2. **See/hear the drafted order or listing read back**, and confirm it by tap or voice.
3. **Get matched** to a nearby buyer/seller or input dealer.
4. **Have a delivery partner assigned** for hyperlocal fulfilment.
5. **Pay or get paid via UPI (Razorpay)** with a transparent, itemised summary and a valid GST invoice where applicable.
6. **Track order status** and receive spoken/voice-note confirmations.

Success signals for the pilot: real transactions completed end-to-end by real farmers, measured intent-recognition accuracy in Hindi/Bengali, and validated willingness to pay the platform's take rate — with **no fake traction, no inflated numbers** (founder commitment).

## What we are explicitly *not* promising in v1

- Not fully autonomous voice-to-payment (v1 always confirms first).
- Not national coverage (pilot geography only).
- Not credit/insurance/advisory products (ecosystem services are a later phase).

See [ROADMAP.md](./ROADMAP.md) for phasing and [REQUIREMENTS.md](./REQUIREMENTS.md) for the detailed scope.
