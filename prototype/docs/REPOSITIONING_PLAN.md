# Repositioning Plan — from "voice chatbot" to "voice-first mandi"

> **Why this exists.** At the last round, the jury read the prototype as an AI chat assistant.
> This plan changes what the prototype *reads as*, without changing what it *is*.
>
> **Thesis:** the jury was reading the screen correctly. Today the app shows a conversation,
> not a market. The marketplace logic already exists in the backend (priced/rated competing
> buyers, price spread, ranking, delivery assignment, order stepper) — it is simply never on
> screen until four screens deep, and it never persists. Fix the surface and the framing.
>
> **One rule for every decision below:** *a chatbot has no inventory, no counterparties, no
> money, and no memory.* Every change here adds one of those four to the screen.

---

## 1. The chatbot tells, itemised

These are the specific things that produced the misread. Each has a fix in the phases below.

| # | Tell | Where | Fix |
|---|------|-------|-----|
| T1 | Big mic alone on an empty canvas — the Siri/Assistant signature | `screens/HomeScreen.tsx` | Phase A2 |
| T2 | No persistent state; every run resets to nothing | `app/page.tsx` `resetToHome()` | Phase B |
| T3 | `"You said: …"` — quoting the user's utterance back | `screens/ConfirmDraftScreen.tsx` | Phase A3 |
| T4 | Strict turn-taking, one question per screen | `app/page.tsx` state machine | Phase A2, D |
| T5 | First-person AI persona: "सुन रहा हूँ", "समझ रहा हूँ", "Understanding what you said…" | `lib/copy.ts`, `LoadingScreen` | Phase D2 |
| T6 | No nav/tab bar/brand shell — bare centered column | `components/Layout.tsx` | Phase A1 |
| T7 | Counterparties invisible until deep in the flow | flow order | Phase A2, C |
| T8 | No imagery — pure text + icons reads as chat | all screens | Phase E1 |
| T9 | No money object — no wallet, earnings, invoice, order no. | — | Phase B3, E2 |
| T10 | Single-sided: only the farmer's device ever exists | — | Phase C1 |

---

## 2. Phases

Ordered by **perception-change per hour of work**. Phases A and B alone flip the reading;
C is the phase that wins the round. Cut from the bottom if time is short.

### Phase A — Make the first screen a market (highest impact, ~1 day)

**A1. Persistent app shell.** Replace the bare column in `Layout.tsx` with:
- a top bar: brand mark + a **location chip** ("खड़गपुर · मेदिनीपुर मंडी") + language globe;
- a **bottom tab bar**: `बाज़ार` (Market) · `मेरे सौदे` (My Deals) · `भाव` (Rates) · `मैं` (Profile).

A tab bar is the cheapest, strongest anti-chatbot signal that exists. Chat products do not
have them. This alone changes the category assignment in the first second.
Keep the flow screens full-bleed (they push over the shell), so the transaction still feels focused.

**A2. Home becomes a market dashboard, not a mic.** New `MarketScreen` replacing `HomeScreen`:
- **Live rates strip** at top: `टमाटर ₹22/kg ▲2` `आलू ₹18 ▼1` `प्याज़ ₹24 ▲3` — horizontally
  scrollable, derived from `catalog.json` `price_min`/`price_max` with a seeded daily delta.
- **Demand cards**: *"आपके पास 4 खरीदार टमाटर ले रहे हैं — ₹19 से ₹25"* built from
  `matching.build_options`. This is the moment a juror sees a two-sided market.
- **Active deal card** if one is running, with the live stepper inline.
- **Mic as a docked FAB** over the dashboard — prominent, but *over content*, not instead of it.
  Voice is now visibly a shortcut across a market, not the market itself.

**A3. Reframe Confirm as a document, not a reply.** In `ConfirmDraftScreen`:
- Delete the `"आपने कहा: …"` block as the hero. Demote the transcript to a small grey
  `सुना: "…"` line with a pencil/edit affordance beside it.
- Promote the draft card into a **mandi parchi / order slip**: bordered receipt styling, a
  slip number (`#SY-2481`), commodity · quantity · rate · location as labelled rows, a dotted
  tear-line, and an "अभी पक्का नहीं हुआ" (not yet committed) stamp.
- Keep the TTS read-back — read-back is a *literacy* feature, not a chat feature. Just label it
  "पर्ची पढ़कर सुनाई जा रही है" rather than as the assistant talking.

### Phase B — Give the market memory (~1 day)

**B1. Backend: per-user records + listing endpoints.** `store.py` already holds `RECORDS`.
- Add `user_id` to records; add `GET /api/listings?user=` and `GET /api/orders?user=`.
- **Seed 3–4 historical deals** for the demo user at startup (two delivered, one in transit,
  one open listing awaiting a buyer). The app must never open empty — an empty app looks
  like a fresh chat thread.

**B2. "मेरे सौदे" tab.** Live + past deals, each a card with commodity, counterparty, amount,
status chip, date. Tapping a live one opens the existing `OrderStatusScreen`.

**B3. Money as an object.** A wallet/earnings summary on Profile and a compact strip on Market:
*"इस महीने ₹12,400 कमाए · 3 सौदे"*. Add an order number and a "UPI से निपटान" line to the
settlement card. Chatbots have no ledger.

**B4. Fix the reset.** `resetToHome()` should land on **Market with the new deal now visible
in My Deals and in the earnings total** — never wipe. The demo's emotional beat is
"I spoke, and now the marketplace holds my deal."

### Phase C — Prove it is two-sided (the round-winner, ~0.5–1 day)

**C1. A counterparty view.** A demo-only toggle (long-press the brand mark, or a Profile switch)
that shows **the same deal from the buyer's phone** — "Ramesh Traders: नई पेशकश — 50kg टमाटर
@ ₹22, 2.3km" with accept/decline — and optionally the **delivery partner's pickup screen**.
Even as two static screens fed by the same record, this is the single most convincing artefact
you can put in front of a jury: it demonstrates a *network*, which an assistant cannot be.
Say the words out loud in the demo: "this is the same order, on the buyer's phone."

**C2. Make price discovery legible on `OptionsScreen`.** The ranking logic already computes
`best_price` / `nearest` / `top_rated` in `matching._pros_tags`. Add above the list:
- a **spread bar**: `₹19 ——●—— ₹25`, marking where the selected offer sits;
- a line: *"4 खरीदार आपकी फ़सल पर बोली लगा रहे हैं"*;
- a **delta vs. local mandi rate**: *"मंडी भाव से ₹3/kg ज़्यादा"* — the concrete farmer benefit,
  and the strongest business-model slide you have.

### Phase D — Reposition voice as a control layer (~0.5 day)

**D1. Voice navigates the marketplace, not just the flow.** Extend `/api/voice/command`
intents with `show_deals`, `show_rates`, `check_price`, `repeat`. Then from Market, the farmer
can say *"मेरे सौदे दिखाओ"* or *"आज टमाटर का भाव क्या है"* and the **app navigates**. This is
the decisive reframe: voice drives an application, rather than being one.

**D2. Delete the assistant persona from all copy.** In `lib/copy.ts` and `LoadingScreen`:
- `"सुन रहा हूँ..."` → `"बोलिए"` (speak) — remove the first-person AI.
- `"समझ रहा हूँ..."` → `"रिकॉर्ड हो रहा है"`.
- `"Understanding what you said..."` → `"आपकी पर्ची बन रही है"` (preparing your slip).
- `"Finding your options..."` → `"खरीदार खोजे जा रहे हैं"` (finding buyers).
Same for Bengali/English. Small diff, large effect: the system should describe *market actions
in progress*, never its own cognition.

### Phase E — UI/UX craft (~1 day)

**E1. Imagery.** Commodity thumbnails (tomato, potato, rice, urea sack) on rate chips, draft
slips and deal cards. Text-and-icons-only reads as chat; product imagery reads as commerce.
Use flat illustrations or photos — avoid anything that looks like an AI avatar.

**E2. Trust and paperwork chrome.** Verified-buyer badge, ratings already present, order/slip
numbers, "GST चालान" line on the settlement card, weight/grading note. Rural commerce trust
is built on paper — make the UI look like paper that the phone fills in for you.

**E3. Numerals and density.** Rupee-forward typography (large tabular numerals for money),
▲▼ deltas in success/error colours, tighter information density on cards. The present spacing
is airy in a way that reads "conversational"; a mandi board is dense.

**E4. Motion with meaning.** Ticker on the rates strip, animated stepper transitions, a coin/
receipt beat on settlement. Avoid typing-dot or chat-bubble animations anywhere, ever.

**E5. Keep the palette.** The green/amber system in `globals.css` is right — agrarian, no
blue/purple. Don't touch it; it is not part of the problem.

### Phase F — Demo dramaturgy (~0.5 day, do not skip)

**F1. Seeded demo state** so the very first frame shows rates, an in-transit deal, and earnings.
The category is decided in the first five seconds, before you say a word.

**F2. Rewrite the demo script** so the *market* leads and voice is the shortcut:
1. Open on the market dashboard — rates, demand, active deal. *(2–3 buyers visible)*
2. "Four buyers want tomato today at ₹19–25." — point at the spread.
3. *Then* tap the mic and speak the listing.
4. Slip appears → confirm → offers with spread bar and mandi delta.
5. **Flip to the buyer's phone** — same order, other side. *(Phase C1)*
6. Settlement, invoice, earnings total updates in My Deals.

**F3. Fallbacks.** Record a backup screen capture, and add an offline/mock mode in case the
venue's network or mic permission fails. A live Sarvam call on venue wifi is a real risk.

---

## 3. Suggested order of work

If everything gets done: **A → B → C → D → E → F.**

If time is short, this is the cut line:
- **Must have (flips the reading):** A1, A2, A3, B1, B2, B4, D2, F1, F2.
- **Wins the round:** C1, C2.
- **Polish:** D1, B3, E1–E4, F3.

Do **not** start with E. Visual polish on a chatbot-shaped app is still a chatbot.

---

## 4. Files this touches

| Area | Files |
|---|---|
| Shell / nav | `components/Layout.tsx` *(new: `AppShell.tsx`, `TabBar.tsx`)* |
| Market home | *(new)* `screens/MarketScreen.tsx`, `components/RatesStrip.tsx`, `components/DemandCard.tsx`; retire `HomeScreen.tsx` |
| Deals | *(new)* `screens/MyDealsScreen.tsx`, `components/DealCard.tsx` |
| Slip reframe | `screens/ConfirmDraftScreen.tsx`, *(new)* `components/OrderSlip.tsx` |
| Price discovery | `screens/OptionsScreen.tsx`, *(new)* `components/SpreadBar.tsx` |
| Counterparty view | *(new)* `screens/BuyerInboxScreen.tsx`, `screens/PartnerPickupScreen.tsx` |
| Copy | `lib/copy.ts`, `screens/LoadingScreen.tsx` |
| Routing/state | `app/page.tsx` (add tab state alongside the flow state machine) |
| Backend | `app/store.py`, `app/routers/listings.py`, `app/routers/orders.py`, `app/data/catalog.json` *(rates + seed deals)*, `app/prompts.py` *(nav intents)* |
| Tests | `e2e/happy-path.spec.ts` (update for the new shell) |

---

## 5. Status — all six blocks shipped (2026-08-06)

Blocks 1–6 are built, and every gate passed: `tsc`, `eslint --max-warnings=0`, `next build`,
`ruff check`, 10 backend pytest, and the Playwright happy path (rewritten for the new shell).

| Block | Shipped |
|---|---|
| 1 | `AppShell` + 4-tab bar; `MarketScreen` (rate board, demand cards, docked mic FAB); `GET /api/market`; `RatesScreen`, `ProfileScreen`; browse-to-trade via demand cards; `HomeScreen` deleted |
| 2 | `user_id` on records; seeded 4-deal history per demo farmer; `GET /api/deals?user=`; `DealsScreen` + `DealCard`; earnings; `resetToHome` no longer wipes |
| 3 | `OrderSlip` (parchi with slip no., tear-line, "not committed" stamp); transcript demoted to a grey line; all first-person AI copy replaced in hi/bn/en |
| 4 | `mandi_price` on options responses; `SpreadBar` + per-offer mandi delta; liquidity headline; `CounterpartyScreen` — the same deal on the buyer's phone |
| 5 | `commodityEmoji` imagery across slip/deals/settlement; verified badges; deal no., UPI + GST lines; tabular numerals; connected fulfilment rail |
| 6 | `VOICE_FALLBACK` demo safety net across STT/intent/command/TTS; e2e rewritten; `DEMO_SCRIPT.md` |

**Deviations from the plan below:** deals are served from one `/api/deals` endpoint rather
than `listings?user=` + `orders?user=` (the farmer thinks "my deals", not "which collection");
the counterparty view covers buyers *and* dealers, so no separate delivery-partner screen.

**Deliberately not built:** D1 voice navigation, the B3 wallet screen, E4 settlement motion —
see the cut list below.

---

## 6. Two-day execution schedule (finals: 2026-08-08)

Two working days. The phases above are rescoped into six blocks with a hard cut line.
**Rule: no block starts until the previous one runs.** A half-finished dashboard is worse
than none — it reads as a broken chatbot.

### Day 1 — build the frame, then give it memory

| Block | ~Time | Work | Ships |
|---|---|---|---|
| **1** | 3h | **A1 + A2.** `AppShell` (top bar with location chip + bottom tab bar), `MarketScreen` with live rates strip, demand cards, mic FAB. Backend `GET /api/market/rates` + `/demand`. Retire `HomeScreen`. | The app stops looking like a chatbot on open. |
| **2** | 3h | **B1 + B2 + B4.** `user_id` on records, seeded deal history, `GET /api/listings?user=` / `orders?user=`, `MyDealsScreen`, earnings total, `resetToHome` lands on Market with the new deal visible. | The app has inventory and memory. |
| **3** | 2h | **A3 + D2.** Confirm reframed as an `OrderSlip` (slip no., receipt styling, transcript demoted to a grey "सुना:" line). All assistant-persona copy replaced. | The two loudest chatbot tells are gone. |

**End of Day 1 gate:** open the app cold and ask someone who has not seen it — "what is this?"
If the answer is not "a market app for farmers", stop and fix before proceeding to Day 2.

### Day 2 — prove it is two-sided, polish, rehearse

| Block | ~Time | Work | Ships |
|---|---|---|---|
| **4** | 2.5h | **C1 + C2.** Buyer-side `BuyerInboxScreen` on the same record + demo toggle. `SpreadBar` and "मंडी भाव से ₹3/kg ज़्यादा" on Options. | The network proof and the price-discovery payoff. |
| **5** | 2h | **E1–E3.** Commodity imagery, trust/paperwork chrome (verified badge, slip no., GST line), rupee-forward numerals, ▲▼ deltas, tighter density. | It looks like commerce, not chat. |
| **6** | 1.5h | **F1–F3.** Seeded first frame, update `e2e/happy-path.spec.ts` for the new shell, full run-through, record a backup video, offline/mock fallback. | The demo survives the venue. |

**Reserve ~2h of Day 2 as buffer.** Something will break — most likely the Sarvam calls on
venue wifi, or the e2e test against the new shell.

### Explicitly cut for the two-day window

- **D1 (voice navigation over the marketplace)** — genuinely good, but it needs new intents in
  `prompts.py` plus per-tab wiring, and it is invisible in a 90-second demo unless narrated.
  Say it as roadmap instead: *"voice already drives every decision; next it drives navigation."*
- **B3 wallet** — reduce to a single earnings line on Market and Profile, not a wallet screen.
- **E4 motion** — rates ticker only. Skip the settlement animation.
- **Delivery-partner pickup screen** — the buyer view alone carries the two-sided point.

### Risk register

| Risk | Mitigation |
|---|---|
| Venue network/mic fails mid-demo | Block 6 offline mock mode + recorded backup video |
| New shell breaks the Playwright smoke test | Budgeted in Block 6; do not skip — it is the only regression net |
| Scope creep in Block 5 (polish is infinitely expandable) | Hard-stop Block 5 at its 2h; unfinished polish is invisible, an unrehearsed demo is not |
| Jury asks "so it *is* an AI assistant?" | Prepared answer: voice is the access layer; the product is the two-sided market — then show the buyer's phone |

---

## 7. Note on missing docs

`prototype/CLAUDE.md` references `docs/PROTOTYPE.md`, `docs/PROTOTYPE_DESIGN.md`,
`docs/PHASES.md`, `docs/SETUP_GUIDE.md` and `docs/DESIGN_TOOLING.md`, but `prototype/docs/`
currently contains only `DEPLOYMENT.md`. Those files are absent from the repo (not gitignored).
Worth restoring before this work starts — the design doc holds the palette/typography/wireframe
conventions that Phase E should extend rather than reinvent.
