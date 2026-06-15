# Thunder — Production Requirements

> **Purpose:** Fill in this file as you complete each setup step. When every section is done, share the updated file — we will wire the codebase to these values.
>
> **Scope:** Production-like backend (hosted API + database). **No App Store / Play Store** for now. Mobile testing via **Expo Go** + hosted API.
>
> **Status:** `🟡 IN PROGRESS — payment provider: Dodo Payments`

| Field | Value |
|-------|-------|
| **Owner** | `Rahil` |
| **Started on** | `2026-06-14` |
| **Last updated** | `[fill when you edit]` |
| **Integration ready?** | `[ ] Yes — all required fields below are filled` |

---

> ### Security warning
> **Never paste live database passwords, API keys, or Redis tokens into this file if the repo is shared or public.** Store secrets only in **Render → Environment** and local `.env` (gitignored). If you previously pasted secrets here, **rotate** Neon and Upstash credentials.

---

## Payment provider decision (India startup)

| Provider | Verdict | Why |
|----------|---------|-----|
| **Stripe** | ❌ Skip | Invite-only in India for most startups |
| **Lemon Squeezy** | ⚠️ Not ideal | MoR based in US; Indian payouts often via Stripe/PayPal; weak FIRC/export docs for Indian entity; now owned by Stripe |
| **Dodo Payments** | ✅ **Recommended** | Bengaluru-based; built for Indian founders; UPI + global cards; FEMA-friendly INR payouts; REST API + webhooks; no invite needed |

**Chosen provider:** `Dodo Payments`

**How wallet recharge works in Thunder:**
1. User taps +$25 / +$50 / +$100 in app
2. API creates Dodo **Checkout Session** → returns hosted `checkout_url`
3. Mobile opens URL in browser (cards, UPI, PayPal, etc.)
4. Dodo webhook `payment.succeeded` → API credits wallet
5. User returns to app — balance updated

---

## Recommended free-tier stack

| Layer | Use now (free) | Upgrade later |
|-------|----------------|---------------|
| **API hosting** | [Render](https://render.com) Web Service | Starter $7/mo (always-on) |
| **PostgreSQL** | [Neon](https://neon.tech) | Neon paid |
| **Redis** | [Upstash](https://upstash.com) | Upstash paid |
| **Payments** | [Dodo Payments](https://dodopayments.com) test mode | Live mode |
| **Mobile testing** | Expo Go + hosted API | EAS APK later |

---

# Section 0 — Prerequisites

| # | Task | Your result |
|---|------|-------------|
| 0.1 | GitHub repo | `https://github.com/PrRahil/thunder_spark_flex` |
| 0.2 | Node 20+ | `[your version]` |
| 0.3 | Expo Go SDK 54 on phone | `[device model]` |

**Done?** `[x]`

---

# Section 1 — PostgreSQL (Neon)

| Placeholder | Your value |
|-------------|------------|
| **NEON_PROJECT_NAME** | `thunder-prod` |
| **NEON_DATABASE_URL** | `[stored in Render env only — do not paste here]` |
| **NEON_DIRECT_URL** | `[optional — Render env only]` |

**Done?** `[x]`

---

# Section 2 — Redis (Upstash)

| Placeholder | Your value |
|-------------|------------|
| **UPSTASH_REDIS_REST_URL** | `[Render env only]` |
| **UPSTASH_REDIS_REST_TOKEN** | `[Render env only]` |
| **REDIS_URL** | `[Render env only]` |

**Done?** `[x]`

---

# Section 3 — Dodo Payments — **DO THIS NOW**

**Where:** [https://app.dodopayments.com](https://app.dodopayments.com) → Sign up (no invite needed)

### Step 3A — Account & test mode

1. Create account (Indian entity / founder OK)
2. Stay in **Test mode** until E2E works
3. Go to **Developer → API Keys** → create key → copy

| Placeholder | Your value |
|-------------|------------|
| **DODO_PAYMENTS_MODE** | `test` |
| **DODO_PAYMENTS_API_KEY** | `5MCm_pot6adRP-Da.RirnU6wqX9gRdHwAj6vBuvKTrBH2Q8F87-Fa20QzIwIjX0Dx` |

---

### Step 3B — Create wallet products (one-time)

In Dodo Dashboard → **Products → Add product** — create **3 one-time digital products**:

| Product name | Price | Placeholder for Product ID |
|--------------|-------|----------------------------|
| Thunder Wallet Credit — $25 | USD 25.00 | **DODO_PRODUCT_ID_25** = `pdt_0Nh56EqES8QrdfQsc8xcp` |
| Thunder Wallet Credit — $50 | USD 50.00 | **DODO_PRODUCT_ID_50** = `pdt_0Nh56QUtvddsF51hA2cED` |
| Thunder Wallet Credit — $100 | USD 100.00 | **DODO_PRODUCT_ID_100** = `pdt_0Nh56YqBwD5YZhMKojjZA` |

> Product IDs look like `prod_xxxx`. Copy from each product's detail page.

**Products created?** `[ DONE ]`

---

### Step 3C — Webhook (after Render URL is live)

1. Dodo Dashboard → **Developer → Webhooks → Add Webhook**
2. **Endpoint URL:**
   ```
   https://thunder-api-efz5.onrender.com/api/v1/webhooks/dodo
   ```
3. **Subscribe to events:**
   - `payment.succeeded`
   - `payment.failed` *(optional)*
4. Copy **Webhook Secret Key** → Render env `DODO_WEBHOOK_SECRET` → **Redeploy**

> **Important:** Opening the webhook URL in a browser uses **GET** — that used to show 404. Real Dodo events are **POST** only. After next deploy, GET shows a verification JSON. Use Dodo dashboard **"Send test webhook"** to test for real.

| Placeholder | Your value |
|-------------|------------|
| **DODO_WEBHOOK_URL** | `https://thunder-api-efz5.onrender.com/api/v1/webhooks/dodo` |
| **DODO_WEBHOOK_SECRET** | `whsec_/AgOpTZXcoqIgDkotlV3ceSVOZWZlFaO` |
| **GET verify in browser** | After redeploy: should show `webhook_active` JSON |
| **Dodo "Send test" POST** | `[ yes ]` Returns 200 OK |

---

### Step 3D — Add to Render environment

In **Render → thunder-api → Environment**, add/update:

```
DODO_PAYMENTS_MODE=test
DODO_PAYMENTS_API_KEY=5MCm_pot6adRP-Da.RirnU6wqX9gRdHwAj6vBuvKTrBH2Q8F87-Fa20QzIwIjX0Dx
DODO_WEBHOOK_SECRET=whsec_/AgOpTZXcoqIgDkotlV3ceSVOZWZlFaO
DODO_PRODUCT_ID_25=pdt_0Nh56EqES8QrdfQsc8xcp
DODO_PRODUCT_ID_50=pdt_0Nh56QUtvddsF51hA2cED
DODO_PRODUCT_ID_100=pdt_0Nh56YqBwD5YZhMKojjZA
DODO_RETURN_URL=thunder://wallet?status=success
DODO_CANCEL_URL=thunder://wallet?status=cancelled
```

Remove any `STRIPE_*` vars — not used.

**Redeploy after saving env vars.** `[ ]`

---

### Step 3E — Verify payment flow

1. Open app → Wallet tab → should say **"Secure checkout via Dodo Payments"** (not dev stub)
2. Tap +$25 → browser opens Dodo checkout
3. Use Dodo **test card** from their docs
4. Complete payment → webhook fires → wallet balance increases

| Placeholder | Your value |
|-------------|------------|
| **Test payment succeeded?** | `[ ] Yes` |
| **Wallet credited via webhook?** | `[ ] Yes` |

**Section 3 done?** `[ ]`

---

# Section 4 — API hosting (Render)

| Placeholder | Your value |
|-------------|------------|
| **RENDER_SERVICE_NAME** | `thunder-api` |
| **RENDER_API_PUBLIC_URL** | `https://thunder-api-efz5.onrender.com` |
| **RENDER_API_BASE** | `https://thunder-api-efz5.onrender.com/api/v1` |
| **Health check OK?** | Open **`https://thunder-api-efz5.onrender.com/api/v1/health`** (not `/` alone) → expect `{"success":true,"data":{"status":"ok",...}}` |

### Render env vars (full list)

```
NODE_ENV=production
DATABASE_URL=[Neon pooled URL]
REDIS_URL=[Upstash TCP URL]
JWT_ACCESS_SECRET=[random 32+ chars]
JWT_REFRESH_SECRET=[random 32+ chars]
DODO_PAYMENTS_MODE=test
DODO_PAYMENTS_API_KEY=[from 3A]
DODO_WEBHOOK_SECRET=[from 3C]
DODO_PRODUCT_ID_25=[from 3B]
DODO_PRODUCT_ID_50=[from 3B]
DODO_PRODUCT_ID_100=[from 3B]
DODO_RETURN_URL=thunder://wallet?status=success
DODO_CANCEL_URL=thunder://wallet?status=cancelled
```

**Done?** `[ ]` *(fill Render URL + confirm health + Dodo env vars)*

---

# Section 5 — Mobile → hosted API

File: `apps/mobile/.env` (local, gitignored)

```env
EXPO_PUBLIC_API_URL=https://thunder-api-efz5.onrender.com/api/v1
```

| Placeholder | Your value |
|-------------|------------|
| **EXPO_PUBLIC_API_URL** | `[paste Render API base]` |
| **Expo Go login works?** | `[ ]` |
| **Dodo checkout opens from wallet?** | `[ ]` |

**Done?** `[ ]`

---

# Section 6 — App Store (skipped)

| Placeholder | Your value |
|-------------|------------|
| **Skipped?** | `[x] Yes — Expo Go only for now` |

---

# Section 7 — Amazon Flex R&D (later)

| Placeholder | Your value |
|-------------|------------|
| **Notes** | `[free text]` |

---

# Master checklist

| # | Requirement | Status |
|---|-------------|--------|
| 1 | GitHub repo | `[x]` |
| 2 | Neon DATABASE_URL in Render | `[x]` |
| 3 | Render URL + health check | `[ ]` |
| 4 | Upstash REDIS_URL in Render | `[x]` |
| 5 | Dodo API key + 3 product IDs in Render | `[ ]` |
| 6 | Dodo webhook URL + secret | `[ ]` |
| 7 | EXPO_PUBLIC_API_URL on phone | `[ ]` |
| 8 | Test payment credits wallet | `[ ]` |

**Ready for integration pass?** `[ ]`

---

# Notes & blockers

```
Payment: switched from Stripe to Dodo Payments (India-friendly).
Code added: POST /wallet/checkout, POST /webhooks/dodo, mobile opens checkout in browser.

Blockers:
- [ ] Render URL not filled yet
- [ ] Dodo products not created yet
- [ ] Webhook not configured yet
```

---

# Change log

| Date | Change |
|------|--------|
| 2026-06-14 | Initial setup — Neon, Upstash, GitHub done |
| 2026-06-15 | Payment switched to Dodo Payments; Stripe removed |
