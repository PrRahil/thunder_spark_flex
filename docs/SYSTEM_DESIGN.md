# Thunder Spark Flex — System Design

> **Product:** AI-powered delivery block grabber (iPhone first, Android later)  
> **Codename:** thunder_spark_flex  
> **Primary provider (v1):** Amazon Flex  
> **Competitor reference:** [BusyMate / busydrivers.com](http://www.busydrivers.com)

---

## 1. Executive Summary

Thunder Spark Flex helps delivery drivers maximize earnings by automatically finding and grabbing the best matching delivery blocks based on user-defined filters (dates, times, locations, wages). Users pay a **per-success service fee** (e.g. $9) via an in-app wallet — separate from block earnings paid by Amazon.

### Key technical constraint (from research)

| Platform | Background polling capability | Implication |
|----------|------------------------------|-------------|
| **iOS** | BGTaskScheduler: ~15 min minimum interval, ~30 sec max runtime; killed if user force-quits | Block engine **cannot** run reliably on-device |
| **Android** | WorkManager + foreground service possible, but still inferior to server-side | Same conclusion for v1 |
| **Server** | Sub-100 ms polling, 24/7, geo-distributed | **Block engine must run server-side** |

The mobile app is the **control plane** (login, filters, wallet, start/stop, notifications). The **data plane** (high-frequency API polling + block reservation) runs on backend workers close to the user.

---

## 2. Technology Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Mobile** | React Native + Expo (SDK 52+) | iOS-first with single codebase for Android; Stripe SDK; push notifications; EAS Build for App Store |
| **Backend API** | NestJS (Node.js / TypeScript) | Modular architecture maps 1:1 to product modules; shared types with mobile |
| **Block Engine** | NestJS worker + BullMQ | Isolated high-frequency polling jobs; horizontal scaling |
| **Database** | PostgreSQL 16 | ACID for wallet ledger, user data, audit trail |
| **Cache / Queue** | Redis 7 | Session tokens, rate limiting, job queues, hot block cache |
| **Payments** | Stripe PaymentSheet | Wallet top-up; webhooks as source of truth |
| **Push** | Expo Notifications + APNs | Block grabbed / wallet low / session expired |
| **Auth (app users)** | JWT + refresh tokens | Standard mobile auth |
| **Provider auth** | OAuth / token relay per provider | Amazon Flex session tokens (see §6) |
| **Observability** | Structured logs + metrics (Prometheus/Grafana) | Latency SLO tracking for 50 ms grab target |

### Why not Flutter or native Swift-only?

- **React Native + Expo:** Best balance for iOS-first + future Android + TypeScript shared with backend; mature payment and notification ecosystem.
- Native Swift deferred: adds a second codebase for Android later. Revisit if deep iOS-only features (Live Activities, Dynamic Island) become critical.

---

## 3. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MOBILE APP (Expo RN)                            │
│  Login │ Filters │ Wallet │ Start/Stop │ Notifications │ Settings       │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTPS / WSS
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY (NestJS)                            │
│  Auth │ Users │ Filters │ Wallet │ Sessions │ Block Jobs │ Webhooks   │
└───────┬─────────────────┬──────────────────────┬────────────────────────┘
        │                 │                      │
        ▼                 ▼                      ▼
┌──────────────┐  ┌──────────────┐      ┌──────────────────┐
│  PostgreSQL  │  │    Redis     │      │  Block Engine    │
│  (ledger,    │  │  (tokens,    │      │  Workers         │
│   users,     │  │   queues,    │      │  (50ms poll loop)│
│   jobs)      │  │   cache)     │      └────────┬─────────┘
└──────────────┘  └──────────────┘               │
                                                 ▼
                                        ┌──────────────────┐
                                        │ Provider Adapter │
                                        │ (Amazon Flex v1) │
                                        └────────┬─────────┘
                                                 │
                                                 ▼
                                        ┌──────────────────┐
                                        │  Amazon Flex API │
                                        │  (unofficial)    │
                                        └──────────────────┘
```

---

## 4. Module Breakdown

### Module 1 — `packages/shared`
Shared TypeScript types, Zod schemas, constants, error codes. Used by mobile and API.

### Module 2 — `apps/api` (NestJS)
REST + WebSocket API. Sub-modules:

| Sub-module | Responsibility |
|------------|----------------|
| **auth** | App user registration, login, JWT |
| **users** | Profile, preferences |
| **providers** | Connect Amazon Flex account, store encrypted session |
| **filters** | CRUD filter presets (dates, times, locations, min wage) |
| **wallet** | Balance, ledger, hold/charge/refund |
| **payments** | Stripe PaymentIntent, webhooks |
| **block-jobs** | Start/stop search; enqueue worker |
| **notifications** | Push token registry, event dispatch |

### Module 3 — `apps/block-engine` (Worker)
Long-running BullMQ consumer per active user session:

1. Load user filters + provider session from Redis
2. Poll provider adapter at configured interval (target 50–100 ms)
3. Score & rank blocks against filters
4. Attempt reservation via provider API
5. On success: charge wallet, notify user, log audit
6. On captcha: pause job, notify user, await resolution flow
7. Human-like jitter + backoff to reduce ban risk

### Module 4 — `packages/provider-amazon-flex`
Provider adapter implementing `IProviderAdapter`:

```typescript
interface IProviderAdapter {
  validateSession(credentials: ProviderSession): Promise<boolean>;
  refreshSession(session: ProviderSession): Promise<ProviderSession>;
  listAvailableBlocks(session: ProviderSession): Promise<DeliveryBlock[]>;
  acceptBlock(session: ProviderSession, blockId: string): Promise<AcceptResult>;
  cancelBlock(session: ProviderSession, blockId: string): Promise<void>;
}
```

Implementation uses reverse-engineered Flex endpoints; tokens obtained via secure in-app WebView login or token relay (see §6).

### Module 5 — `apps/mobile` (Expo)
Screen map:

| Screen | Purpose |
|--------|---------|
| **Welcome / Login** | Email + password for Thunder Spark account |
| **Connect Provider** | Amazon Flex OAuth / WebView login |
| **Filters** | Date, time, location, wage sliders |
| **Wallet** | Balance, recharge (Stripe), transaction history |
| **Dashboard** | Start / Stop button, live status, last grab |
| **Notifications** | History of grabs, errors, refunds |
| **Settings** | Provider disconnect, support, legal |

Foreground: WebSocket connection while "Running" for live status. Background: push notifications only (not polling).

---

## 5. Core User Flows

### 5.1 Start Block Search

```
User taps START
  → Mobile: POST /block-jobs/start
  → API: Check wallet balance >= service_fee
       → If insufficient: 402 + "Recharge wallet"
       → If OK: Create BlockJob (status=RUNNING), enqueue worker
  → Worker: Begin poll loop
  → On match + accept success:
       → Wallet: hold → charge $9
       → Push: "Block grabbed: $250 @ Warehouse X"
       → BlockJob: status=SUCCESS (or continue if multi-grab enabled)
```

### 5.2 Refund on Cancel

```
User cancels grabbed block (in Flex app or our app)
  → Provider webhook/poll detects cancellation
  → API: wallet.refund(charge_id)
  → Ledger entry: REFUND
  → Push: "Refund of $9 credited to wallet"
```

### 5.3 Wallet Recharge

```
User taps Recharge → Stripe PaymentSheet
  → Backend creates PaymentIntent
  → On webhook payment_intent.succeeded:
       → Credit wallet (idempotent by payment_intent id)
```

---

## 6. Provider Integration — Amazon Flex (v1)

Amazon Flex has **no public API** for block grabbing. Industry pattern (from reverse-engineering community):

1. User logs into Flex via official flow (WebView or companion device)
2. App captures **session tokens** (refresh + access) via secure token relay
3. Server stores tokens **encrypted at rest** (AES-256-GCM, KMS-managed keys)
4. Worker calls same REST endpoints the Flex app uses (`GetOffersForProvider`, `AcceptOffer`, etc.)
5. Tokens refreshed before expiry (~30 min)

### Captcha handling

| Strategy | When |
|----------|------|
| Pause job + push notification | Captcha detected in API response |
| In-app WebView challenge | User completes captcha; new tokens relayed |
| Rate limit backoff | HTTP 429 / anomaly signals |

### Anti-ban / human-like behavior

- Randomized poll intervals (50–150 ms jitter)
- Simulated "browse" telemetry where API requires it
- Same device fingerprint consistency per account
- Avoid datacenter IPs; use residential proxy near user's market (configurable)
- Circuit breaker on repeated failures

> **Compliance warning:** Automating Amazon Flex may violate Amazon's Terms of Service and can result in account deactivation. Product must disclose risks; legal review required before launch.

---

## 7. Wallet & Ledger Design

Double-entry inspired ledger (simplified):

| Event | Debit | Credit |
|-------|-------|--------|
| Stripe top-up $50 | — | wallet +$50 |
| Block grab fee | wallet −$9 | revenue +$9 |
| Refund | revenue −$9 | wallet +$9 |
| Failed grab (policy) | — | — (no charge) |

**Rules:**
- Charge only on **confirmed** block acceptance
- Holds placed before accept attempt; released on failure
- All mutations idempotent with `idempotency_key`
- Stripe webhooks are source of truth for external payments

---

## 8. Data Model (Core Entities)

```
User
  id, email, password_hash, created_at

ProviderConnection
  id, user_id, provider (AMAZON_FLEX), encrypted_session, status, expires_at

FilterPreset
  id, user_id, name, dates[], time_ranges[], locations[], min_wage_cents

Wallet
  user_id, balance_cents, currency

WalletTransaction
  id, user_id, type (CREDIT|DEBIT|REFUND|HOLD|RELEASE), amount_cents, ref_type, ref_id, idempotency_key

BlockJob
  id, user_id, filter_preset_id, status (RUNNING|PAUSED|SUCCESS|FAILED|STOPPED), started_at, stopped_at

GrabbedBlock
  id, block_job_id, provider_block_id, wage_cents, location, start_time, fee_charged_cents, status

Payment
  id, user_id, stripe_payment_intent_id, amount_cents, status
```

---

## 9. API Surface (v1)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | JWT access + refresh |
| POST | `/providers/amazon-flex/connect` | Store session tokens |
| GET | `/filters` | List presets |
| POST | `/filters` | Create preset |
| GET | `/wallet` | Balance + recent txns |
| POST | `/wallet/recharge` | Create Stripe PaymentIntent |
| POST | `/block-jobs/start` | Start search (body: filter_preset_id) |
| POST | `/block-jobs/:id/stop` | Stop search |
| GET | `/block-jobs/:id` | Status + metrics |
| WS | `/ws/block-jobs/:id` | Live events |
| POST | `/webhooks/stripe` | Stripe events |

---

## 10. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Grab latency (p95) | < 100 ms from block appearance to accept call |
| API availability | 99.9% |
| Wallet correctness | Zero double-charges (idempotency + DB constraints) |
| Token security | Encrypted at rest, never logged, TTL enforced |
| iOS App Store | Clear disclosure; no hidden automation of other apps without user consent |

---

## 11. Deployment Topology

```
┌─────────────────┐     ┌─────────────────┐
│  EAS Build      │     │  AWS / Railway  │
│  (iOS App Store)│     │  API + Workers  │
└─────────────────┘     │  PostgreSQL     │
                        │  Redis          │
                        └─────────────────┘
                               │
                        Regional workers
                        (US-East, US-West, AU)
                        for low latency to Flex API
```

---

## 12. Build Phases (Module Order)

| Phase | Module | Deliverable |
|-------|--------|-------------|
| **0** | Monorepo + shared types | Build passes, types shared |
| **1** | API skeleton + auth | Register/login works |
| **2** | Mobile shell + navigation | iOS simulator runs |
| **3** | Filters CRUD | Mobile ↔ API |
| **4** | Wallet + Stripe | Recharge flow |
| **5** | Provider connect (stub) | Session storage |
| **6** | Block engine (stub) | Start/stop job lifecycle |
| **7** | Amazon Flex adapter | Real API integration |
| **8** | Captcha + anti-ban | Production hardening |
| **9** | Android build | EAS Android profile |

---

## 13. Future Scope

- Additional providers: Uber, Zomato, DoorDash adapters
- AI suggestions based on user grab history (Mihir's suggestion)
- Wage optimization scoring model
- Live Activity (iOS) showing search status
- Referral / promo wallet credits

---

## 14. References

- [Expo Background Task](https://docs.expo.dev/versions/latest/sdk/background-task/) — iOS BGTaskScheduler limits
- [Stripe React Native](https://docs.expo.dev/versions/latest/sdk/stripe/) — wallet top-up
- [React Native vs Flutter 2026](https://byteager.ca/blog/react-native-vs-flutter-vs-native-mobile-2026) — stack decision
- Amazon Flex automation research — session token + server-side polling pattern (GitHub: AmazonFlexUnlimited, industry forums)
