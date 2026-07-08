# API_SPEC — Speak Yield

> **Status:** Draft, idea stage. Rough endpoint list grouped by resource. REST + JSON, webhooks for async providers. Illustrative shapes, not final contracts.

---

## Conventions

- **Base:** `https://api.speakyield.in/v1/...`
- **Versioning:** URL-path versioning (`/v1`). Breaking changes → `/v2`; additive changes stay in `/v1`. Rationale: simplest for external partners (Razorpay/WhatsApp) and for a small team over header-based versioning.
- **Auth:** `Authorization: Bearer <JWT>` on all but auth + webhook routes. See [SECURITY.md](../05-security-legal/SECURITY.md).
- **Errors:** `{ error: { code, message, details? } }`, standard HTTP status codes.
- **Idempotency:** mutating money/order endpoints accept `Idempotency-Key` header.
- **Localization:** `Accept-Language: hi|bn|od` for messages/read-back text.

---

## Auth & identity
```
POST   /auth/otp/request        { phone }                       -> sends OTP
POST   /auth/otp/verify         { phone, code }                 -> { accessToken, refreshToken, user }
POST   /auth/refresh            { refreshToken }
POST   /auth/logout
GET    /me
PATCH  /me                      { name, preferredLanguage, location }
```

## KYC (business accounts)
```
POST   /kyc/initiate            { docType }                     -> provider (Razorpay) session
GET    /kyc/status
# provider callback handled at /webhooks/razorpay-kyc
```
KYC `verified` is required before a business account can transact at volume / receive payouts.

## Voice (core)
```
POST   /voice/sessions          (multipart audio | streaming)   -> { sessionId, transcript, intent, entities, draft }
POST   /voice/sessions/:id/confirm   { accept: true }           -> commits draft (order|listing)
POST   /voice/sessions/:id/reject
GET    /voice/sessions/:id
```
`/voice/sessions` runs STT → LLM → returns a **draft + read-back text/TTS**; nothing commits until `/confirm`. Records `consentCrossBorder`.

## Listings (catalog)
```
GET    /listings                ?commodity&kind&nearLng&nearLat&radiusKm
POST   /listings                { kind, commodity, quantity, price, coverageRadiusKm }
GET    /listings/:id
PATCH  /listings/:id
DELETE /listings/:id            (soft close)
```

## Matching / discovery
```
GET    /match/buyers            ?listingId            (for a produce listing)
GET    /match/sellers           ?commodity&nearLng&nearLat
```

## Orders
```
POST   /orders                  { listingId, items }  -> status: pending (awaits payment/confirm)
GET    /orders                  ?role=buyer|seller
GET    /orders/:id
POST   /orders/:id/confirm      { }                   -> records explicit user confirm
POST   /orders/:id/cancel       { reason }
```

## Payments
```
POST   /payments/checkout       { orderId }           -> Razorpay order + hosted checkout params
GET    /payments/:id
POST   /payments/:id/refund     { reason }            (ops)
# capture/failure via /webhooks/razorpay
```

## Deliveries / logistics
```
GET    /deliveries/offers       (delivery partner: nearby open jobs)
POST   /deliveries/:id/accept
POST   /deliveries/:id/status   { status: picked_up|delivered }
GET    /deliveries/:id
```

## Invoices
```
GET    /orders/:id/invoice      -> GST invoice (PDF ref)
```

## Notifications
```
GET    /notifications
POST   /notifications/read      { ids }
```

## Admin / ops
```
GET    /admin/users             ?kycStatus&role
POST   /admin/users/:id/verify
GET    /admin/listings          ?flagged
POST   /admin/listings/:id/moderate
GET    /admin/orders            ?status
GET    /admin/metrics           (transactions, intent accuracy, pilot KPIs)
GET    /admin/disputes
```

## Webhooks (inbound)
```
POST   /webhooks/razorpay        (payment.captured, payment.failed, refund.processed, payout.*)
POST   /webhooks/razorpay-kyc
POST   /webhooks/whatsapp        (inbound messages / delivery receipts)
POST   /webhooks/ivr             (call events / DTMF / speech)
```
All webhooks verify provider signatures and are idempotent (see [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) unique indexes).
