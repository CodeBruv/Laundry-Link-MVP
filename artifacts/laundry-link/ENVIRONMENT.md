# LaundryLink — Environment & Configuration Guide

## Overview

This document covers how environment variables work, how to set up each environment, and what must be configured before production.

All environment variables in the mobile app use the `EXPO_PUBLIC_` prefix. Values without this prefix are not accessible to client-side code.

---

## Files

| File | Purpose |
|---|---|
| `.env` | Local overrides — **never commit this file** |
| `.env.example` | Template showing all available variables with descriptions |
| `constants/env.ts` | Centralized env access, placeholder detection, startup validation |
| `constants/businessConfig.ts` | PurePress business identity and operational defaults |

---

## Environment Separation

Set `EXPO_PUBLIC_APP_ENV` to control which environment is active:

| Value | Behaviour |
|---|---|
| `development` | Warnings on missing vars. Demo mode allowed. Verbose logging. |
| `staging` | Same as development but pointed at staging Supabase/API. |
| `production` | Missing required vars produce console errors. Debug logs suppressed. |

`IS_DEV` in `constants/env.ts` also reflects Expo's `__DEV__` flag (true in Metro dev server, false in production builds).

---

## Environment Variables

### Supabase (Required for live mode)

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**If absent:** The app runs in **demo mode**. All data is stored locally on the device using AsyncStorage. No real auth, no real orders saved to the database. The amber `DemoModeBanner` is displayed.

**Where to get them:** Supabase Dashboard → Project Settings → API → Project URL and anon/public key.

**Important:** The app uses `AsyncStorage` (not `expo-secure-store`) to persist Supabase sessions. This is intentional — `expo-secure-store` has a 2 KB per-value limit on iOS that silently truncates JWT session payloads.

---

### Paystack (Required for real payments)

```
EXPO_PUBLIC_PAYSTACK_KEY=pk_test_...    # testing
EXPO_PUBLIC_PAYSTACK_KEY=pk_live_...    # production
```

**If absent:** `PaymentModal` displays a bank transfer UI. The "I've completed the transfer" button generates a local fake reference and calls `onSuccess()` immediately — no Paystack API call is made, no payment is verified.

**Where to get:** Paystack Dashboard → Settings → API Keys & Webhooks.

**Webhook:** In production, the Paystack dashboard must have a webhook URL pointing to `POST /api/paystack/webhook` on the API server. This endpoint does not yet exist (see TASK-PAY-01 in `laundry-link-v1-backlog.md`).

---

### API Server (Required for webhooks and cross-device push)

```
EXPO_PUBLIC_API_URL=https://api.purepresslaundry.com
```

**If absent:** Server-side features are unavailable:
- Paystack webhook verification
- Cross-device push notifications
- Server-side order validation

**Local development:** Leave blank. The Replit proxy routes `/api` traffic to the local Express server automatically.

---

### Admin Passphrase (Optional — development aid)

```
EXPO_PUBLIC_ADMIN_PASSPHRASE=your-secret-passphrase
```

**If absent:** Passphrase-based Super Admin elevation is disabled. The `unlockSuper()` function returns `false` for any input.

**Production recommendation:** Do not rely on the passphrase in production. Instead, set `admin_tier = "SUPER"` in `user_metadata` directly from the Supabase dashboard for admin accounts. This is the only mechanism that works without the env var.

---

## How to Switch Environments

### Development (local, no Supabase)

```env
EXPO_PUBLIC_APP_ENV=development
# Leave Supabase vars unset — app runs in demo mode
```

### Development (local, with Supabase)

```env
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
EXPO_PUBLIC_PAYSTACK_KEY=pk_test_your_test_key
```

### Production (EAS Build)

Set these as EAS secrets (never in .env file):

```bash
eas secret:create --name EXPO_PUBLIC_APP_ENV --value production
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value https://prod.supabase.co
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value your-prod-anon-key
eas secret:create --name EXPO_PUBLIC_PAYSTACK_KEY --value pk_live_your-live-key
eas secret:create --name EXPO_PUBLIC_API_URL --value https://api.purepresslaundry.com
eas secret:create --name EXPO_PUBLIC_ADMIN_PASSPHRASE --value your-secret
```

---

## Business Configuration

All PurePress Laundry business values are centralized in `constants/businessConfig.ts`. Do not scatter business-specific strings across screen files.

| Key | Current Value | Purpose |
|---|---|---|
| `id` | `purepress-jos` | Supabase business ID — must match the `businesses` table row |
| `name` | PurePress Laundry | Display name in orders and UI |
| `parentCompany` | Code Bruv Technologies LTD | Legal entity |
| `email` | support@purepresslaundry.com | Support contact |
| `phone` | 08024945119 | Customer-facing phone |
| `website` | purepresslaundry.com | Website |
| `city` | Jos | Operating city — controls laundromat picker |
| `state` | Plateau State | Operating state |
| `bankName` | Access Bank | Shown in PaymentModal |
| `accountNumber` | 0000000000 | **Placeholder — replace before payment testing** |
| `accountName` | PurePress Laundry | Shown in PaymentModal |
| `defaultDeliveryFee` | 1500 | ₦ fallback if not specified by laundromat |
| `defaultPickupFee` | 600 | ₦ pickup fee shown to customers |
| `primaryColor` | `#0077b6` | Ocean Blue brand primary |
| `secondaryColor` | `#f5f5f0` | Off White brand secondary |

---

## Startup Validation

`validateEnv()` runs once at app startup (called in `app/_layout.tsx` before providers mount). It checks all required variables and logs structured messages:

```
[PurePress ENV] ✗ EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY not set — app will run in demo mode.
[PurePress ENV] ⚠ EXPO_PUBLIC_PAYSTACK_KEY not set — payment flow is bank-transfer simulation only.
[PurePress ENV] ⚠ EXPO_PUBLIC_API_URL not set — webhooks, push dispatch, and server features are unavailable.
```

Errors (`✗`) indicate the app will have degraded functionality.  
Warnings (`⚠`) appear only in development builds — they are suppressed in production.

---

## Missing Credentials Required Before Production

| Credential | Where to Get | Needed For |
|---|---|---|
| Production Supabase URL + key | Supabase dashboard (prod project) | All live data |
| Paystack live public key | Paystack dashboard | Real card payments |
| Paystack secret key (server-side) | Paystack dashboard | Webhook verification |
| Production API domain | Deploy `artifacts/api-server` | Webhooks, push notifications |
| PurePress bank account number | Business owner | PaymentModal bank transfer |
| APNs certificate | Apple Developer Portal | iOS push notifications |
| FCM server key | Google Cloud Console | Android push notifications |
| Admin passphrase | Define it | Super admin elevation |
| `SESSION_SECRET` (API server) | Generate with `openssl rand -hex 32` | Express session security |

---

## Demo Mode vs. Production Mode

| Feature | Demo Mode (no Supabase keys) | Production Mode (keys set) |
|---|---|---|
| Auth | Local AsyncStorage fake user | Real Supabase JWT auth |
| Orders | AsyncStorage only | Supabase `orders` table + realtime |
| Notifications | Device-local only | Device-local (server push pending) |
| Subscription | AsyncStorage | AsyncStorage (Supabase sync pending) |
| Payments | Bank transfer simulation | Bank transfer simulation (Paystack pending) |
| DemoModeBanner | Shown | Hidden |

Demo mode is a **development aid only**. It is never a production fallback. If keys are set but Supabase is unreachable, real auth errors are surfaced to the user.
