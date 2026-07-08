# SCALABILITY — Speak Yield

> **Status:** Draft, idea stage. Scaling plan follows the deck's District → State → National ambition, with concrete bottlenecks and trigger metrics.

---

## Guiding principle
Scale to what the pilot proves, not to imagined national numbers. Each step below names the **metric that triggers it** so we don't over- or under-build.

## Expected bottlenecks, in order

### 1. Voice pipeline throughput & cost (first bottleneck)
The STT → LLM → TTS round trip is the most latency- and cost-sensitive path, and every interaction hits it.
- **Trigger:** voice p90 round-trip > 4 s **or** provider spend per transaction erodes the ~₹40 contribution/order.
- **Plan:** stream audio; cache/short-circuit repeat intents; batch where possible; route to the cheaper provider by language/quality via the provider interface; move the `worker` pool to independent auto-scaling on queue depth; evaluate on-shore/self-hosted STT if unit economics demand (currently deferred).

### 2. Hyperlocal matching (geo queries)
`2dsphere` radius queries on `listings`/`users`/`deliveries` grow with density.
- **Trigger:** geo query p95 > 150 ms or CPU pressure on Atlas from geo ops.
- **Plan:** Redis geo sets for hot areas; precomputed candidate pools per district; Atlas tier bump / sharding by geography (natural shard key = region) as coverage expands state-wide.

### 3. Database read/write load
- **Trigger:** Atlas primary CPU sustained > 70% or replication lag rising.
- **Plan:** read from secondaries for discovery/analytics; add indexes per slow-query logs; **shard by region** (aligns with District→State→National); archive closed orders/expired listings to cold storage (ties to [DATA_RETENTION.md](../05-security-legal/DATA_RETENTION.md)).

### 4. Payments / payout webhook volume
- **Trigger:** webhook processing backlog or Razorpay rate limits hit.
- **Plan:** already idempotent + queued; scale worker consumers; dead-letter queue for poison messages.

### 5. Messaging fan-out (SMS/WhatsApp/IVR)
- **Trigger:** notification send latency or aggregator throttling.
- **Plan:** queue + rate-limit per provider; multiple DLT templates; add IVR capacity (v2).

## Scaling levers by phase
| Phase | Geography | Primary lever |
|---|---|---|
| v1 | Kharagpur district | Multi-AZ Fargate autoscale; single Atlas replica set |
| v2 | West Bengal + Odisha | Region-based sharding; Redis geo caching; worker pool split |
| v3 | Multi-state / national | Extract voice + payments into independent services; consider second India region |

## Stateless-by-default
API/worker instances are stateless (session state in Redis, JWTs), so horizontal scale-out is the default response to load. State lives only in Atlas/Redis/S3.

## What we explicitly won't pre-optimise
Microservices, multi-region, and sharding are **deferred until a trigger fires** — see the monolith decision in [ARCHITECTURE.md](../02-architecture/ARCHITECTURE.md).
