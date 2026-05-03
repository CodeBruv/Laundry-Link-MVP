# LaundryLink — MVP Build Log

## Project Overview
LaundryLink is a **React Native + Expo SDK 54** mobile app (TypeScript) — an Uber-for-laundry marketplace SaaS.
- **Multi-role**: Customer, Business (laundromat), Dispatcher, Admin
- **Business model**: Pure SaaS subscription ($29/$79/$149/mo) — no commissions, no wallets
- **Auth**: Supabase Auth with AsyncStorage local demo mode fallback
- **Navigation**: Expo Router with role-based tab groups

## Brand
- Primary: `#092d52` (navy)
- Accent: `#1e40af` (blue)
- Background: `#f5f9ff`
- Font: Inter (400/500/600/700) via `@expo-google-fonts/inter`

## Architecture

```
artifacts/laundry-link/
├── app/
│   ├── _layout.tsx              # Root layout — fonts, providers, PushTokenRegistrar
│   ├── index.tsx                # Auth router (redirects by role)
│   ├── (auth)/                  # Login + Signup screens
│   ├── (customer)/              # Customer tabs: Home, Orders, Create Order, Profile
│   ├── (business)/              # Business tabs: Dashboard, Orders, Reports, Services, Plan, Profile
│   ├── (dispatcher)/            # Dispatcher tabs: Dashboard, Deliveries, Profile
│   ├── (admin)/                 # Admin tabs: Dashboard, Users, Businesses, Settings
│   └── order/[id].tsx           # Unified order detail for all roles
├── components/
│   ├── OrderMap.tsx             # Web map — grid placeholder with animated driver dot + ETA
│   ├── OrderMap.native.tsx      # Native map — react-native-maps + Polyline + animateToRegion + ETA
│   ├── OrderTimeline.tsx        # Chronological status history with Feather icons
│   ├── StatusBadge.tsx          # Color-coded status pill (all 9 statuses)
│   ├── PaymentModal.tsx         # Simulated Paystack card checkout (1.8s processing)
│   ├── SubscriptionPaywall.tsx  # 3-tier plan cards with trial/pay toggle
│   ├── DemoModeBanner.tsx       # Yellow banner shown when Supabase not configured
│   └── ErrorBoundary.tsx        # Top-level error boundary
├── contexts/
│   ├── AuthContext.tsx          # Supabase auth + demo mode, role routing
│   ├── OrdersContext.tsx        # Full order CRUD, realtime, markOrderPaid, location sharing
│   └── SubscriptionContext.tsx  # AsyncStorage subscription state, beginTrial, purchasePlan, cancel
├── lib/
│   ├── supabase.ts              # Supabase client with isSupabaseConfigured guard
│   ├── notifications.ts         # Lazy expo-notifications import, typed event helpers
│   └── subscription.ts         # SUBSCRIPTION_PLANS, storage ops, daysLeft
├── types/index.ts               # All TypeScript types (Order, OrderStatus, etc.)
├── hooks/useColors.ts           # Design token hook (colors, radius, etc.)
└── constants/services.ts        # DEFAULT_BUSINESS_ID, DISPATCHERS list
```

## Order Lifecycle
```
PENDING → ACCEPTED → PICKED_UP → IN_PROGRESS → READY
  → (Customer pays) → PAID → OUT_FOR_DELIVERY → DELIVERED
  or → CANCELLED (any point before DELIVERED)
```

## Key Features (Day 1–5 Complete)

### Day 1–2: Foundation
- Full app scaffold — auth screens, 4 role-based tab layouts
- Supabase client with demo mode fallback
- OrdersContext with realtime subscriptions
- Multi-step customer order creation wizard (4-step)

### Day 3: Dispatcher & Map
- `deliveryFee` (flat ₦1,500) as separate line item
- Dispatcher location-sharing toggle with expo-location
- `OrderMap.tsx` (web) + `OrderMap.native.tsx` (react-native-maps) — Metro split
- OrderTimeline with Feather icons, upgraded status system

### Day 4: Payments & Subscriptions
- `PAID` status added to full stack
- `SubscriptionContext` + `lib/subscription.ts` (7-day trial, AsyncStorage)
- `SubscriptionPaywall.tsx` — 3-tier plan cards ($29/$79/$149)
- `PaymentModal.tsx` — simulated Paystack card checkout
- Business Dashboard + Orders tab gated behind subscription
- Customer Pay Now button (status=READY) → PaymentModal → `markOrderPaid`
- Business sees "Payment received" banner on PAID orders

### Day 5: Polish & Reports (Final MVP)
- **Native map**: Polyline route, `animateToRegion` on driver location update, ETA overlay
- **Web map**: Grid background, animated pulsing driver dot, ETA calculation (haversine)
- **Notifications**: Lazy import (Expo Go safe), typed helpers — `notifyNewOrder`, `notifyStatusChange`, `notifyOrderReady`, `notifyPaymentReceived`, `notifyDispatcherAssigned`
- **Push token**: Registered per userId on login, stored in AsyncStorage
- **Reports tab** (Business): Revenue by service, date range filter, status breakdown, CSV export (Share API on native, Blob download on web)
- **Customer home**: Active order banner, "How it works" steps, CTA card wired to create-order
- **Share App** in both Customer + Business profiles
- **Business profile**: Subscription status card, contact support mailto link

## Environment Variables
```
EXPO_PUBLIC_SUPABASE_URL     # Supabase project URL
EXPO_PUBLIC_SUPABASE_ANON_KEY # Supabase anon key
```
Both optional — app falls back to local AsyncStorage demo mode.

## Storage Keys
- `laundry_link_orders_v4` — order data
- `laundry_link_order_history_v4` — status history
- `ll_subscription_v1` — subscription state
- `ll_push_token_<userId>` — per-user push token

## Database (Supabase)
Run `supabase/orders.sql` in the Supabase SQL editor.
Tables: `orders`, `order_items`, `order_status_history`
All tables have RLS policies for each role (Customer/Business/Dispatcher).

## Known Limitations (MVP)
- Push notifications fire as local notifications only (expo-notifications push tokens require a development build, not Expo Go)
- Payment is simulated (Paystack integration requires API keys + webhook server)
- Maps on native use react-native-maps (Apple Maps on iOS, Google Maps on Android)
- Business discovery / marketplace is a placeholder (single hardcoded business: CleanPro Abuja)

## Next Steps for Launch
1. Wire Paystack live keys + webhook → real payment confirmation
2. Expo EAS Build → `.ipa` / `.apk` for TestFlight / Play Store beta
3. Supabase Edge Function for push notifications to other users on status change
4. Add Google Maps API key for Android react-native-maps satellite view
5. Onboard first 3 laundromats in Abuja for closed beta
