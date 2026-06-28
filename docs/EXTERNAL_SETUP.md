# External Services Setup Guide — Thunder MVP → Production

This document lists **every external service** needed beyond the code already in this repo, where to sign up, and what to configure.

---

## What works TODAY (no external setup)

| Feature                                              | Status                                     |
| ---------------------------------------------------- | ------------------------------------------ |
| User register / login                                | In-memory backend (dev)                    |
| Filters CRUD                                         | Works                                      |
| Wallet balance + recharge                            | **Stub** — instant credit, no real payment |
| Amazon Flex connect                                  | **Stub** — simulates session               |
| Block search + grab                                  | **Stub** — simulated blocks, real flow     |
| Mobile UI (iOS + Android via Expo Go)                | Works after SDK 54 upgrade                 |
| Web preview (`npm run web -w @thunder-spark/mobile`) | Works on Windows                           |

---

## Required for end-to-end testing on your phone

### 1. Expo Go (free)

- **iOS:** App Store → install **Expo Go** (SDK 54)
- **Android:** Play Store → install **Expo Go**

### 2. Same Wi‑Fi network

Phone and PC must be on the **same Wi‑Fi**.

### 3. API URL on your PC

Create `apps/mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://YOUR_PC_LAN_IP:3000/api/v1
```

Find your LAN IP on Windows:

```powershell
ipconfig
# Look for IPv4 under your Wi-Fi adapter, e.g. 10.75.166.253
```

### 4. Start backend + mobile

```powershell
# Terminal 1
npm run dev:api

# Terminal 2
npm run dev:mobile
# Scan QR with Expo Go (Android) or Camera app (iOS)
```

**Windows note:** Pressing `i` (iOS simulator) or `a` (Android emulator) requires **Xcode** (Mac only) or **Android Studio + SDK**. On Windows, use **Expo Go on a physical phone** or press **`w`** for web.

---

## External services for PRODUCTION (you set up later)

### A. Hosting — Backend API + Block Engine

| Service                                  | Purpose                    | Est. cost          | Where                                                                                                          |
| ---------------------------------------- | -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------- |
| **Railway** or **Render** or **AWS EC2** | NestJS API + worker        | $5–50/mo           | [railway.app](https://railway.app), [render.com](https://render.com), [aws.amazon.com](https://aws.amazon.com) |
| **PostgreSQL** (Railway/Supabase/Neon)   | Users, wallet ledger, jobs | Free tier → $15/mo | [supabase.com](https://supabase.com), [neon.tech](https://neon.tech)                                           |
| **Redis** (Upstash/Railway)              | Job queue, session cache   | Free tier → $10/mo | [upstash.com](https://upstash.com)                                                                             |

**Env vars to set on host:** copy from `apps/api/.env.example`

---

### B. Payments — Stripe

| Item                                                    | Purpose       | Cost                                    |
| ------------------------------------------------------- | ------------- | --------------------------------------- |
| [Stripe account](https://dashboard.stripe.com/register) | Wallet top-up | 2.9% + $0.30 per charge                 |
| Apple Pay merchant ID                                   | iOS payments  | Free (Apple Developer account required) |

**Setup steps:**

1. Create Stripe account → get **Publishable** + **Secret** keys (test mode first)
2. Add to API: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
3. Add to mobile: `@stripe/stripe-react-native` + `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
4. Configure webhook: `POST https://your-api.com/api/v1/webhooks/stripe`

**Note:** Wallet credits for a **service** (block grabbing) can use Stripe. If Apple classifies as digital goods, you may need IAP for iOS — legal/product review required.

---

### C. Push notifications

| Service                      | Purpose                     | Cost                  |
| ---------------------------- | --------------------------- | --------------------- |
| [Expo EAS](https://expo.dev) | Build + push infrastructure | Free tier, then usage |
| **Apple Developer Program**  | APNs for iOS                | **$99/year**          |
| **Google Play Console**      | FCM for Android             | **$25 one-time**      |

**Setup:** EAS project → `eas credentials` → enable push in Expo dashboard.

---

### D. App Store distribution

| Platform                         | Requirement                             | Cost                     |
| -------------------------------- | --------------------------------------- | ------------------------ |
| **iOS (TestFlight → App Store)** | Mac with Xcode OR **EAS Build** (cloud) | Apple Developer $99/yr   |
| **Android (Play Store)**         | EAS Build → upload AAB                  | Google Play $25 one-time |

**Recommended:** [Expo EAS Build](https://docs.expo.dev/build/introduction/) — builds iOS on cloud without a Mac.

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios
eas build --platform android
```

---

### E. Amazon Flex integration (critical path)

Amazon Flex has **no official public API**. Production requires:

| Component                        | Description                        | Who builds                           |
| -------------------------------- | ---------------------------------- | ------------------------------------ |
| Reverse-engineered API endpoints | `GetOffers`, `AcceptOffer`, etc.   | Your backend team (Phase 7)          |
| Session token capture            | Secure WebView login in mobile app | Code scaffold exists (stub)          |
| Token encryption at rest         | AES-256 / KMS                      | Backend env `ENCRYPTION_KEY`         |
| Residential proxy (optional)     | Reduce ban risk near user's market | Services like Bright Data (~$10+/GB) |

**Risk:** Violates Amazon ToS — account deactivation possible. In-app disclaimer required.

---

### F. Optional — Observability

| Service                                        | Purpose                               |
| ---------------------------------------------- | ------------------------------------- |
| [Sentry](https://sentry.io)                    | Crash + error tracking (mobile + API) |
| [Datadog / Grafana Cloud](https://grafana.com) | Block engine latency metrics          |

---

## Setup checklist (in order)

```
[ ] 1. Test MVP locally (web or Expo Go + LAN IP)
[ ] 2. Deploy API to Railway/Render
[ ] 3. Add PostgreSQL + migrate from in-memory store
[ ] 4. Stripe test mode → wallet recharge
[ ] 5. EAS account → cloud iOS/Android builds
[ ] 6. Apple Developer + Google Play accounts
[ ] 7. Amazon Flex real adapter (requires R&D)
[ ] 8. Push notifications
[ ] 9. TestFlight beta → production launch
```

---

## Cost summary (rough monthly, production)

| Item                       | Estimate                     |
| -------------------------- | ---------------------------- |
| Hosting (API + DB + Redis) | $20–80                       |
| Stripe fees                | Per transaction              |
| Apple Developer            | $8/mo (annualized)           |
| EAS (optional paid)        | $0–29                        |
| Proxies (if used)          | $50–200+                     |
| **Total MVP launch**       | **~$50–150/mo** + store fees |

---

## Nothing else required from you for current MVP testing

1. Install **Expo Go** on your phone
2. Copy `apps/mobile/.env.example` → `apps/mobile/.env` with your PC IP
3. Run `npm run dev:api` and `npm run dev:mobile`
4. Scan QR code

Code-side MVP is complete. Real payments, real Flex blocks, and store publishing need the external accounts above.
