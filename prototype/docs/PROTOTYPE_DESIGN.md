# PROTOTYPE DESIGN GUIDE — Speak Yield

> **Status:** Draft, prototype-stage. Written 2026-07-09. Companion to [PROTOTYPE.md](./PROTOTYPE.md).
> Scope: pages, wireframes, API routes, and visual design system for the hardcoded-data prototype only.

---

## 1. Design principles

1. **Voice-first, screen-second.** The mic button is the primary action on every screen that has one. Everything else supports it.
2. **Minimal text.** Short labels, no paragraphs. Meaning carried by icon + voice + large type, not blocks of copy — this is for low-literacy users.
3. **One thing at a time.** Each screen has a single primary action. No multi-column forms, no nested menus.
4. **Explicit confirm, always.** Never let a voice action commit without a visible/audible read-back + confirm step (matches the founder's non-negotiable product decision).
5. **Full responsive, mobile-first.** Designed at ~375px width first; tablet/desktop scale the same single-column flow up in a centered, max-width column — no reflowing into multi-column layouts. Farmers use phones; investors may view on a laptop.
6. **High contrast, large tap targets.** Outdoor sunlight glare + older users → minimum 44×44px tap targets, WCAG AA contrast minimum (aim AAA on primary actions).

## 2. Colour palette

**Strictly no purple, no blue, no blue/purple combinations.** Palette is warm and earthy — agriculture/harvest associations — built from green + amber + neutral cream, with terracotta reserved for errors only.

| Role | Colour | Hex | Notes |
|---|---|---|---|
| Primary (brand, headers, primary icons) | Leaf Green | `#2F6B3C` | Trust, growth, agriculture. |
| Primary — pressed/dark | Deep Green | `#234F2C` | Button pressed state. |
| Accent / CTA (mic button, Confirm) | Marigold Amber | `#E8871E` | High-visibility call to action; marigold is a deliberate, culturally resonant choice. |
| Accent — pressed/dark | Burnt Amber | `#C06E12` | Button pressed state. |
| Background | Warm Cream | `#FAF7F0` | Base page background, not pure white — reduces glare. |
| Surface / card | Off-white | `#FFFDF8` | Cards sit slightly lighter than background. |
| Text — primary | Warm Charcoal | `#262420` | Not pure black; softer on the eyes. |
| Text — secondary | Warm Grey | `#6B6558` | Captions, secondary labels. |
| Border / divider | Sand | `#E4DECF` | Subtle separators. |
| Error / alert | Terracotta | `#C1442E` | Failed transcription, retry prompts — used sparingly. |
| Success | same as Primary | `#2F6B3C` | Confirmed / matched / delivered states. |

Only three hue families in the entire UI (green, amber, neutral-cream/terracotta) — deliberately narrow, to stay minimal and to hard-avoid any blue or purple.

## 3. Typography

- **Font:** Noto Sans, paired with **Noto Sans Devanagari** (Hindi) and **Noto Sans Bengali** (Bengali) for script coverage — free, Google Fonts, reliable glyph support, visually consistent across scripts.
- **Base size:** 18px mobile minimum (larger than typical web default) — low-literacy and older users need bigger type; no text below 16px anywhere.
- **Weight:** Regular for body, Semibold/Bold for primary actions and headings only. No light/thin weights (poor legibility outdoors).

## 4. Icon set

**Lucide** icons (open-source, MIT licensed, consistent 2px-stroke minimal style, `lucide-react` package — tree-shakable, no extra cost).

| Icon | Used for |
|---|---|
| `mic` | Primary voice action button |
| `mic-off` / `square` | Stop recording |
| `check-circle` | Confirm action |
| `rotate-ccw` | Retry / re-record |
| `globe` | Language switcher |
| `arrow-left` | Back navigation |
| `wheat` | Sell-produce mode |
| `shopping-bag` | Buy-inputs mode |
| `map-pin` | Location display |
| `truck` | Delivery/match status |
| `indian-rupee` | Price / payment |
| `clock` | Order status / history |
| `alert-circle` | Error / low-confidence transcription warning |

No decorative icons — every icon on screen maps to a real action or piece of data.

## 5. Pages

Six core screens, one optional stretch screen. Numbers match the flow order.

| # | Page | Purpose |
|---|---|---|
| 1 | **Language & Welcome** | Pick Hindi / Bengali (English as a fallback for demo narration); single "Continue." |
| 2 | **Home** | Big central mic button; two small mode chips — Sell / Buy — as an optional hint (intent is also auto-detected from speech). |
| 3 | **Listening** | Full-screen recording state: waveform animation, live partial transcript, cancel. |
| 4 | **Confirm Draft** | Shows transcript + structured draft card (commodity, quantity, price, location); auto-plays spoken read-back; big Confirm + Retry buttons. |
| 5 | **Match Result** | Matched buyer/dealer card (name, distance, price/qty) + mock delivery-partner card; big "Confirm Payment" button. |
| 6 | **Order Status / Receipt** | Mock UPI payment success, itemised breakdown, simple vertical status stepper (Confirmed → Matched → Picked up → Delivered). |
| 7 *(stretch)* | **History** | Flat list of past demo listings/orders from this session. Build only if time remains. |

## 6. Wireframes (mobile-first, ~375px)

```
[1] Language & Welcome          [2] Home                        [3] Listening
┌───────────────────┐           ┌───────────────────┐           ┌───────────────────┐
│                    │           │  Speak Yield   🌐  │           │                    │
│     🌾 Speak       │           │                    │           │     ●))) ))) )))   │
│       Yield        │           │                    │           │   (waveform anim)  │
│                    │           │   [🌾 Sell] [🛍 Buy]│           │                    │
│  ┌───────────────┐ │           │                    │           │  "सुन रहा हूँ..."   │
│  │   हिंदी        │ │           │      ┌────┐        │           │   (Listening...)   │
│  └───────────────┘ │           │      │ 🎙 │        │           │                    │
│  ┌───────────────┐ │           │      └────┘        │           │  live partial text  │
│  │   বাংলা        │ │           │   Tap & speak      │           │  appears here...    │
│  └───────────────┘ │           │                    │           │                    │
│                    │           │                    │           │      [ Cancel ]     │
│    [ Continue ]    │           │                    │           │                    │
└───────────────────┘           └───────────────────┘           └───────────────────┘

[4] Confirm Draft                [5] Match Result                [6] Order Status
┌───────────────────┐           ┌───────────────────┐           ┌───────────────────┐
│ ←                  │           │ ←                  │           │ ←                  │
│  You said:         │           │  ✓ Matched!        │           │  ✓ Payment done    │
│  "50kg tomatoes    │           │ ┌────────────────┐ │           │                    │
│   at ₹20/kg"        │           │ │ 👤 Ramesh Traders│           │  ₹1,000 · Tomatoes │
│                    │           │ │ 📍 2.3 km        │           │  ─ platform fee ₹20 │
│ ┌────────────────┐ │           │ │ 🌾 50kg @ ₹20/kg │           │  ─ delivery ₹15     │
│ │ 🌾 Tomato        │ │           │ └────────────────┘ │           │  = ₹965 net         │
│ │ ⚖ 50 kg          │ │           │ ┌────────────────┐ │           │                    │
│ │ ₹ 20 / kg         │ │           │ │ 🚚 Delivery:     │ │           │  ● Confirmed        │
│ │ 📍 Kharagpur      │ │           │ │   Suresh (bike)  │ │           │  ● Matched          │
│ └────────────────┘ │           │ └────────────────┘ │           │  ○ Picked up         │
│  🔊 (read-back      │           │                    │           │  ○ Delivered         │
│      playing)       │           │  [Confirm Payment] │           │                    │
│  [↺ Retry] [✓ Confirm]│         │                    │           │    [ Done ]         │
└───────────────────┘           └───────────────────┘           └───────────────────┘
```

**Desktop/tablet:** identical single-column flow, centred in a max-width ~480px column with extra whitespace on either side. No layout restructuring — this is a voice-first, one-thing-at-a-time UI regardless of viewport, so there is nothing meaningful to add in the freed-up horizontal space.

## 7. Voice interaction states

```
Idle (Home) → Listening → Processing (STT + intent, spinner) → Confirm Draft
                  ↑                                                  │
                  └──────────────── Retry ──────────────────────────┘
                                                                      │
                                                                  Confirm
                                                                      ↓
                                                              Matching (spinner)
                                                                      ↓
                                                              Match Result → Confirm Payment
                                                                      ↓
                                                              Order Status / Receipt
```

Every async step (Processing, Matching, Confirm Payment) shows a lightweight spinner/skeleton, never a blank screen — low-bandwidth/slow-STT latency must never look broken.

## 8. API routes (FastAPI backend)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | Liveness/readiness check for Docker healthcheck. |
| `GET` | `/api/catalog` | Returns the fixed sample dataset (buyers, dealers, seed listings) — debug/inspection use. |
| `POST` | `/api/voice/transcribe` | Multipart audio upload → proxied to self-hosted Whisper → `{ transcript, language }`. |
| `POST` | `/api/voice/intent` | `{ transcript, language }` → OpenAI → structured `{ action: "sell"\|"buy", commodity, quantity, unit, price, location, confidence }`. |
| `POST` | `/api/voice/speak` | `{ text, language }` → OpenAI TTS → audio stream, used for the Confirm Draft read-back. |
| `POST` | `/api/listings` | Confirmed sell draft → match against fixed buyer dataset → creates mock listing + returns match + mock delivery partner. |
| `POST` | `/api/orders` | Confirmed buy draft → match against fixed dealer dataset → creates mock order + returns match + mock delivery partner. |
| `GET` | `/api/orders/{id}` / `GET` | `/api/listings/{id}` — status lookup for the Order Status screen (mock stepper progression, e.g. time-based simulation). |

Eight routes total — deliberately minimal REST surface, matching the six-screen flow with no unused endpoints. Full OpenAPI contract is auto-generated by FastAPI at `/docs` once the backend is running.
