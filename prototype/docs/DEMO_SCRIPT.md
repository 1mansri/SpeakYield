# Demo script — finals

> **The one thing this script is designed to prevent:** the jury filing Speak Yield under
> "AI chatbot" in the first five seconds. The market leads. Voice enters at step 3.
>
> Never say "assistant", "chatbot", "AI", or "it understands you" in the first minute. Say
> **market**, **buyers**, **rate**, **deal**.

---

## Before you start (5 min)

| # | Check | Command / action |
|---|---|---|
| 1 | Backend up, seeded | `uv run --env-file .env uvicorn app.main:app --reload --port 8000` → log shows `SEED: 4 demo deals` |
| 2 | Frontend up | `npm run dev` in `frontend/` |
| 3 | Rates load | Open the app; the rate board and demand cards must render before you present |
| 4 | Mic permission granted | Speak once into the mic screen and let it complete — grant the browser prompt **now**, not on stage |
| 5 | Venue network is dodgy? | Restart the backend with `VOICE_FALLBACK=1` (see below) |
| 6 | Backup video ready | Recorded run of the full flow, on the desktop, one click from playing |
| 7 | Log in as | `farmer1` / `farmer123` (Ramesh Kumar, Hindi) |

**Zoom the browser to ~125%** and use a narrow window (the app is built for a 480px phone
column — a maximised desktop window makes it look like an unfinished web page).

---

## The 90-second run

### 1. Open on the market — say nothing about voice yet *(15s)*

> *"This is Speak Yield. It's a marketplace — this is what a farmer in Kharagpur sees when
> they open it."*

Point at, in this order:
- **the rate board** — "today's rates: tomato ₹22, up ₹2 from yesterday";
- **the demand cards** — "three buyers are taking tomato right now, ₹21 to ₹25";
- **the active deal + earnings** — "he's got 40kg of potato in transit, and he's earned
  ₹3,410 this month."

> **Why this matters:** by now the jury has seen inventory, counterparties, money and
> history. Those four things are what a chatbot doesn't have. The category is decided here.

### 2. Name the problem the market solves *(10s)*

> *"Look at the spread — ₹19 to ₹25 for the same tomatoes. A farmer selling through an
> intermediary has no idea that gap exists. 70% of India's produce moves that way."*

### 3. Now introduce voice — as the way in, not as the product *(20s)*

> *"He can't type, and he doesn't read English. So he just says it."*

Tap the mic. Speak clearly in Hindi:

> **"पचास किलो टमाटर बेचना है"** *(I want to sell 50 kg of tomatoes)*

Deliberately **do not say a price.** That sets up step 5.

### 4. The slip *(15s)*

> *"It comes back as a parchi — the same slip he'd get at the mandi. Item, quantity, rate,
> place, and a slip number. Note the stamp: nothing has committed yet. It reads it back to
> him aloud, because he can't read it."*

Let the read-back play. Then confirm — **by voice** if the room is quiet ("हाँ"), by button
if it isn't.

### 5. Price discovery — the payoff *(20s)*

> *"He didn't say a price. So the market tells him what it's paying."*

Point at:
- **"3 खरीदार आपकी फ़सल पर बोली लगा रहे हैं"** — "three buyers competing for this crop";
- **the spread bar** — "₹19 to ₹25, and here's the local mandi rate";
- **"+₹3 मंडी भाव से ज़्यादा"** on the best offer — **"that's ₹150 more on this one load,
  for a farmer whose margin is a few hundred rupees."**

Pick the best-price buyer.

### 6. The other side of the market — the moment that lands *(15s)*

On the match screen, tap **"खरीदार का फ़ोन देखें"**.

> *"And this is the same order, on the buyer's phone. Ramesh Traders sees the offer, the
> quantity, the distance, the total. He accepts."*

Tap accept, then go back.

> **This is the single most important beat in the demo.** An assistant cannot show you the
> other side, because there isn't one. If you only have 30 seconds with a judge, show them
> the market screen and this screen.

### 7. Settle and close the loop *(15s)*

Proceed → settlement.

> *"Fees itemised, net amount, settled over UPI, GST invoice on WhatsApp, deal number. The
> delivery partner is assigned and the status moves live."*

Then tap **मेरे सौदे**:

> *"And it's in his record. The earnings went up. Next week he opens the app and it's all
> still here."*

---

## Anticipated questions

**"So it's an AI assistant?"**
> "Voice is how he gets in — he's not literate in English and can't type. The product is the
> two-sided market: buyers, dealers, delivery partners, price discovery, settlement. The
> speech layer is Sarvam's; the marketplace is ours."

**"What's actually built vs. mocked?"**
> Be straight about this — it's a prototype and honesty reads well. Real: Sarvam STT
> (Saaras), intent extraction (structured JSON via `sarvam-30b`), TTS (Bulbul), the matching
> and ranking, price discovery, order state. Mocked: payments, KYC, the buyer/dealer catalog
> (fixed JSON), and login. **Do not claim traction you don't have** — that's in VISION.md as
> a founder commitment, and juries check.

**"Why not WhatsApp / IVR?"**
> "Both are one-to-one messaging channels. Neither gives you a price board, a ranked set of
> competing buyers, or a settled order with an invoice. We may well use WhatsApp as a
> notification channel — it isn't the marketplace."

**"How accurate is the speech in dialect?"**
> Don't oversell. "Sarvam handles Hindi and Bengali well in our testing; dialect and noise
> are exactly what the Kharagpur pilot is designed to measure. That's why every screen
> confirms before anything commits, and why every voice action has a button fallback."

**"What if it mishears?"**
> Show it: the slip is editable via retry, low-confidence transcripts raise a warning, and
> **nothing commits without confirmation**. Then say: "the read-back exists because the
> farmer can't read the screen."

---

## If something breaks

| Failure | Do this |
|---|---|
| Mic permission blocked | Use the on-screen buttons — every decision screen has them. Say: "voice and touch are equal paths, by design." |
| Sarvam call fails / no network | Restart backend with `VOICE_FALLBACK=1`; the flow completes on canned responses. **Say so if asked** — don't present the fallback as live recognition. |
| Frontend won't load | Play the backup video. Keep talking over it; the narrative above works unchanged. |
| Backend won't start | `uv run --env-file .env uvicorn app.main:app --port 8000`. If `uv run` fails with a build error, `python -m uvicorn app.main:app --port 8000 --env-file .env`. |

### Enabling the safety net

```powershell
$env:VOICE_FALLBACK = "1"
uv run --env-file .env uvicorn app.main:app --port 8000
```

Off by default on purpose — it must never mask a genuine failure while you're testing. Turn
it on **only** when presenting, and be honest that it's on if a judge asks whether the
recognition was live.

---

## What to cut if you're over time

Drop in this order — **never cut steps 1 or 6**:
1. Step 7's settlement detail (just say "settles over UPI, invoice on WhatsApp").
2. Step 2's problem framing (the spread bar in step 5 makes the point visually anyway).
3. The review/rating screen.
