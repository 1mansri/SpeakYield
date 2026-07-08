# TECH_STACK — Speak Yield

> **Status:** Draft, idea stage. Technologies in **bold** are stated explicitly in the pitch deck's "Technology Flow" slide and are treated as fixed. Others are reasoned choices consistent with those; each carries a one-line "why over the alternative." ⚠️ = assumption to confirm.

---

## Stated in the deck (fixed)

| Layer | Choice | Why this over the alternative |
|---|---|---|
| Web / frontend | **Next.js** | SSR + PWA + API routes in one framework; better offline/low-bandwidth story via service workers than a plain SPA. |
| Database | **MongoDB** | Flexible document model fits evolving voice/marketplace schemas faster than rigid SQL at idea stage; geo queries built in for hyperlocal matching. |
| Cloud | **AWS** | Broadest India (ap-south-1 Mumbai) presence for data residency; mature managed services for a solo founder. |
| LLM (intent) | **OpenAI / Gemini API** | Strong multilingual (Hindi/Bengali) understanding out of the box vs. rules-based NLU; API-first, no model ops. Abstracted behind a provider interface so we can switch. |
| Speech-to-text | **Deepgram / Wispr** | Purpose-built streaming STT tuned for noisy, low-bandwidth audio vs. general cloud STT; supports Indic languages. Also behind a provider interface. |
| Payments | **UPI / Razorpay** | India-native UPI rails + hosted checkout keeps us out of PCI card-data scope vs. building a gateway; Razorpay also offers KYC, payouts (Route), and GST-friendly invoicing. |

## Reasoned additions (consistent with the above)

| Concern | Choice | Why this over the alternative |
|---|---|---|
| Runtime / backend | Node.js (TypeScript) ⚠️ | Same language as Next.js → shared types/validation across stack; huge ecosystem. TS over plain JS for safety in payment/auth code. |
| API style | REST (JSON) + webhooks | Simpler for a solo founder and external partners (Razorpay/WhatsApp webhooks) than GraphQL at this stage. See [API_SPEC.md](./API_SPEC.md). |
| Async processing | AWS SQS + worker process ⚠️ | Native to chosen cloud; decouples slow voice/STT/LLM/payout work from request threads without standing up Kafka. |
| Cache / sessions / geo | Redis (ElastiCache) ⚠️ | OTP throttling, session/JWT denylist, hot listing cache, geo radius sets. Managed, low-ops. |
| Object storage | AWS S3 (ap-south-1) | Voice audio, generated GST invoices; lifecycle rules enforce retention. See [DATA_RETENTION.md](../05-security-legal/DATA_RETENTION.md). |
| Text-to-speech (read-back) | Provider-abstracted TTS (e.g. Google/Azure/Deepgram Aura) ⚠️ | Needed for spoken read-back/confirm in Hindi/Bengali; abstracted like STT so vendor is swappable. |
| Messaging channels | WhatsApp Business API; SMS/OTP gateway (e.g. MSG91/Gupshup) ⚠️ | Deck names WhatsApp + IVR as channels; Indian SMS/WA aggregators handle DLT/regulatory registration. |
| IVR | Cloud telephony (e.g. Exotel/Twilio-India) ⚠️ | Reach farmers without smartphones; Indian providers handle local numbering/DLT. v2 priority. |
| Hosting | AWS ECS Fargate ⚠️ | Containerised deploys without managing servers; simpler than EKS for a small team. |
| CDN / edge security | CloudFront + AWS WAF | Low-latency static/PWA delivery in India; WAF for basic rate/attack protection. |
| Auth | Custom phone+OTP issuing JWTs ⚠️ | Full control over OTP + KYC-gated business flow; avoids paying for/adapting a generic IdP to a phone-first, low-literacy audience. |
| IaC | Terraform ⚠️ | Reproducible infra; cloud-agnostic knowledge vs. CloudFormation lock-in. |
| Observability | OpenTelemetry + CloudWatch/Grafana ⚠️ | See [MONITORING_LOGGING.md](../04-infra/MONITORING_LOGGING.md). |

## Provider-abstraction principle

STT, TTS, and LLM are each accessed through an internal **provider interface** with a default vendor and a fallback. Rationale: the deck itself lists *alternatives* ("OpenAI / Gemini", "Deepgram / Wispr"), pricing/quality shift fast, and swapping a speech vendor must never be a rewrite. Payments are similarly abstracted but Razorpay is the concrete v1 implementation.

## Open confirmations
- Backend language/framework (Node/TS assumed — confirm; a Next.js API-routes-only backend is possible for v1 but the async worker still wants a separate process).
- SMS/WhatsApp/IVR aggregator selection (affects DLT registration lead time — start early).
