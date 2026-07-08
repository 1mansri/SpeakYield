# ENV_VARIABLES — Speak Yield

> **Status:** Draft, idea stage. **Names and purposes only — never commit real values or secrets.** All secrets are sourced from AWS Secrets Manager / SSM at runtime. Provide a committed `.env.example` with these keys and empty values.

---

## Conventions
- `SCREAMING_SNAKE_CASE`. Prefix by domain where useful.
- Three environments: `staging`, `production` (both ap-south-1), and local `development`.
- Anything marked **secret** must live in the secrets manager, not in `.env` files in prod.

## Core
| Var | Purpose | Secret |
|---|---|---|
| `NODE_ENV` | `development` / `staging` / `production` | no |
| `APP_BASE_URL` | Public app URL | no |
| `API_BASE_URL` | Public API URL (`/v1`) | no |
| `AWS_REGION` | Fixed to `ap-south-1` (residency) | no |
| `PORT` | Service port | no |

## Database & cache
| Var | Purpose | Secret |
|---|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string (ap-south-1) | **yes** |
| `MONGODB_DB_NAME` | Database name | no |
| `REDIS_URL` | Redis (sessions, OTP throttle, geo cache) | **yes** |

## Auth
| Var | Purpose | Secret |
|---|---|---|
| `JWT_ACCESS_SECRET` | Sign access tokens | **yes** |
| `JWT_REFRESH_SECRET` | Sign refresh tokens | **yes** |
| `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL` | Token lifetimes | no |
| `OTP_TTL_SECONDS` | OTP validity window | no |
| `OTP_MAX_ATTEMPTS` | Lockout threshold | no |

## Speech / LLM (provider-abstracted, cross-border)
| Var | Purpose | Secret |
|---|---|---|
| `STT_PROVIDER` | `deepgram` \| `wispr` (default + fallback) | no |
| `DEEPGRAM_API_KEY` | STT | **yes** |
| `WISPR_API_KEY` | STT fallback | **yes** |
| `LLM_PROVIDER` | `openai` \| `gemini` | no |
| `OPENAI_API_KEY` | LLM intent | **yes** |
| `GEMINI_API_KEY` | LLM intent | **yes** |
| `TTS_PROVIDER` / `TTS_API_KEY` | Voice read-back | mixed |

## Payments (Razorpay)
| Var | Purpose | Secret |
|---|---|---|
| `RAZORPAY_KEY_ID` | Public key id | no |
| `RAZORPAY_KEY_SECRET` | Server secret | **yes** |
| `RAZORPAY_WEBHOOK_SECRET` | Verify webhook signatures | **yes** |
| `RAZORPAY_MODE` | `test` \| `live` | no |
| `RAZORPAY_ROUTE_ENABLED` | Delivery/dealer payouts | no |

## Messaging channels
| Var | Purpose | Secret |
|---|---|---|
| `SMS_PROVIDER` / `SMS_API_KEY` | OTP + notifications | mixed |
| `SMS_DLT_ENTITY_ID` / `SMS_DLT_TEMPLATE_ID` | India DLT compliance | no |
| `WHATSAPP_API_TOKEN` | WhatsApp Business API | **yes** |
| `WHATSAPP_PHONE_ID` | WhatsApp sender id | no |
| `IVR_PROVIDER` / `IVR_API_KEY` | Cloud telephony (v2) | mixed |

## Storage & infra
| Var | Purpose | Secret |
|---|---|---|
| `S3_BUCKET_AUDIO` | Voice audio (residency-locked, lifecycle rules) | no |
| `S3_BUCKET_INVOICES` | GST invoice PDFs | no |
| `SQS_QUEUE_URL` | Async worker queue | no |

## Observability
| Var | Purpose | Secret |
|---|---|---|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Traces/metrics | no |
| `LOG_LEVEL` | `info` / `debug` | no |
| `SENTRY_DSN` (or equiv) | Error tracking | **yes** |

## Feature flags
| Var | Purpose | Secret |
|---|---|---|
| `FEATURE_IVR` | Enable IVR channel (v2) | no |
| `FEATURE_ADS` | Promoted listings (v2) | no |
| `FEATURE_LANG_ODIA` | Odia support (v2) | no |

> ⚠️ Confirm final provider list; SMS/WhatsApp DLT registration must start early (long lead time in India).
