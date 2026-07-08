# PERFORMANCE — Speak Yield

> **Status:** Draft, idea stage. Latency budgets and caching strategy. ⚠️ Targets are reasoned for a low-bandwidth rural pilot, not stated in inputs — confirm.

---

## Why performance is a product feature here
Users are low-literacy farmers on 2G/3G. Slow or janky voice feels broken and kills adoption. The deck explicitly demands "Works in Low Internet" and "syncs when online." Performance targets are therefore first-class.

## Latency targets by endpoint class
| Class | Example | Target |
|---|---|---|
| **Voice round-trip** | speak → transcribed → intent → read-back draft | **p90 ≤ 4 s**, p50 ≤ 2.5 s |
| **Read (cached)** | listings near me, my orders | p95 ≤ 300 ms |
| **Read (uncached geo)** | fresh hyperlocal match | p95 ≤ 500 ms |
| **Write** | create listing/order, confirm | p95 ≤ 800 ms |
| **Payment init** | checkout params from Razorpay | p95 ≤ 1.2 s (bounded by provider) |
| **Webhook processing** | payment.captured → order confirmed | p95 ≤ 2 s async |

## Voice-path optimisation (the critical path)
- **Stream** audio to STT rather than upload-then-process where the provider supports it.
- Compress audio client-side (Opus/low-bitrate) — cuts upload time on 2G/3G.
- Run STT and any independent lookups concurrently; keep LLM prompts tight (small, structured output) to reduce token latency/cost.
- Pre-warm provider connections in the worker pool.
- Because v1 requires **explicit confirm**, the perceived flow is speak → quick draft → confirm; optimise time-to-draft above all.

## Caching strategy
| Layer | What | TTL / invalidation |
|---|---|---|
| **CDN (CloudFront)** | PWA static assets, i18n bundles | long TTL, versioned filenames |
| **Service worker (PWA)** | app shell, last-known listings/orders for **offline** use | stale-while-revalidate; sync on reconnect |
| **Redis** | session/JWT state, OTP throttle, hot listings per district, geo candidate sets | seconds–minutes; invalidate on listing write |
| **App/query** | reference data (commodities, units, HSN codes) | in-memory, refresh on deploy |
- **Do not cache** payment state, order totals, or auth decisions — always authoritative from DB/provider.

## Offline & low-bandwidth
- PWA installable; app shell + critical read data cached for offline viewing.
- Writes made offline are queued and **synced when connectivity returns** (with conflict handling — server timestamp wins, user re-confirms money actions).
- Money actions (pay/confirm) require live connectivity — never committed blind offline.

## Performance testing
- Load test voice + matching paths against pilot concurrency (~500 concurrent ⚠️) before pilot launch.
- Track Core Web Vitals for the PWA on low-end Android devices, not just desktop.
- Budget regressions caught in CI via a lightweight perf smoke on key endpoints.

## Metrics to watch
Voice round-trip p50/p90, STT/LLM provider latency, geo-query p95, cache hit ratio, provider spend per transaction (guards the ~₹40 contribution/order). See [MONITORING_LOGGING.md](./MONITORING_LOGGING.md).
