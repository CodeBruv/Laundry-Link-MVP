---
name: PurePress configuration
description: Canonical business identity, env var layout, and Sprint 1 production hardening decisions for LaundryLink V1.0
---

## Business identity
- Business ID: `purepress-jos` (must match Supabase `businesses.id` row — not yet seeded, see TASK-AUTH-01)
- Name: PurePress Laundry
- City: Jos, Plateau State, Nigeria
- All values centralized in `constants/businessConfig.ts`

## Primary color
Ocean Blue `#0077b6` — updated in `constants/colors.ts` (light.primary, light.tint, light.secondary=#005a8a). Splash/icon background in app.json still has old `#0a1d38` — update before production builds.

## Env var layout
- `constants/env.ts` — single source of truth; `IS_SUPABASE_CONFIGURED`, `IS_PAYSTACK_CONFIGURED`, `validateEnv()`
- `constants/businessConfig.ts` — business identity and pricing defaults
- `services.ts` re-exports `DEFAULT_BUSINESS_ID / DEFAULT_BUSINESS_NAME` from businessConfig for backward compat
- `OrdersContext.tsx` imports from businessConfig directly; also imports `DEFAULT_DELIVERY_FEE`

## Demo mode
Demo mode = `!IS_SUPABASE_CONFIGURED`. Not a production fallback — just for dev without keys. See `demo-mode.md`.

## Pre-existing typecheck errors (not introduced by Sprint 1)
- `components/OrderMap.native.tsx` — react-native-maps type incompatibility (MapView, Polyline, Marker)
- `GestureHandlerRootViewProps children` — pre-existing library type version mismatch
These are not blocking (Metro/Expo ignores them at runtime).

## What still needs doing before production
- Bank account number in businessConfig is `0000000000` (placeholder)
- `app.json` splash/icon/notification colors still `#0a1d38` — update to `#0077b6`
- Supabase `businesses` row for `purepress-jos` not seeded
- DISPATCHERS array is intentionally empty pending real Supabase query (TASK-DISP-01)
