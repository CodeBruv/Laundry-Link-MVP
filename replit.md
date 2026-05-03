# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## LaundryLink Mobile App

- **Framework**: React Native + Expo SDK 54
- **Routing**: Expo Router (file-based) with role-based route groups
- **Auth**: Supabase Auth (email/password) with role in user metadata
- **Demo mode**: If Supabase keys are missing, app falls back to local demo auth with banner
- **Storage**: AsyncStorage for local persistence, expo-secure-store for tokens
- **State**: React Context + TanStack React Query
- **Orders**: OrdersProvider manages Supabase-backed order CRUD, realtime refresh, local fallback, offline queue
- **Supabase schema**: Full schema (RLS + profiles + businesses + orders + push_tokens) at `artifacts/laundry-link/supabase/schema.sql`
- **Marketplace model**: Pure SaaS subscription (Naira) + peer-to-peer payments between users; no platform wallets, no commissions
- **Styling**: React Native StyleSheet with design tokens in constants/colors.ts (dark mode via useColorScheme)
- **Offline**: offlineQueue.ts + OfflineBanner + network probe (no netinfo dependency)
- **Notifications**: expo-notifications with deep link tap handler in useNotifications hook
- **Maps**: Platform-split — OrderMap.tsx (web canvas) + OrderMap.native.tsx (MapView + Polyline)

### App Structure
```
artifacts/laundry-link/
  app/
    _layout.tsx                  # Root layout — providers, GestureHandler, DemoModeBanner, OfflineBanner
    index.tsx                    # Auth-based redirect
    (auth)/                      # Login + Signup
    (customer)/
      _layout.tsx                # Tabs: Home, Orders, New Order, Profile + 6 hidden screens
      index.tsx                  # Home — active orders, CTA, how-it-works, P2P note (no mock data)
      orders.tsx                 # Order list with status tracking
      create-order.tsx           # 4-step wizard (Pickup → Delivery → Services → Summary)
      profile.tsx                # Profile → navigates to all menu sub-screens
      saved-addresses.tsx        # Add/view/edit/default saved addresses (AsyncStorage)
      payment-methods.tsx        # P2P payment explainer (bank transfer, cash, card via Paystack)
      notifications-screen.tsx   # App notification list with mark-read
      help.tsx                   # FAQ accordion + contact form + WhatsApp/Email/Call
      terms.tsx                  # Terms of Service (10 sections, NDPR-aware)
      privacy.tsx                # Privacy Policy (9 sections, NDPR compliant)
    (business)/
      _layout.tsx                # Tabs: Dashboard, Orders, Analytics, Services, Plan, Profile
      index.tsx                  # Live stats, subscription gate, upgrade prompt
      orders.tsx                 # Business order management
      reports.tsx                # Analytics (revenue, status breakdown, service breakdown) — no CSV export
      services.tsx               # Custom service pricing
      subscription.tsx           # Plan management
      profile.tsx                # Business profile
    (dispatcher)/
      _layout.tsx                # Tabs: Dashboard, Deliveries, Profile + 3 hidden screens
      index.tsx                  # Dispatcher dashboard
      deliveries.tsx             # Active delivery list
      profile.tsx                # Profile → Vehicle Details, Service Area, KYC
      vehicle-details.tsx        # Vehicle type, plate, color, model (AsyncStorage)
      service-area.tsx           # Zone multi-select (Abuja zones, AsyncStorage)
      kyc.tsx                    # NIN + BVN + guarantor submission
    (admin)/
      index.tsx                  # Admin dashboard (live stats from OrdersContext)
      users.tsx                  # Users derived from order history
      businesses.tsx             # Business subscription status
    order/[id].tsx               # Order detail + live map + status update
  components/
    SubscriptionPaywall.tsx      # Naira plans (₦15k/₦35k/₦70k) + trial + upgrade/cancel
    PaymentModal.tsx             # Real Paystack (expo-web-browser) + demo fallback
    DemoModeBanner.tsx           # Amber banner when demo mode active
    OfflineBanner.tsx            # Slides down when offline
    SkeletonLoader.tsx           # Skeleton cards for loading states
  contexts/
    AuthContext.tsx              # Supabase auth + demo signIn + route guard
    OrdersContext.tsx            # Order CRUD + realtime + offline queue flush
    SubscriptionContext.tsx      # canAccess(feature), beginTrial, purchasePlan, cancel
  lib/
    subscription.ts              # SUBSCRIPTION_PLANS (Naira), canAccessFeature, getPlanLimits
    offlineQueue.ts              # AsyncStorage-backed queue for offline order creation
    supabase.ts                  # Supabase client singleton
  hooks/
    useColors.ts                 # Reads colors.ts with useColorScheme for dark/light
    useNetworkStatus.ts          # Periodic fetch probe for offline detection
    useNotifications.ts          # Push token registration + deep link tap handler
  constants/
    colors.ts                    # Light (#f7f9fc bg, #0a2342 primary) + Dark (#09162a bg) palettes
    services.ts                  # LAUNDRY_SERVICES price list
  supabase/
    schema.sql                   # Full RLS schema — profiles, businesses, orders, push_tokens
  types/
    index.ts                     # Order, OrderItem, SubscriptionState, SubscriptionTier types
```

### Subscription Tiers (Naira, SaaS)
| Plan       | Price      | Orders | Dispatchers |
|------------|------------|--------|-------------|
| Starter    | ₦15,000/mo | 50     | 1           |
| Pro        | ₦35,000/mo | 250    | 5           |
| Enterprise | ₦70,000/mo | ∞      | ∞           |

7-day free trial available. Upgrade/downgrade/cancel supported.

### Payment Flow (P2P — No Platform Money)
1. Customer places order (no upfront payment)
2. Rider arrives → Customer pays **pickup fee** directly (cash or bank transfer)
3. Laundromat marks READY → Customer pays **service + delivery fee** (Paystack card or bank transfer)
4. Laundromat confirms payment → Rider dispatched for delivery
5. Rider paid directly by laundromat or customer — no in-app wallet

### Design System
- Primary: #0a2342 (deep navy, slightly brighter than before)
- Accent: #1d4ed8 (blue)
- Background: #f7f9fc (light) / #09162a (dark)
- Font: Inter (400/500/600/700)
- Auto dark mode via `useColorScheme`

### User Roles
- CUSTOMER: Place orders, track, pay via P2P
- BUSINESS: Manage laundromat, accept orders, confirm payments, subscription-gated
- DISPATCHER: Handle pickup/delivery, KYC, zone-based matching
- ADMIN: Platform management (users, businesses, orders, stats)

### Environment Variables
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY
- EXPO_PUBLIC_PAYSTACK_KEY (starts with pk_ → real Paystack; absent → demo sim)
- SESSION_SECRET (API server)

### EAS Build Commands (Production APK/IPA)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure project (first time only)
cd artifacts/laundry-link
eas build:configure

# Android APK (test devices — no Play Store)
eas build --platform android --profile preview

# Android AAB (Play Store submission)
eas build --platform android --profile production

# iOS IPA (TestFlight / App Store)
eas build --platform ios --profile production

# Check build status
eas build:list
```

Add to `artifacts/laundry-link/eas.json`:
```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "preview": {
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" },
      "ios": {}
    }
  }
}
```

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages (currently: 0 errors)
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
