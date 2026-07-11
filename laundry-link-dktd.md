# LaundryLink — Developer Knowledge Transfer Document (DKTD)

**Document type:** Developer Knowledge Transfer  
**Audience:** Incoming engineering team with React Native / backend experience, zero prior LaundryLink knowledge  
**Codebase as of:** July 11, 2026  
**Status:** No code was modified, refactored, or generated during the preparation of this document  

---

## Section 1 — Project Overview

### What LaundryLink Is

LaundryLink is a multi-role mobile-first marketplace platform for on-demand laundry services, targeting Nigeria (initially Jos, with Abuja and Lagos laundromats also seeded). It coordinates three types of participants:

- **Customers** who need laundry collected, cleaned, and returned
- **Businesses** (laundromats) who receive orders, process garments, and confirm payment
- **Dispatchers** (riders) who perform the physical pickup and delivery

A fourth role, **Admin**, manages the platform itself.

The app is cross-platform (iOS + Android via Expo, plus a web build for browser-based testing) but is designed primarily for native mobile use.

### Business Model

LaundryLink operates on a **pure SaaS subscription model** for laundromats. There are zero platform commissions. The platform earns by charging laundromats a monthly Naira-denominated fee to access the platform.

Payments between customers, businesses, and dispatchers are **peer-to-peer (P2P)** — the platform never holds money. All financial transactions happen directly between parties via bank transfer or Paystack card checkout. The laundromat receives money directly into their own bank account or Paystack merchant account.

This distinction is architecturally important: the app does **not** implement any escrow, wallet, or commission deduction logic.

### Subscription Tiers

Defined in `artifacts/laundry-link/lib/subscription.ts`:

| Plan | Price | Max Orders/mo | Max Dispatchers |
|---|---|---|---|
| Starter | ₦10,000 | 50 | 1 |
| Pro | ₦18,000 | 250 | 5 |
| Enterprise | ₦30,000 | Unlimited | Unlimited |

**Note:** The `replit.md` documentation states different prices (₦15k/₦35k/₦70k). The source code is authoritative. The documentation is out of date.

### Supported User Roles

| Role | TypeScript value | Access Group |
|---|---|---|
| Customer | `"CUSTOMER"` | `/(customer)/` |
| Business | `"BUSINESS"` | `/(business)/` |
| Dispatcher | `"DISPATCHER"` | `/(dispatcher)/` |
| Admin | `"ADMIN"` | `/(admin)/` |

Roles are set at signup, stored in Supabase `user_metadata.role`, and carried in every JWT. There is no role-switching mechanism — a user is permanently one role unless a Supabase dashboard admin manually edits their metadata.

### Target Users

Nigerian laundromats (Abuja, Jos, Lagos), their customers, and freelance riders operating in those cities. The app uses Naira (₦) throughout and references Nigerian banking infrastructure (GTBank, Access Bank, Zenith, First Bank).

### Current Implementation Philosophy

The project follows a **client-heavy, backend-light** approach. All business logic (order creation, subscription management, status transitions, payment confirmation) runs on the client and communicates directly with Supabase using the public anon key. The Express API server (`artifacts/api-server`) exists but is nearly empty — it is a structural placeholder for future server-side logic.

The codebase avoids mocks and fake data on live screens. A dedicated **demo mode** (triggered by absent Supabase environment variables) provides full app simulation using AsyncStorage only.

---

## Section 2 — Repository Structure

### Root Layout

```
/home/runner/workspace/
├── artifacts/
│   ├── api-server/          Express 5 backend (stub — nearly empty)
│   ├── laundry-link/        React Native + Expo mobile app (the main product)
│   └── mockup-sandbox/      Vite component preview server (design tooling only)
├── lib/                     Shared TypeScript libraries (workspace packages)
├── scripts/                 Utility scripts (workspace package)
├── pnpm-workspace.yaml      pnpm workspace definition, catalog pins, overrides
├── tsconfig.base.json       Shared strict TypeScript defaults
├── tsconfig.json            Root TS solution config (libs only)
├── package.json             Root task orchestration + shared dev tooling
└── replit.md                Project README and engineering notes
```

This is a **pnpm monorepo**. Each package in `artifacts/` and `lib/` declares its own dependencies. Nothing is shared implicitly. The workspace is managed by Replit's workflow system, which injects `PORT` and `BASE_PATH` environment variables at runtime.

### `artifacts/laundry-link/` — The Mobile App

This is the entire product. Every screen, context, hook, library, and type lives here.

```
artifacts/laundry-link/
├── app/                        Expo Router screen files (file-based routing)
│   ├── _layout.tsx             Root layout — providers, fonts, banners
│   ├── index.tsx               Auth redirect (no UI rendered here)
│   ├── +not-found.tsx          404 fallback screen
│   ├── (auth)/                 Unauthenticated screens
│   │   ├── _layout.tsx         Stack layout for auth screens
│   │   ├── login.tsx           Email/password login
│   │   └── signup.tsx          Registration with role selector
│   ├── (customer)/             Customer tab group
│   │   ├── _layout.tsx         Tab bar: Home, Orders, New Order, Profile
│   │   ├── index.tsx           Customer home
│   │   ├── create-order.tsx    4-step order wizard
│   │   ├── orders.tsx          Order list
│   │   ├── profile.tsx         Profile hub
│   │   ├── saved-addresses.tsx AsyncStorage address book
│   │   ├── payment-methods.tsx P2P payment explainer
│   │   ├── notifications-screen.tsx App notification inbox
│   │   ├── help.tsx            FAQ + contact
│   │   ├── terms.tsx           Terms of Service
│   │   └── privacy.tsx         Privacy Policy
│   ├── (business)/             Business tab group
│   │   ├── _layout.tsx         Tab bar: Dashboard, Orders, Analytics, Services, Plan, Profile
│   │   ├── index.tsx           Business home (stats + paywall)
│   │   ├── orders.tsx          Order management
│   │   ├── reports.tsx         Revenue analytics
│   │   ├── services.tsx        Custom service pricing
│   │   ├── subscription.tsx    Subscription management
│   │   └── profile.tsx         Business profile
│   ├── (dispatcher)/           Dispatcher tab group
│   │   ├── _layout.tsx         Tab bar: Dashboard, Deliveries, Profile
│   │   ├── index.tsx           Dispatcher home
│   │   ├── deliveries.tsx      Active deliveries
│   │   ├── profile.tsx         Profile hub
│   │   ├── vehicle-details.tsx Vehicle info (AsyncStorage)
│   │   ├── service-area.tsx    Zone selection (AsyncStorage)
│   │   └── kyc.tsx             KYC form (UI only — no backend)
│   ├── (admin)/                Admin tab group
│   │   ├── _layout.tsx         Tab bar: Overview, Users, Orders, Analytics, Settings
│   │   ├── index.tsx           Admin dashboard
│   │   ├── users.tsx           User management
│   │   ├── orders.tsx          Platform order monitor
│   │   ├── analytics.tsx       Revenue + system health
│   │   ├── settings.tsx        Role hierarchy + activity log
│   │   └── businesses.tsx      Businesses view (hidden from tab bar)
│   └── order/
│       └── [id].tsx            Dynamic order detail screen (all roles)
├── components/                 Shared UI components
│   ├── DemoModeBanner.tsx
│   ├── EmptyState.tsx
│   ├── ErrorBoundary.tsx
│   ├── ErrorFallback.tsx
│   ├── KeyboardAwareScrollViewCompat.tsx
│   ├── OfflineBanner.tsx
│   ├── OrderCard.tsx
│   ├── OrderMap.tsx            Web canvas map fallback
│   ├── OrderMap.native.tsx     Native MapView (react-native-maps)
│   ├── OrderTimeline.tsx
│   ├── PaymentModal.tsx        Bank transfer P2P UI
│   ├── RoleSelector.tsx
│   ├── SkeletonLoader.tsx
│   ├── StatusBadge.tsx
│   └── SubscriptionPaywall.tsx
├── constants/
│   ├── colors.ts               Light + dark design token palettes
│   ├── laundromats.ts          Hardcoded laundromat list (Jos/Abuja/Lagos)
│   └── services.ts             Default services, DEFAULT_BUSINESS_ID, DISPATCHERS list
├── contexts/
│   ├── AuthContext.tsx         Auth state, session, route guard
│   ├── OrdersContext.tsx       Order CRUD, realtime, offline queue
│   └── SubscriptionContext.tsx Subscription state (AsyncStorage only)
├── hooks/
│   ├── useAdminAccess.ts       SUPER vs STAFF admin tier
│   ├── useColors.ts            Design token accessor (always light mode)
│   ├── useNetworkStatus.ts     Periodic connectivity probe
│   └── useNotifications.ts    Push token registration + deep link handler
├── lib/
│   ├── notifications.ts        Expo push notification helpers
│   ├── offlineQueue.ts         AsyncStorage-backed order queue
│   ├── subscription.ts         Plan definitions + AsyncStorage subscription CRUD
│   └── supabase.ts             Supabase client singleton + connection probe
├── supabase/
│   └── schema.sql              Complete PostgreSQL schema with RLS
└── types/
    └── index.ts                All shared TypeScript interfaces and types
```

### `artifacts/api-server/` — The Backend (Stub)

```
artifacts/api-server/
├── src/
│   ├── app.ts           Express 5 app (CORS, Pino HTTP, /api routes)
│   ├── index.ts         Entry point — binds to PORT env var
│   ├── lib/
│   │   └── logger.ts    Pino singleton logger
│   ├── middlewares/     Empty placeholder directory
│   └── routes/
│       ├── health.ts    GET /api/healthz → { status: "ok" }
│       └── index.ts     Route aggregator
└── build.mjs            esbuild bundler config
```

The API server is a structural scaffold. It has no database connection, no auth, no business logic. Its only purpose currently is a health check endpoint.

### Important Configuration Files

| File | Purpose |
|---|---|
| `pnpm-workspace.yaml` | Declares workspace packages and dependency catalog |
| `tsconfig.base.json` | Shared strict TS compiler defaults extended by all packages |
| `artifacts/laundry-link/app.json` | Expo app configuration (name, slug, permissions, plugins) |
| `artifacts/laundry-link/package.json` | App-level dependencies |
| `artifacts/laundry-link/supabase/schema.sql` | The only source of truth for the database schema |
| `.env` | Contains `CI=1` which puts Metro bundler in CI mode (no watch, no auto-reload) |

---

## Section 3 — Technology Stack

### React Native (Expo SDK 54)

**Purpose:** Cross-platform mobile UI framework targeting iOS, Android, and Web.  
**Where used:** The entire `artifacts/laundry-link/` app.  
**Why chosen:** Expo's managed workflow eliminates native build tooling complexity. SDK 54 is stable with good Supabase and Paystack library support.  
**Key interaction:** React Native renders all screens. Platform-specific code is split using `.native.tsx` vs `.tsx` file extensions (see `OrderMap.native.tsx` vs `OrderMap.tsx`).

### Expo Router v6

**Purpose:** File-based routing system for the app. Replaces React Navigation.  
**Where used:** `app/` directory — every `.tsx` file in `app/` is a route.  
**How routing works:**
- Files in `(group)/` folders create route groups with shared layouts
- `_layout.tsx` in each group defines the navigator (Stack or Tabs)
- `[id].tsx` creates dynamic routes (used in `order/[id].tsx`)
- Navigation is performed via `useRouter()` hook → `router.push(path)` or `router.replace(path)`
- The root `app/_layout.tsx` uses a `Stack` navigator; each role group uses a `Tabs` navigator

**Important:** `href: null` in a `<Tabs.Screen>` hides a screen from the tab bar but still makes it accessible via `router.push`. This is how `businesses.tsx` is accessible in the admin section without having a tab icon.

### TypeScript 5.9

**Purpose:** Static typing across the entire monorepo.  
**Where used:** Every `.ts` and `.tsx` file.  
**Setup:** `tsconfig.base.json` at the root provides shared strict defaults. `artifacts/laundry-link/tsconfig.json` extends it. Leaf artifacts use `tsc --noEmit` for checking, not emit.  
**Known issues:** 22 pre-existing TypeScript errors exist, all in third-party type definitions (`BlurView`, `MapView`, `GestureHandlerRootView`) — these are type-definition version mismatches, not logic errors, and the app runs correctly despite them.

### Supabase

**Purpose:** Backend-as-a-service providing Authentication, PostgreSQL database, and Realtime subscriptions.  
**Where used:**
- `lib/supabase.ts` — client singleton instantiation
- `contexts/AuthContext.tsx` — `supabase.auth.*` for login/signup/signout/session
- `contexts/OrdersContext.tsx` — `supabase.from("orders").*` for all order CRUD
- `hooks/useNotifications.ts` — push token storage in `push_tokens` table
**Why chosen:** Provides auth, database, and realtime in one service. The anon key model means the client can interact with the database directly under RLS policies without a backend API.  
**Session storage:** AsyncStorage (deliberately — expo-secure-store has a 2 KB per-value limit on iOS that silently fails with full Supabase session payloads).

### Paystack

**Purpose:** Nigerian payment gateway for card payments.  
**Where used:** `components/PaymentModal.tsx`  
**Important:** The `PaymentModal` component does NOT open a Paystack web checkout. It is a **bank transfer UI** that displays laundromat bank account details, lets the customer copy the account number, and has a "I've completed the transfer" button that generates a fake reference locally and calls `onSuccess()` immediately. There is no Paystack API call, no charge, no verification.  
**Environment variable:** `EXPO_PUBLIC_PAYSTACK_KEY` — present in documentation but the current `PaymentModal` implementation ignores it entirely.

### AsyncStorage (`@react-native-async-storage/async-storage`)

**Purpose:** Persistent key-value storage on the device.  
**Where used in every major system:**

| Key | Contents | Used by |
|---|---|---|
| `demo_user` | Serialized demo User object | AuthContext |
| `demo_role` | Role string | AuthContext |
| `user_role` | Role string (redundant — JWT already has it) | AuthContext |
| `admin_super_session` | `"1"` if SUPER session is active | useAdminAccess |
| `ll_subscription_v1` | Serialized SubscriptionState | lib/subscription.ts |
| `ll_push_token` | Expo push token | lib/notifications.ts |
| `ll_push_token_{userId}` | Per-user Expo push token | lib/notifications.ts |
| `laundry_link_orders_v4` | Serialized Order[] for offline | OrdersContext |
| `laundry_link_order_history_v4` | Serialized OrderStatusHistory[] | OrdersContext |
| `ll_offline_queue_v1` | Serialized QueuedOrder[] | lib/offlineQueue.ts |

**Critical limitation:** AsyncStorage is device-local. Clearing app data or reinstalling the app permanently deletes subscription state, saved addresses, and vehicle details.

### TanStack React Query

**Purpose:** Server state management with caching and automatic refetch.  
**Where used:** `app/_layout.tsx` wraps the app in `QueryClientProvider`. That is the extent of its usage — **no `useQuery` or `useMutation` calls exist anywhere in the app**. It is installed but completely unused.

### Context API (React)

**Purpose:** Global state management without Redux or Zustand.  
**Where used:** Three core contexts: `AuthContext`, `OrdersContext`, `SubscriptionContext`. All are manually implemented with `createContext`, `useContext`, `useState`, and `useCallback`.

### Expo Router Navigation

Already described above. Key hooks:
- `useRouter()` — imperative navigation (`push`, `replace`, `back`)
- `useSegments()` — current route segments (used in the auth guard)
- `Link` — declarative link component (used in auth screens)

### Maps (`react-native-maps`)

**Purpose:** Display order location, driver position, pickup/delivery routes.  
**Where used:** `components/OrderMap.native.tsx` (iOS/Android), `components/OrderMap.tsx` (web canvas fallback)  
**Native implementation:** `MapView`, `Polyline`, `Marker` from `react-native-maps`  
**Web implementation:** An HTML5 Canvas element draws a simplified route representation — not a real map  
**Known TS errors:** `MapView`, `Polyline`, `Marker` all throw TS2786 due to type definition version mismatch — the app runs correctly on native despite these

### Expo Notifications (`expo-notifications`)

**Purpose:** Local and push notifications.  
**Where used:** `lib/notifications.ts`, `hooks/useNotifications.ts`  
**Important limitation:** The module is **lazily imported** (not at the top of the file) to avoid crashing Expo Go on Android SDK 53+. All notification calls are wrapped in try/catch and silently fail when permissions are denied or the environment doesn't support them.  
**Critical architectural gap:** All notifications are **device-local only**. `scheduleNotificationAsync` fires on the triggering device. Cross-device push delivery requires a server-side Expo Push API call, which is not implemented.

### Express 5 (API Server)

**Purpose:** HTTP server for backend endpoints.  
**Where used:** `artifacts/api-server/src/`  
**Current state:** One route implemented (`GET /api/healthz`). No database connection. No auth. No business logic. Runs at port injected by `$PORT` environment variable.

### Pino Logger

**Purpose:** Structured JSON logging for the API server.  
**Where used:** `artifacts/api-server/src/lib/logger.ts` (singleton), `app.ts` (Pino HTTP middleware)  
**Pattern:** Route handlers must use `req.log.info(...)` not `console.log`. Non-request code uses the imported `logger` singleton.

### `expo-blur` (`BlurView`)

**Purpose:** Glassmorphism tab bar background on iOS.  
**Where used:** All four `_layout.tsx` files (customer, business, dispatcher, admin)  
**Known issue:** `BlurView` cannot be used as JSX due to type definition incompatibility (TS2786). The code works at runtime on iOS but fails TypeScript checks.

### `expo-haptics`

**Purpose:** Tactile feedback on native (vibration patterns).  
**Where used:** `PaymentModal.tsx`, `SubscriptionPaywall.tsx`, `login.tsx`, `signup.tsx`  
**Pattern:** Always wrapped in `if (Platform.OS !== "web")` guard since haptics don't exist on web.

### `expo-clipboard`

**Purpose:** Copy text to device clipboard.  
**Where used:** `PaymentModal.tsx` — copies bank account number  
**Pattern:** Lazily imported via `await import("expo-clipboard")` to avoid load failures.

### `react-native-safe-area-context`

**Purpose:** Provides inset values for notch/home bar avoidance.  
**Where used:** Every screen uses `useSafeAreaInsets()` to add correct `paddingBottom` to scrollable content.

### `react-native-gesture-handler`

**Purpose:** Better touch handling than React Native's default gesture system.  
**Where used:** `app/_layout.tsx` wraps everything in `GestureHandlerRootView`  
**Known TS error:** TS2322 on `GestureHandlerRootView` props — runtime works correctly.

---

## Section 4 — Application Startup Flow

When the app launches, the following sequence occurs in order:

### Step 1: Font Loading (before any UI)

`app/_layout.tsx` calls `useFonts()` with four Inter weights. Until fonts are loaded (or a font error occurs), `RootLayout` returns `null` — a completely blank screen. `SplashScreen.preventAutoHideAsync()` keeps the OS splash screen visible.

```
App launches → SplashScreen held → useFonts() loads Inter 400/500/600/700
  → fonts ready → SplashScreen.hideAsync() → UI renders
```

### Step 2: Provider Hierarchy Initialization

Once fonts resolve, the provider tree mounts in this order (outermost first):

```
SafeAreaProvider
  └── ErrorBoundary (catches render crashes)
       └── QueryClientProvider (TanStack React Query — currently unused)
            └── GestureHandlerRootView
                 └── AuthProvider (starts Supabase session restore)
                      └── SubscriptionProvider (loads AsyncStorage subscription)
                           └── OrdersProvider (waits for auth to load first)
                                └── AppServices (registers push notifications)
                                └── DemoModeBanner
                                └── OfflineBanner
                                └── RootLayoutNav (the Stack navigator)
```

### Step 3: AuthProvider Initialization

`AuthProvider` runs its `init()` function:

**Path A — Supabase NOT configured (env vars absent):**
1. Sets `connectionStatus = "unconfigured"`
2. Reads `demo_user` and `demo_role` from AsyncStorage
3. If found: restores the previous demo session
4. Sets `isLoading = false`

**Path B — Supabase IS configured:**
1. Calls `supabase.auth.getSession()` to restore the previous session from AsyncStorage
2. Sets `user`, `session`, `role` from the restored session immediately (no network wait)
3. Registers `supabase.auth.onAuthStateChange()` listener
4. Sets `isLoading = false`
5. **In the background**: runs `testSupabaseConnection()` to probe reachability — this is informational only and does not block auth

### Step 4: Route Guard Activation

`useProtectedRoute()` runs inside `AuthProvider` and watches `[user, role, segments, isLoading]`. Once `isLoading = false`:

```
if no user and not in (auth): → router.replace("/(auth)/login")
if user and in (auth): → router.replace based on role:
  BUSINESS   → /(business)
  DISPATCHER → /(dispatcher)
  ADMIN      → /(admin)
  default    → /(customer)
```

### Step 5: SubscriptionProvider Initialization

Reads `ll_subscription_v1` from AsyncStorage. Checks expiry dates. Updates `isSubscribed` and `canAccess()`. This happens independently of auth — the business dashboard reads from this context to decide whether to show the paywall.

### Step 6: OrdersProvider Initialization

`OrdersProvider` watches for `user` and `role` to become available (from AuthContext). Once they are:
- If Supabase is configured: fetches orders from Supabase (role-scoped query)
- Fallback: loads from `laundry_link_orders_v4` AsyncStorage key
- Registers a Supabase realtime channel (`orders-realtime`) that calls `refreshOrders()` on any change to the `orders` table

### Step 7: AppServices (Push Notifications)

`AppServices` is a render-less component that calls `useNotifications()`. This hook:
1. Calls `registerForPushNotificationsAsync(user.id)` — requests OS permission, gets Expo push token, stores it in AsyncStorage
2. Registers `addNotificationResponseReceivedListener` — when a notification tap includes an `orderId` in its data, navigates to `/order/{orderId}`

### Step 8: Network Monitoring

`OrdersProvider` calls `useNetworkStatus()` which:
1. Immediately probes `https://clients3.google.com/generate_204`
2. Sets a 15-second interval for repeat probes
3. Listens for `AppState` changes — probes again when app returns to foreground
4. On web: uses `window.addEventListener("online"/"offline")`

---

## Section 5 — Folder-by-Folder Walkthrough

### `app/`

**Purpose:** All screen files. Expo Router converts the folder structure directly into navigation routes.

**`app/_layout.tsx`**  
The root layout. Loaded once when the app starts. Responsibilities: load fonts, initialize the provider tree, configure the Stack navigator, render `DemoModeBanner` and `OfflineBanner` globally. This file is one of the highest-risk files in the codebase — any error here crashes the entire app.

**`app/index.tsx`**  
Contains no visible UI. Its only job is to be the initial route. The `AuthProvider`'s route guard (`useProtectedRoute`) immediately redirects away from this route based on auth state. If you see a blank screen on startup, this file is executing while auth is still loading.

**`app/(auth)/`**  
Screens accessible to unauthenticated users. The `_layout.tsx` uses a `Stack` navigator with `headerShown: false`. These two screens (`login.tsx`, `signup.tsx`) are the only entry points into the app.

**`app/(customer)/`**, **`app/(business)/`**, **`app/(dispatcher)/`**, **`app/(admin)/`**  
Each is a separate Tabs navigator group. Users are hard-redirected into their group by the auth guard and cannot access other groups. Each `_layout.tsx` configures the tab bar (icons, colors, iOS blur background).

**`app/order/[id].tsx`**  
A shared dynamic screen accessible to all authenticated roles. Used to view order detail, update status, share driver location, and view the order map. The route is `/order/{uuid}`.

### `components/`

**Purpose:** Reusable UI components used across multiple screens. No components are role-specific.

**`OrderMap.tsx` vs `OrderMap.native.tsx`**  
Platform-split pair. Expo Router resolves `.native.tsx` on iOS/Android and `.tsx` on web. On web, a Canvas element draws colored circles and dashed lines to simulate a route. On native, `MapView` renders a real map with `Polyline` and `Marker` overlays showing pickup, delivery, and driver positions.

**`PaymentModal.tsx`**  
Displays bank transfer instructions. Receives `bankName`, `accountNumber`, `accountName` as props (sourced from `constants/laundromats.ts`). The "I've completed the transfer" button calls `onSuccess(makeRef())` immediately — no network call, no Paystack API. `makeRef()` generates a locally-random string like `LL-ABCDE-XYZ12`. This reference is then stored in the Supabase `orders.paystack_ref` column, but it is never verified against Paystack.

**`SubscriptionPaywall.tsx`**  
Full-page paywall component. Reads from `SubscriptionContext`. If `isSubscribed` is true, shows an active subscription management view (upgrade, cancel). If false, shows plan selection with trial/subscribe toggle. Uses `SUBSCRIPTION_PLANS` from `lib/subscription.ts` for pricing. The "Subscribe" button calls `purchasePlan()` which writes to AsyncStorage — it does not open a payment gateway.

**`DemoModeBanner.tsx`**  
Renders an amber banner at the top of the screen when `isDemo` is true from `AuthContext`. Purely informational.

**`OfflineBanner.tsx`**  
Renders a sliding banner when `isOnline` from `useNetworkStatus()` is false.

**`KeyboardAwareScrollViewCompat.tsx`**  
A thin wrapper that uses `KeyboardAvoidingView` on iOS and a plain `ScrollView` on other platforms, preventing the keyboard from covering form inputs.

### `contexts/`

See Section 8 for full context documentation.

### `constants/`

**`colors.ts`**  
Defines two palettes (`light` and `dark`) plus a shared `radius: 14`. The `dark` palette is fully defined but **never applied** — `useColors()` always returns the light palette. See Section 9 (Custom Hooks) for why.

**`services.ts`**  

**Critical value — read carefully:**

```typescript
export const DEFAULT_BUSINESS_ID = "freshclean-jos";
export const DEFAULT_BUSINESS_NAME = "FreshClean Laundry";
```

This is the fallback business used when creating an order if no business is explicitly selected. However, the Supabase schema seeds a business with `id = "cleanpro-abuja"`. This means orders created in demo mode will reference `"freshclean-jos"`, which may not exist in the Supabase `businesses` table. This is a latent data integrity issue.

Also contains `DISPATCHERS` — a hardcoded array of three fake dispatcher records with made-up UUIDs. These are not real database users. Businesses use this array to assign dispatchers in the order management screen.

**`laundromats.ts`**  
Seven hardcoded `Laundromat` objects across Jos (4), Abuja (2), Lagos (1). Each has `id`, `name`, `location`, `city`, `zone`, `rating`, `reviewCount`, `distanceKm`, `phone`, `bankName`, `accountNumber`, `accountName`, `pickupFee`, `deliveryFee`, and `services`. These are **not in the database** — they are client-side constants used to populate the business selection step in order creation. The `accountNumber` and `bankName` fields are what powers the `PaymentModal`.

### `hooks/`

See Section 9 for full hook documentation.

### `lib/`

**`supabase.ts`**  
Creates a single Supabase client instance shared across the entire app. Key decisions made here:
- Uses `AsyncStorage` as session storage (not `expo-secure-store`)
- Checks for placeholder values in env vars to determine `isSupabaseConfigured`
- `testSupabaseConnection()` is a fire-and-forget probe used only for the warning banner

**`subscription.ts`**  
Contains `SUBSCRIPTION_PLANS`, all plan-related utility functions, and five AsyncStorage CRUD functions (`getSubscription`, `startTrial`, `subscribe`, `cancelSubscription`, `daysLeft`). All subscription state is local to the device.

**`notifications.ts`**  
Wraps `expo-notifications` with lazy import and error suppression. Exports `sendLocalNotification` and typed helpers (`notifyNewOrder`, `notifyStatusChange`, etc.). On web, all notifications fall back to `console.log`.

**`offlineQueue.ts`**  
Implements an AsyncStorage queue for offline order creation. Key: `ll_offline_queue_v1`. Each queued item has `id`, `input` (the CreateOrderInput), `queuedAt`, and `attempts`. Items are discarded after 3 failed attempts.

### `types/`

**`index.ts`**  
Single source of truth for all TypeScript types. Critical types:
- `UserRole` — union of the four role strings
- `Order` — the complete order shape (camelCase — mapped from Supabase snake_case)
- `OrderStatus` — 9-value union matching the Supabase CHECK constraint
- `SubscriptionState`, `SubscriptionTier`, `SubscriptionPlan` — subscription shapes
- `CreateOrderInput` — what the create-order wizard produces
- `Business`, `LaundryService` — secondary types (Business is mostly unused by app logic)

### `supabase/`

**`schema.sql`**  
The database schema. Must be run in the Supabase SQL Editor to create all tables, indexes, triggers, and RLS policies. This file is the single authoritative source for the database structure.

---

## Section 6 — Screen Inventory

### Auth Screens

#### `(auth)/login.tsx`
- **Route:** `/(auth)/login`
- **Who can access:** Unauthenticated users
- **Purpose:** Email/password sign-in
- **Contexts used:** `AuthContext` (`signIn`, `connectionStatus`)
- **Hooks:** `useColors`, `useSafeAreaInsets`
- **Key behavior:** Shows a yellow warning banner if `connectionStatus === "unreachable"`. Error messages from `signIn()` are displayed inline (not in Alert). Uses `KeyboardAwareScrollViewCompat` for keyboard avoidance.
- **Navigation:** On success, `useProtectedRoute` redirects to role group automatically. "Sign Up" link goes to `/(auth)/signup`.

#### `(auth)/signup.tsx`
- **Route:** `/(auth)/signup`
- **Purpose:** Create a new account with role selection
- **Key behavior:** `RoleSelector` component renders four role options. Role is passed to `signUp()` and stored in `user_metadata`. Validates password minimum 6 characters.

### Customer Screens

#### `(customer)/index.tsx`
- **Route:** `/(customer)` (tab index)
- **Purpose:** Customer home — shows active orders, CTA to create order, and a "How it works" explainer
- **Contexts:** `AuthContext`, `OrdersContext`
- **No mock data** — if no orders exist, shows an empty state with CTA

#### `(customer)/create-order.tsx`
- **Route:** `/(customer)/create-order`
- **Purpose:** 4-step order creation wizard
- **Steps:**
  1. **Pickup** — Enter pickup address (TextInput)
  2. **Delivery** — Enter delivery address, select city, choose laundromat from `LAUNDROMATS` constant filtered by city
  3. **Services** — Select services from the chosen laundromat's `services` array, set quantity per item
  4. **Summary** — Review total, urgent flag, special requests, submit
- **Contexts:** `AuthContext`, `OrdersContext` (`createOrder`)
- **Key behavior:** On submit, calls `createOrder()` which attempts Supabase insert then falls back to local. Order number format: `LL-{6 last digits of Date.now()}`. Default delivery fee: ₦1,500.

#### `(customer)/orders.tsx`
- **Route:** `/(customer)/orders`
- **Purpose:** List of this customer's orders, sorted newest first
- **Contexts:** `OrdersContext`
- **Navigation:** Tapping an order → `/order/{id}`

#### `order/[id].tsx`
- **Route:** `/order/{uuid}`
- **Shared by:** All roles (customers see their order, businesses see orders they manage, dispatchers see assigned orders)
- **Contexts:** `AuthContext`, `OrdersContext`
- **Features:** Order metadata, `OrderTimeline` (status history), `OrderMap` (driver location), role-specific action buttons (business: update status, dispatcher: update location, customer: pay)
- **Payment trigger:** Customer taps "Pay" → `PaymentModal` appears → bank transfer UI

### Business Screens

#### `(business)/index.tsx`
- **Route:** `/(business)` (tab index)
- **Purpose:** Business dashboard with live stats
- **Subscription gate:** If `!isSubscribed`, renders `SubscriptionPaywall` instead of the dashboard
- **Contexts:** `AuthContext`, `OrdersContext`, `SubscriptionContext`

#### `(business)/orders.tsx`
- **Purpose:** Order management — accept, update status, assign dispatcher
- **Key behavior:** Dispatcher assignment uses the hardcoded `DISPATCHERS` array from `constants/services.ts` — not real users from the database. Calls `assignDispatcher()` from `OrdersContext`.

#### `(business)/subscription.tsx`
- **Purpose:** Plan management screen
- **Renders:** `SubscriptionPaywall` component
- **What happens when "Subscribe" is tapped:** Calls `purchasePlan()` → writes to AsyncStorage → no payment gateway opened

#### `(business)/reports.tsx`
- **Purpose:** Analytics — revenue, order status breakdown, service breakdown
- **Data source:** Derived from `orders` in `OrdersContext` — no separate analytics API

### Dispatcher Screens

#### `(dispatcher)/kyc.tsx`
- **Route:** `/(dispatcher)/kyc`
- **Purpose:** KYC data collection form (NIN, BVN, guarantor)
- **Reality:** Form renders, user can fill it in, "Submit" button exists — but there is **no `onSubmit` handler that persists data**. This screen is a placeholder.

### Admin Screens

#### `(admin)/index.tsx`
- **Route:** `/(admin)` (tab index)
- **Purpose:** Platform overview — total orders, revenue, business count, active orders, SaaS plan distribution, Quick Actions
- **Quick Actions:** 5 tappable `Pressable` items navigating to users/businesses/orders/analytics/settings
- **Data source:** Derived entirely from `orders` via `OrdersContext` — no admin-specific Supabase queries

#### `(admin)/businesses.tsx`
- **Route:** `/(admin)/businesses`
- **Hidden from tab bar:** Yes — accessible via Quick Actions or `router.push("/(admin)/businesses")`
- **Purpose:** Shows all businesses derived from order history, with simulated subscription tiers
- **Tier simulation:** Derived from order count per business — `< 8 orders = STARTER, 8–29 = PRO, 30+ = ENTERPRISE`
- **No real subscription data from Supabase** — the `businesses` table subscription columns are not read

#### `(admin)/settings.tsx`
- **Purpose:** Role hierarchy management (SUPER/STAFF), passphrase unlock, simulated activity log
- **Super Admin passphrase:** `"MAFIA CODE BRUV"` — hardcoded in `hooks/useAdminAccess.ts`. Anyone with source access knows this.
- **Activity log:** In-memory hardcoded sample events — not a real audit log

---

## Section 7 — Component Inventory

### `SubscriptionPaywall`
- **File:** `components/SubscriptionPaywall.tsx`
- **Props:** `onClose?: () => void`, `onSuccess?: () => void`
- **Internal state:** `selectedTier` (default: PRO), `loading`, `mode` ("trial" | "pay")
- **Behavior:** Two views — paywall (plan selection) and active subscription management
- **Data source:** `SUBSCRIPTION_PLANS` from `lib/subscription.ts`, `useSubscription()` context
- **Reusable:** Yes — used in both `(business)/index.tsx` (paywall gate) and `(business)/subscription.tsx`

### `PaymentModal`
- **File:** `components/PaymentModal.tsx`
- **Props:** `visible`, `amount`, `orderNumber`, `bankName`, `accountNumber`, `accountName`, `onSuccess(reference)`, `onClose`
- **Internal state:** `confirming` (button spinner), `copied` (clipboard feedback)
- **Key behavior:** "I've completed the transfer" calls `onSuccess(makeRef())` immediately without any network call. The payment reference is purely cosmetic.
- **Used in:** `order/[id].tsx` for customer-initiated payment

### `OrderMap` / `OrderMap.native`
- **Files:** `components/OrderMap.tsx` (web), `components/OrderMap.native.tsx` (iOS/Android)
- **Props:** `order: Order` — reads `driverLatitude`, `driverLongitude`, `isDriverLocationShared`, `pickupAddress`, `deliveryAddress`
- **Native:** Uses `MapView` with `Marker` for pickup, delivery, and driver + `Polyline` connecting them
- **Web:** Canvas fallback — draws circles and dashed lines

### `OrderTimeline`
- **File:** `components/OrderTimeline.tsx`
- **Props:** `history: OrderStatusHistory[]`, `currentStatus: OrderStatus`
- **Purpose:** Vertical list of status transitions with timestamps and notes

### `StatusBadge`
- **File:** `components/StatusBadge.tsx`
- **Props:** `status: OrderStatus`
- **Purpose:** Colored pill chip matching status to a label and color

### `DemoModeBanner`
- **File:** `components/DemoModeBanner.tsx`
- **No props** — reads `isDemo` from `AuthContext` directly
- **Purpose:** Amber top banner informing the user they are in demo mode

### `OfflineBanner`
- **File:** `components/OfflineBanner.tsx`
- **No props** — calls `useNetworkStatus()` internally
- **Purpose:** Slides down when offline. Animates away when connection restored.

### `SkeletonLoader`
- **File:** `components/SkeletonLoader.tsx`
- **Props:** `count?: number`, `height?: number`
- **Purpose:** Animated placeholder cards shown during data loading

### `RoleSelector`
- **File:** `components/RoleSelector.tsx`
- **Props:** `selectedRole: UserRole`, `onSelect: (role: UserRole) => void`
- **Purpose:** Four-option role picker used only on the signup screen

### `ErrorBoundary` / `ErrorFallback`
- **Files:** `components/ErrorBoundary.tsx`, `components/ErrorFallback.tsx`
- **Purpose:** React class component catch for render errors. Shows `ErrorFallback` on crash.
- **Used in:** `app/_layout.tsx` wrapping the entire app

### `EmptyState`
- **File:** `components/EmptyState.tsx`
- **Props:** `icon`, `title`, `message`, `action?: { label, onPress }`
- **Purpose:** Consistent empty state with icon, message, and optional CTA button

### `KeyboardAwareScrollViewCompat`
- **File:** `components/KeyboardAwareScrollViewCompat.tsx`
- **Purpose:** Keyboard-aware scroll wrapper compatible with both web and native
- **Used in:** `login.tsx`, `signup.tsx`

---

## Section 8 — Context Providers

### `AuthContext` (`contexts/AuthContext.tsx`)

**Responsibilities:** Authentication state, session persistence, demo mode, route guard

**State variables:**

| Variable | Type | Initial | Description |
|---|---|---|---|
| `user` | `User \| null` | `null` | Supabase auth user object |
| `session` | `Session \| null` | `null` | Full Supabase session (includes JWT) |
| `role` | `UserRole \| null` | `null` | Derived from `user.user_metadata.role` |
| `isLoading` | `boolean` | `true` | True until session restore completes |
| `isDemo` | `boolean` | derived | True only when Supabase keys are absent |
| `connectionStatus` | `ConnectionStatus` | `"checking"` | "checking" → "connected" / "unreachable" / "unconfigured" |

**Functions exposed:** `signIn(email, password)`, `signUp(email, password, fullName, role)`, `signOut()`

**Data source:** Supabase Auth API (or AsyncStorage in demo mode)

**Route guard:** `useProtectedRoute()` runs inside the provider. Uses `useSegments()` to detect current route group and `useRouter()` to redirect. Fires on every change to `[user, role, segments, isLoading]`.

**Lifecycle:**
1. On mount: runs `init()` (described in Section 4)
2. Registers `onAuthStateChange` listener — updates state on login/logout/token refresh
3. On unmount: unsubscribes auth listener

**Critical design decision:** Session is restored from AsyncStorage **before** the connection probe completes. This means the user is authenticated immediately on re-launch even on a slow connection. The connection probe (`testSupabaseConnection`) is informational only.

**Demo mode distinction:** `isDemo` is `true` ONLY when keys are absent. If keys are present but Supabase is unreachable, `isDemo` remains `false` and `signIn` returns the actual Supabase error. There is no silent fallback to demo when configured.

**Potential risks:**
- Role is stored in `user_metadata` — if this is missing (e.g., old user accounts without the metadata), role defaults to `"CUSTOMER"`
- `user_role` AsyncStorage key is written but never read — it's dead state

### `OrdersContext` (`contexts/OrdersContext.tsx`)

**Responsibilities:** Order CRUD, realtime sync, offline fallback, offline queue flush

**State variables:**

| Variable | Type | Description |
|---|---|---|
| `orders` | `Order[]` | All orders visible to the current user |
| `history` | `OrderStatusHistory[]` | Status history for all visible orders |
| `isLoading` | `boolean` | True during fetch |

**Functions exposed:**
- `refreshOrders()` — re-fetches from Supabase or AsyncStorage
- `createOrder(input)` — creates in Supabase or queues offline
- `updateOrderStatus(orderId, status, note?)` — transitions status
- `assignDispatcher(orderId, dispatcherId, dispatcherName)` — assigns rider
- `updateDriverLocation(orderId, lat, lng, sharing)` — updates GPS position
- `markOrderPaid(orderId, reference)` — marks PAID + stores paystack_ref
- `getOrderById(orderId)` — synchronous lookup from memory
- `getHistoryForOrder(orderId)` — synchronous lookup from memory

**Data source strategy (for each function):**
1. Try Supabase if `isSupabaseConfigured && !isDemo`
2. Fall back to AsyncStorage if Supabase fails or is not configured

**Order filtering by role:**
- `CUSTOMER`: `WHERE customer_id = user.id`
- `BUSINESS`: no filter (RLS handles isolation — see Security section)
- `DISPATCHER`: `WHERE assigned_driver_id IS NOT NULL`
- `ADMIN` / default: no filter

**Important bug:** The `DISPATCHER` filter shows ALL orders with any assigned dispatcher to ALL dispatcher users simultaneously. There is no per-dispatcher scoping in the client query.

**Realtime:** A Supabase channel (`orders-realtime`) listens to `postgres_changes` on the `orders` table. Any event (INSERT, UPDATE, DELETE) triggers a full `refreshOrders()`. This is not granular — it refreshes all orders on any change by anyone.

**Offline queue flush:** Triggered when `isOnline` changes from false to true. Reads the queue, calls `createOrder()` for each item. Items with `attempts >= 3` are discarded. Uses a `isFlushing` ref to prevent concurrent flushes.

**Storage keys:** `laundry_link_orders_v4`, `laundry_link_order_history_v4` (v4 implies previous versions existed — old data is not migrated)

**Potential risks:**
- `refreshOrders()` on every realtime event is expensive at scale
- Business order isolation relies entirely on Supabase RLS — if policies are misconfigured, all businesses see all orders
- The fallback to AsyncStorage when Supabase returns an error while ONLINE surfaces the error to the caller instead of silently queuing — this is intentional ("ghost order" prevention)

### `SubscriptionContext` (`contexts/SubscriptionContext.tsx`)

**Responsibilities:** Manage subscription state for the logged-in business user

**State variables:**

| Variable | Type | Description |
|---|---|---|
| `subscription` | `SubscriptionState` | Current tier, active flag, trial flag, expiry dates |
| `isLoading` | `boolean` | True during AsyncStorage read |
| `isSubscribed` | `boolean` | `subscription.active && !!subscription.tier` |

**Functions exposed:** `canAccess(feature)`, `refresh()`, `beginTrial(tier)`, `purchasePlan(tier)`, `cancel()`

**Data source:** AsyncStorage only (key: `ll_subscription_v1`)

**Critical limitation:** This context is scoped to the **logged-in user's device**. It does not read from or write to the Supabase `businesses` table subscription columns. Two consequences:
1. Reinstalling the app loses the subscription
2. Subscription state cannot be managed by admins from another device

**Feature gating:** `canAccess(feature)` calls `canAccessFeature(feature, tier, active)` from `lib/subscription.ts`. This checks a `FEATURE_TIERS` lookup table mapping features to the minimum required tier.

**Lifecycle:** Refreshes on mount and whenever `role` changes (to pick up newly logged-in business users).

---

## Section 9 — Custom Hooks

### `useColors()` — `hooks/useColors.ts`

**Purpose:** Returns design tokens (colors + border radius) for the current theme.  
**Parameters:** None  
**Return value:** The light palette from `constants/colors.ts` plus `radius: 14`  
**Important:** Despite the comment "kept so React can re-render on OS change", calling `useColorScheme()` and then **ignoring its value** (always returning `colors.light`) means **dark mode is permanently disabled**. The comment in the file states: *"light mode is the enforced default per product spec. Dark palette is preserved in constants/colors.ts for future opt-in, but is NOT applied here."*  
**Consumers:** Every screen and component in the app

### `useNetworkStatus()` — `hooks/useNetworkStatus.ts`

**Purpose:** Monitor internet connectivity without `@react-native-community/netinfo`  
**Parameters:** None  
**Return value:** `{ isOnline: boolean, isChecking: boolean }`  
**Probe mechanism:**
- Native: `fetch("https://clients3.google.com/generate_204", { method: "HEAD" })` with 4-second abort timeout
- Web: `navigator.onLine` + `window` online/offline events  
**Interval:** Every 15 seconds (`PROBE_INTERVAL = 15_000`)  
**Initial state:** `isOnline = true` (optimistic — corrected after first probe)  
**Consumers:** `OrdersContext` (for offline queue flush trigger), `OfflineBanner` (via `OfflineBanner` component which calls this hook internally — or via `OrdersContext`)

### `useNotifications()` — `hooks/useNotifications.ts`

**Purpose:** Register for push notifications and handle deep links from notification taps  
**Parameters:** None (reads `user` from `AuthContext`)  
**Return value:** None (side-effect only hook)  
**Behavior:**
1. Skips on web
2. Calls `registerForPushNotificationsAsync(user.id)` — stores token in AsyncStorage
3. Registers `addNotificationResponseReceivedListener` — if tapped notification contains `orderId` in data, calls `router.push("/order/{orderId}")`  
**Consumers:** `AppServices` component in `app/_layout.tsx` — runs once at app root

### `useAdminAccess()` — `hooks/useAdminAccess.ts`

**Purpose:** Determine if the current admin user has SUPER or STAFF tier  
**Parameters:** None (reads `user` from `AuthContext`)  
**Return value:** `{ isSuperAdmin: boolean, adminTier: AdminTier, unlockSuper, revokeSuper }`  
**Super Admin criteria (OR logic):**
1. `user.user_metadata.admin_tier === "SUPER"` (set via Supabase dashboard)
2. Email in `HARDCODED_SUPER_EMAILS` (currently empty array)
3. `sessionSuper === true` (set by entering the passphrase)  
**Passphrase:** `"MAFIA CODE BRUV"` — must match exactly (trimmed, uppercased)  
**Session persistence:** Stored as `"1"` in AsyncStorage key `admin_super_session`. Survives app restarts. Only cleared by `revokeSuper()`.  
**Consumers:** `(admin)/index.tsx`, `(admin)/analytics.tsx`, `(admin)/settings.tsx`, `(admin)/businesses.tsx`

---

## Section 10 — Data Flow

### Authentication Flow

```
User enters email/password → taps "Sign In"
  ↓
login.tsx: handleLogin() validates fields
  ↓
AuthContext.signIn(email, password)
  ↓
  [if isDemo]: AsyncStorage.getItem("demo_user") → restore or create demo User
  [if Supabase]: supabase.auth.signInWithPassword({ email, password })
  ↓
  Supabase response:
    Error → return { error: message } → login.tsx displays error inline
    Success → user + session returned
  ↓
supabase.auth.onAuthStateChange fires → sets user, session, role in AuthContext state
  ↓
useProtectedRoute detects user present + in (auth) → router.replace(roleGroup)
  ↓
OrdersContext.refreshOrders() fires (triggered by user becoming non-null)
  ↓
User sees their role's home screen
```

### Order Creation Flow

```
Customer fills 4-step wizard in create-order.tsx
  Step 1: pickupAddress (string)
  Step 2: deliveryAddress (string), city (City), laundromat selection from LAUNDROMATS constant
  Step 3: service items selected from laundromat.services array, quantities set
  Step 4: summary reviewed, urgent flag, special requests
  ↓
submit() called → OrdersContext.createOrder(CreateOrderInput)
  ↓
  Creates Order object locally:
    id: makeId() (timestamp + random)
    orderNumber: "LL-{last 6 digits of Date.now()}"
    customerId: user.id
    businessId: input.businessId ?? DEFAULT_BUSINESS_ID ("freshclean-jos")
    status: "PENDING"
    items: selected service items with quantities + prices
    totalAmount: sum of (pricePerUnit × quantity)
    deliveryFee: input.deliveryFee ?? 1500
  ↓
  [if Supabase configured and online]:
    supabase.from("orders").insert({snake_case fields}).select().single()
      Success:
        Insert history row: status="PENDING"
        refreshOrders()
        notifyNewOrder(orderNumber, businessName) → local notification on this device
        Return { error: null, orderId }
      Error + online:
        Return { error: "Could not submit..." } → screen shows error
      Error + offline:
        Fall through to local queue
  ↓
  [if offline or Supabase not configured]:
    writeLocalOrders([order, ...existing])
    writeLocalHistory([...existing, firstHistoryEntry])
    refreshOrders()
    notifyNewOrder()
    Return { error: null, orderId }
  ↓
create-order.tsx: on success → router.push("/order/{orderId}")
```

### Order Status Update Flow

```
Business (or dispatcher) taps status update button in order detail
  ↓
updateOrderStatus(orderId, newStatus, note?) in OrdersContext
  ↓
  [if Supabase]:
    supabase.from("orders").update({ status, updated_at }).eq("id", orderId)
    supabase.from("order_status_history").insert({ order_id, status, changed_by, note })
    refreshOrders()
    notifyOrderReady(orderNumber) [if READY]
    OR notifyStatusChange(orderNumber, status, role)
  [else]:
    writeLocalOrders(mapped with status replaced)
    writeLocalHistory(appended)
    refreshOrders()
  ↓
Supabase realtime channel ("orders-realtime") fires postgres_changes event
  → All connected clients call refreshOrders()
  ↓
OrderTimeline in order/[id].tsx re-renders with new history
StatusBadge shows updated status
```

### Payment Flow (Order Payment)

```
Customer is on order/[id].tsx
Order status = "READY"
Customer taps "Pay for Order"
  ↓
PaymentModal becomes visible
Props: amount (order.totalAmount + deliveryFee), orderNumber,
       bankName/accountNumber/accountName from LAUNDROMATS constant
  ↓
Customer sees bank transfer instructions
Customer copies account number (expo-clipboard)
Customer opens their bank app externally (no deep link — this is manual)
Customer completes transfer
Customer returns to app
Customer taps "I've completed the transfer"
  ↓
handleConfirm() → 700ms artificial delay → onSuccess(makeRef())
  ↓
markOrderPaid(orderId, fakeReference) in OrdersContext
  ↓
  supabase.from("orders").update({ status: "PAID", paystack_ref, paid_at })
  Insert history: status="PAID", note="Payment confirmed — ref: {ref}"
  refreshOrders()
  notifyPaymentReceived(orderNumber, amount, reference)
  ↓
Order is now PAID
Business can proceed to dispatch
```

**Critical gap:** The fake reference (e.g., `LL-ABCDE-XYZ12`) is stored as-is. There is no Paystack API call to verify that money actually changed hands. The confirmation is entirely honor-based.

### Subscription Flow

```
Business taps "Start 7-Day Free Trial" in SubscriptionPaywall
  ↓
SubscriptionPaywall: handleTrial()
  → Haptic feedback
  → beginTrial(selectedTier) from SubscriptionContext
  ↓
SubscriptionContext.beginTrial(tier)
  → lib/subscription.ts: startTrial(tier)
    → creates SubscriptionState: { tier, active: true, isTrial: true,
        trialExpiresAt: now + 7 days, subscribedAt: now, expiresAt: null }
    → AsyncStorage.setItem("ll_subscription_v1", JSON.stringify(state))
    → returns state
  → setSubscription(state)
  ↓
SubscriptionContext: isSubscribed = true, canAccess() now returns true for tier features
  ↓
Business home (business)/index.tsx re-renders
isSubscribed is true → renders dashboard instead of paywall
  ↓
[Nothing is written to Supabase. No payment is collected for trial.]
```

### Dispatcher Location Update Flow

```
Dispatcher on order/[id].tsx taps "Share Location"
  ↓
Platform location permission requested (expo-location — if integrated)
GPS coordinates obtained
  ↓
updateDriverLocation(orderId, lat, lng, sharing=true) in OrdersContext
  ↓
  supabase.from("orders").update({ driver_lat: lat, driver_lng: lng,
    is_driver_location_shared: true }).eq("id", orderId)
  refreshOrders()
  ↓
Supabase realtime fires postgres_changes
  → All clients watching this order call refreshOrders()
  → OrderMap in order/[id].tsx updates Marker position
```

**Gap:** This is not a streaming location feed. Each update triggers a full Supabase write and a full order refetch. For smooth tracking at GPS update frequency, this architecture would create excessive database writes and network traffic.

---

## Section 11 — Database Knowledge

### Table: `profiles`

**Purpose:** Mirrors Supabase Auth users with additional app fields  
**Created by:** Trigger `on_auth_user_created` fires after every signup  
**Schema:**

```sql
id          uuid PRIMARY KEY  -- references auth.users(id), cascades on delete
email       text NOT NULL      -- duplicated from auth.users, can drift
full_name   text               -- nullable
role        text NOT NULL      -- CHECK: CUSTOMER/BUSINESS/DISPATCHER/ADMIN
phone       text               -- nullable, no unique constraint
avatar_url  text               -- nullable, no upload mechanism
created_at  timestamptz        -- auto
updated_at  timestamptz        -- NOT auto-updated (no trigger!)
```

**RLS Policies:**
- Users can read their own profile (`auth.uid() = id`)
- Users can update their own profile
- Admins can read all profiles (JOIN to check role = 'ADMIN')

**Which screens read it:** The `profiles` table is primarily read by Supabase RLS policies as part of JOIN checks. The app itself reads `user.user_metadata` for role and name — not this table directly.

**Unused columns:** `avatar_url` (no upload UI), `updated_at` (never auto-updates — no trigger)  
**Missing indexes:** `role` column (queried heavily in RLS JOINs)

### Table: `businesses`

**Purpose:** Registry of laundromats on the platform  
**Schema:**

```sql
id                    text PRIMARY KEY DEFAULT 'cleanpro-abuja'  -- NOT a UUID!
user_id               uuid              -- references auth.users, nullable
name                  text NOT NULL
address               text
phone                 text
description           text
logo_url              text              -- no upload mechanism
is_verified           boolean DEFAULT false
subscription_tier     text              -- CHECK: STARTER/PRO/ENTERPRISE
subscription_active   boolean DEFAULT false
subscription_expires_at timestamptz
created_at            timestamptz
```

**RLS Policies:**
- Anyone can read businesses (for the laundromat picker in order creation)
- Business owners can update their own business
- Admins can do everything

**Critical issues:**
- `id` defaults to the literal string `'cleanpro-abuja'` — only meaningful for the seeded test business
- `subscription_tier`, `subscription_active`, `subscription_expires_at` are **never written by the app** — subscription is stored in AsyncStorage only
- No `updated_at` column
- `logo_url` populated nowhere

**Seeded data:** One row: `id='cleanpro-abuja'`, name='CleanPro Laundry Abuja'

**Note:** `DEFAULT_BUSINESS_ID` in `constants/services.ts` is `"freshclean-jos"`, not `"cleanpro-abuja"`. These are different. No row with id `"freshclean-jos"` is seeded in the schema.

### Table: `orders`

**Purpose:** Core order table — complete lifecycle of every laundry order  
**Schema (key columns):**

```sql
id                       uuid PRIMARY KEY DEFAULT uuid_generate_v4()
order_number             text UNIQUE NOT NULL          -- format: LL-{6 digits}
customer_id              uuid NOT NULL                 -- references auth.users
customer_name            text NOT NULL                 -- denormalized
customer_email           text                          -- denormalized
business_id              text NOT NULL                 -- NO FK (intentionally dropped)
business_name            text NOT NULL                 -- denormalized
assigned_driver_id       uuid                          -- NO FK constraint
assigned_driver_name     text                          -- denormalized
status                   text                          -- CHECK 9 values
items                    jsonb                         -- Array of OrderItem
total_amount             numeric(10,2)
delivery_fee             numeric(10,2) DEFAULT 1500
pickup_address           text NOT NULL
delivery_address         text NOT NULL
special_requests         text
urgent                   boolean DEFAULT false
driver_lat               double precision
driver_lng               double precision
is_driver_location_shared boolean DEFAULT false
paystack_ref             text                          -- client-generated, unverified
paid_at                  timestamptz
created_at               timestamptz
updated_at               timestamptz                   -- auto-updated by trigger
```

**Indexes:** `customer_id`, `business_id`, `status`, `created_at DESC`

**Triggers:** `orders_updated_at` — auto-sets `updated_at = now()` on every UPDATE

**RLS Policies:**
- Customers: read/insert their own orders (`customer_id = auth.uid()`)
- Business: read all orders if role=BUSINESS (not scoped per-business!)
- Dispatcher: read/update orders where `assigned_driver_id = auth.uid()`
- Admin: full access

**Why `business_id` has no FK:** The original schema had `business_id text REFERENCES businesses(id)`. This was dropped because the order creation flow lets customers type a business name without the business necessarily existing in the `businesses` table. The migration comment in `schema.sql` documents this change.

**Denormalized fields:** `customer_name`, `business_name`, `assigned_driver_name` are stored at order creation time. If a user changes their name after placing an order, the stored name becomes stale.

### Table: `order_status_history`

**Purpose:** Append-only audit trail of every status transition  
**Schema:**

```sql
id          uuid PRIMARY KEY
order_id    uuid NOT NULL       -- references orders(id) ON DELETE CASCADE
status      text NOT NULL       -- any valid OrderStatus value
changed_by  uuid                -- references auth.users, nullable
note        text                -- human-readable description
created_at  timestamptz
```

**Index:** `order_id`

**RLS Policies:**
- Users can read history for their own orders (customer or assigned driver)
- Business can read history for their orders (JOIN via businesses table — may fail if business_id FK is missing)
- Admins read all
- Authenticated users can insert (no role restriction on insert!)

### Table: `push_tokens`

**Purpose:** Maps users to their Expo push tokens for cross-device push notifications  
**Schema:**

```sql
id         uuid PRIMARY KEY
user_id    uuid NOT NULL    -- references auth.users ON DELETE CASCADE
token      text NOT NULL
platform   text
created_at timestamptz
UNIQUE (user_id, token)
```

**Current use:** Tokens are written by `registerForPushNotificationsAsync`. They are **never read by the app** — there is no server-side push sender that reads this table.

### Missing Tables (Not Yet Created)

| Table | Required For |
|---|---|
| `kyc_submissions` | Dispatcher KYC data |
| `reviews` | Rating system |
| `disputes` | Order disputes |
| `saved_addresses` | Persistent customer addresses |
| `service_pricing` | Per-business service prices (currently AsyncStorage) |
| `admin_activity_log` | Real admin audit log |

---

## Section 12 — Authentication System

### Signup

1. `signup.tsx` collects: `fullName`, `email`, `password` (min 6 chars), `selectedRole`
2. Calls `AuthContext.signUp(email, password, fullName, selectedRole)`
3. In Supabase mode: `supabase.auth.signUp({ email, password, options: { data: { full_name, role } } })`
4. Supabase trigger `on_auth_user_created` inserts a row into `profiles`
5. `supabase.auth.updateUser({ data: { full_name, role } })` is called again (redundant but ensures metadata is set)
6. Role stored in AsyncStorage (`user_role`) — this write is never read back
7. `onAuthStateChange` fires → state updated → route guard redirects

### Login

1. `login.tsx` calls `AuthContext.signIn(email, password)`
2. In Supabase mode: `supabase.auth.signInWithPassword({ email, password })`
3. Supabase stores JWT session in AsyncStorage automatically
4. `onAuthStateChange` fires → user, session, role set in state
5. Route guard redirects to role group

### Session Persistence

Sessions survive app restarts because:
- Supabase JS client persists sessions in AsyncStorage automatically
- On `AuthProvider` mount, `supabase.auth.getSession()` restores the session without a network round-trip
- `autoRefreshToken: true` keeps the JWT refreshed in the background

### JWT and Role

The JWT (from Supabase) contains `user_metadata` including `role`. This is what `AuthContext` reads to determine the user's role. The `profiles` table role column is not directly queried by the app — it is only referenced in RLS policies via JOIN.

### Demo Mode

When `EXPO_PUBLIC_SUPABASE_URL` or `EXPO_PUBLIC_SUPABASE_ANON_KEY` are absent or contain placeholder values, `isSupabaseConfigured = false` and `isDemo = true`. In this mode:
- Signup creates a local user object (`makeDemoUser()`) stored in AsyncStorage
- Login restores the stored demo user
- All orders are stored in AsyncStorage only
- Subscription is AsyncStorage-only (same as live mode)
- Notifications are device-local (same as live mode)

### Protected Routes

`useProtectedRoute()` is called inside `AuthProvider`. It uses `useSegments()` to detect the route group and `useRouter()` to redirect. The guard fires whenever `[user, role, segments, isLoading]` changes. While `isLoading = true`, the guard does nothing (prevents premature redirect before session restore completes).

### Logout

`signOut()` does:
1. `supabase.auth.signOut()` (if Supabase configured)
2. `AsyncStorage.multiRemove(["demo_role", "demo_user", "user_role"])`
3. Sets `user`, `role`, `session` to `null`
4. Route guard fires → redirects to `/(auth)/login`

Note: The subscription state (`ll_subscription_v1`) is NOT cleared on logout. A different business user logging in on the same device inherits the previous user's subscription.

### Admin Elevation (SUPER tier)

See `useAdminAccess.ts`. SUPER tier is unlocked via passphrase `"MAFIA CODE BRUV"`. The session is stored in AsyncStorage `admin_super_session`. Elevation persists until `revokeSuper()` is called from the Settings screen.

---

## Section 13 — Orders System

### Order Number Format

`LL-{last 6 digits of Date.now()}` — generated client-side. Collision possible (two orders placed simultaneously would get the same number). Supabase has a UNIQUE constraint on `order_number` which would cause an insert error, but the app does not handle this gracefully.

### Status Machine

```
PENDING    → ACCEPTED (business accepts)
ACCEPTED   → PICKED_UP (dispatcher collects from customer)
PICKED_UP  → IN_PROGRESS (at laundromat)
IN_PROGRESS → READY (cleaning complete)
READY      → PAID (customer pays)
PAID       → OUT_FOR_DELIVERY (dispatcher dispatched)
OUT_FOR_DELIVERY → DELIVERED

Any status → CANCELLED
```

Each transition is recorded in `order_status_history`. There is no enforcement of the state machine — any role with UPDATE access could technically set any status. Enforcement is only in the UI (buttons only show valid next states for the current role).

### Offline Support

When `createOrder` is called offline (Supabase fails + `!isOnline`):
1. Order is written to `laundry_link_orders_v4` AsyncStorage
2. Order is added to `ll_offline_queue_v1` via `offlineQueue.ts`
3. When connectivity returns, `flushQueue()` retries each queued order via `createOrder()`
4. Successful items removed from queue; items with 3+ failures discarded

### Dispatcher Assignment

The current implementation is entirely manual and uses hardcoded fake dispatcher data:

```typescript
// constants/services.ts
export const DISPATCHERS = [
  { id: "11111111-1111-4111-8111-111111111111", name: "Aminu Suleiman" },
  { id: "22222222-2222-4222-8222-222222222222", name: "Daniel Okafor" },
  { id: "33333333-3333-4333-8333-333333333333", name: "Chioma Eze" },
];
```

These UUIDs do not correspond to real database users. The `assignDispatcher()` function writes these IDs to `orders.assigned_driver_id`. Since there is no FK constraint, this succeeds. But the Dispatcher RLS policy (`assigned_driver_id = auth.uid()`) would only give a real dispatcher visibility into this order if their actual Supabase user ID happened to match one of these fake IDs — which it never would.

---

## Section 14 — Subscription System

### Plan Definitions (`lib/subscription.ts`)

```
STARTER:    ₦10,000/mo  — 50 orders, 1 dispatcher
PRO:        ₦18,000/mo  — 250 orders, 5 dispatchers (recommended)
ENTERPRISE: ₦30,000/mo  — unlimited orders, unlimited dispatchers
```

### Feature Gating

```typescript
const FEATURE_TIERS = {
  orders:          ["STARTER", "PRO", "ENTERPRISE"],
  dispatchers:     ["STARTER", "PRO", "ENTERPRISE"],
  reports:         ["PRO", "ENTERPRISE"],
  liveTracking:    ["PRO", "ENTERPRISE"],
  customPricing:   ["PRO", "ENTERPRISE"],
  smsNotifications:["PRO", "ENTERPRISE"],
  multiBranch:     ["ENTERPRISE"],
  apiAccess:       ["ENTERPRISE"],
  whiteLabel:      ["ENTERPRISE"],
  prioritySupport: ["PRO", "ENTERPRISE"],
};
```

`canAccess(feature)` returns `false` if tier is null or subscription is inactive. The Business home screen uses this to gate the dashboard behind the paywall.

### Storage

All subscription state is in AsyncStorage key `ll_subscription_v1`. The shape:

```typescript
{
  tier: SubscriptionTier | null,
  active: boolean,
  isTrial: boolean,
  trialExpiresAt: string | null,  // ISO date
  subscribedAt: string | null,
  expiresAt: string | null,       // ISO date (null for trial)
}
```

Expiry is checked on every `getSubscription()` call. If the trial or subscription has expired, `active` is overridden to `false` before returning.

### Trial vs Paid

- Trial: `isTrial: true`, timer = `trialExpiresAt`, `expiresAt: null`
- Paid: `isTrial: false`, timer = `expiresAt`, `trialExpiresAt: null`

`daysLeft(sub)` reads the appropriate date and computes remaining days.

### Upgrade/Downgrade/Cancel

- Upgrade: `purchasePlan(newTier)` — overwrites AsyncStorage with new tier
- Downgrade: same as upgrade (just a lower tier)
- Cancel: `cancelSubscription()` — removes key from AsyncStorage entirely → `getSubscription()` returns `DEFAULT_STATE` (tier=null, active=false)

---

## Section 15 — Notifications

### Registration Flow

1. `useNotifications()` hook fires in `AppServices` when `user` becomes non-null
2. Calls `registerForPushNotificationsAsync(user.id)` from `lib/notifications.ts`
3. Checks existing permission status via `getPermissionsAsync()`
4. If not granted: requests via `requestPermissionsAsync()`
5. If granted: calls `getExpoPushTokenAsync()` — wrapped in `.catch(() => null)` to handle Expo Go failures
6. Token stored in AsyncStorage (`ll_push_token_{userId}`)

### Local Notifications

All in-app notifications use `scheduleNotificationAsync({ trigger: null })` — this means they fire immediately as local notifications (device tray). They do NOT go through Expo's push servers.

Notification types and their triggers:

| Function | Trigger | Title |
|---|---|---|
| `notifyNewOrder` | `createOrder` success | "New Order Received" |
| `notifyStatusChange` | `updateOrderStatus` | "Order #{n} — {status}" |
| `notifyOrderReady` | `updateOrderStatus` to READY | "Your Order is Ready!" |
| `notifyDispatcherAssigned` | `assignDispatcher` | "Dispatcher Assigned" |
| `notifyPaymentReceived` | `markOrderPaid` | "Payment Received" |

**All fire on the device that triggers the action.** A business accepting an order fires "New Order Received" on the business's own phone — not the customer's phone.

### Deep Link Handling

`useNotifications` registers `addNotificationResponseReceivedListener`. When a notification is tapped and its `data.orderId` is set, the app navigates to `/order/{orderId}`. The `orderId` must be set in `content.data` when scheduling the notification — currently, none of the `sendLocalNotification` calls set `orderId` in the data payload. The deep link therefore never fires from existing notifications (would require the payload to include `{ orderId: "..." }`).

### Missing Server Push Logic

For real cross-device push:
1. API server needs a `POST /api/push/send` endpoint
2. That endpoint reads `push_tokens` from Supabase for the target user(s)
3. Sends via Expo Push API (`https://exp.host/--/api/v2/push/send`)
4. Handles receipts/errors from the Expo push service

None of this is implemented.

---

## Section 16 — Maps & Location

### Platform Split

Expo Router resolves `.native.tsx` files on iOS/Android and `.tsx` files on web. The two `OrderMap` files provide completely different implementations:

**`OrderMap.native.tsx`** — uses `react-native-maps`:
- `MapView` with `initialRegion` centered on order's pickup coordinates
- `Marker` at pickup address (pin icon)
- `Marker` at delivery address (flag icon)
- `Marker` at `[driverLatitude, driverLongitude]` (car icon) — only when `isDriverLocationShared = true`
- `Polyline` connecting pickup → driver → delivery

**`OrderMap.tsx`** (web) — uses React Native Canvas:
- `Canvas` element with fixed dimensions
- Draws colored circles at three points (pickup, driver, delivery)
- Draws dashed lines connecting them
- Labels each point with text
- Not a geographic map — positions are fixed on screen, not geocoded

### Location Updates

Dispatcher location is updated by calling `updateDriverLocation(orderId, lat, lng, true)`. This writes to `orders.driver_lat` and `orders.driver_lng` in Supabase. The Supabase realtime subscription then notifies all connected clients, triggering a full `refreshOrders()`. The map re-renders with the new driver position.

**Not implemented:** Continuous GPS tracking. The dispatcher would need to call `updateDriverLocation` periodically or in response to `expo-location` position updates. No code for this exists.

### Known Limitations

- Web map is not a real map — no geocoding, no street view, no interaction
- Location accuracy depends on device GPS
- There is no geofencing, zone matching, or ETA calculation
- The react-native-maps package has TypeScript errors (TS2786) that are pre-existing

---

## Section 17 — Backend Knowledge

### Folder Structure

```
artifacts/api-server/src/
├── app.ts              Express 5 app setup
├── index.ts            Entry point
├── lib/
│   └── logger.ts       Pino singleton (import { logger } from "./lib/logger")
├── middlewares/        Empty placeholder (no middleware implemented)
└── routes/
    ├── health.ts       GET /api/healthz → { status: "ok" }
    └── index.ts        router.use("/healthz", healthRouter)
```

### Implemented Routes

**`GET /api/healthz`**
- Auth: None
- Input: None
- Output: `{ status: "ok" }` (validated via `HealthCheckResponse` Zod schema from `@workspace/api-zod`)
- Used by: Replit health probes

### Middleware Stack

```
pinoHttp (request logging) → cors() → express.json() → express.urlencoded() → /api router
```

All routes are mounted under `/api`. The proxy routes `/api` traffic to this server (port 8080).

### Logging Pattern

```typescript
// In route handlers:
req.log.info("some event");
req.log.error({ err }, "something failed");

// Outside request context:
import { logger } from "./lib/logger";
logger.info("startup event");
```

`console.log` is explicitly forbidden in server code per the pnpm-workspace skill.

### Missing Endpoints (Expected Future Architecture)

| Endpoint | Required For |
|---|---|
| `POST /api/paystack/webhook` | Verify payment HMAC, confirm subscription |
| `POST /api/push/send` | Cross-device push notifications |
| `POST /api/subscriptions/activate` | Write confirmed subscription to Supabase |
| `POST /api/kyc/submit` | Store dispatcher KYC |
| `POST /api/businesses` | Create business from app |
| `PATCH /api/orders/:id/status` | Server-side status transition validation |
| `GET /api/admin/users` | Admin-scoped user management |

---

## Section 18 — Dependency Graph

```
app/_layout.tsx
  ├── SafeAreaProvider
  ├── ErrorBoundary
  ├── QueryClientProvider (unused)
  ├── GestureHandlerRootView
  ├── AuthProvider ──────────────────── lib/supabase.ts
  │   │                                  └── @supabase/supabase-js
  │   │                                  └── AsyncStorage
  │   └── [useProtectedRoute]
  ├── SubscriptionProvider ───────────── lib/subscription.ts
  │   │                                  └── AsyncStorage
  │   └── useAuth (AuthContext)
  ├── OrdersProvider ─────────────────── lib/supabase.ts
  │   │                                  lib/offlineQueue.ts → AsyncStorage
  │   │                                  lib/notifications.ts → expo-notifications
  │   │                                  constants/services.ts
  │   └── useAuth, useNetworkStatus
  ├── AppServices ────────────────────── hooks/useNotifications.ts
  │                                       └── lib/notifications.ts
  │                                       └── AuthContext
  ├── DemoModeBanner ─────────────────── AuthContext
  ├── OfflineBanner ──────────────────── hooks/useNetworkStatus.ts
  └── RootLayoutNav (Stack)
      ├── (auth)/ ────────────────────── AuthContext
      ├── (customer)/ ────────────────── AuthContext, OrdersContext
      │   └── create-order.tsx ────────── constants/laundromats.ts
      │   └── order/[id].tsx ──────────── OrdersContext, components/OrderMap
      ├── (business)/ ────────────────── AuthContext, OrdersContext, SubscriptionContext
      │   └── orders.tsx ──────────────── constants/services.ts (DISPATCHERS)
      ├── (dispatcher)/ ──────────────── AuthContext, OrdersContext
      └── (admin)/ ───────────────────── AuthContext, OrdersContext
          └── hooks/useAdminAccess.ts ─── AuthContext, AsyncStorage

External services:
  Supabase ← lib/supabase.ts ← AuthContext, OrdersContext
  Paystack ← PaymentModal.tsx (bank transfer UI — no real API call)
  Expo Push ← lib/notifications.ts (device-local only)
  Google 204 ← hooks/useNetworkStatus.ts (probe only)
```

---

## Section 19 — Feature Interaction Matrix

| Feature | Depends On | Used By | Critical Files | DB Tables | External Services | Risk |
|---|---|---|---|---|---|---|
| Auth | Supabase Auth, AsyncStorage | Everything | `AuthContext.tsx`, `lib/supabase.ts` | `profiles`, `auth.users` | Supabase | 🔴 High |
| Orders | Auth, Supabase DB, AsyncStorage | Customer, Business, Dispatcher, Admin | `OrdersContext.tsx` | `orders`, `order_status_history` | Supabase Realtime | 🔴 High |
| Subscription | AsyncStorage only | Business, SubscriptionPaywall | `SubscriptionContext.tsx`, `lib/subscription.ts` | None (should be businesses) | None | 🔴 High |
| Notifications | expo-notifications, AsyncStorage | All roles | `lib/notifications.ts`, `hooks/useNotifications.ts` | `push_tokens` | Expo Push (unimplemented) | 🟡 Medium |
| Offline queue | AsyncStorage, OrdersContext | Customer | `lib/offlineQueue.ts` | None | None | 🟡 Medium |
| Maps | react-native-maps, OrdersContext | Order detail | `OrderMap.native.tsx`, `OrderMap.tsx` | `orders` (lat/lng) | None | 🟡 Medium |
| Payment (P2P) | Laundromats constant, OrdersContext | Customer | `PaymentModal.tsx` | `orders` (paystack_ref) | None (Paystack not called) | 🔴 High |
| Admin access | Auth, AsyncStorage | Admin screens | `hooks/useAdminAccess.ts` | None | None | 🟡 Medium |
| KYC | Nothing (placeholder) | Dispatcher | `(dispatcher)/kyc.tsx` | None (missing) | None | 🟢 Low |
| Network probe | Google CDN | OfflineBanner, OrdersContext | `hooks/useNetworkStatus.ts` | None | Google 204 endpoint | 🟢 Low |

---

## Section 20 — Hidden Knowledge

### Magic Values

| Value | Location | Meaning |
|---|---|---|
| `"MAFIA CODE BRUV"` | `hooks/useAdminAccess.ts` | Super Admin unlock passphrase |
| `"freshclean-jos"` | `constants/services.ts` | Default business ID (not in Supabase seed!) |
| `"cleanpro-abuja"` | `supabase/schema.sql` | Seeded business ID (different from default!) |
| `"ll_subscription_v1"` | `lib/subscription.ts` | AsyncStorage subscription key (v1 implies there was a v0) |
| `"laundry_link_orders_v4"` | `OrdersContext.tsx` | AsyncStorage orders key (v4 implies 3 previous versions) |
| `"ll_offline_queue_v1"` | `lib/offlineQueue.ts` | Offline queue key |
| `"admin_super_session"` | `hooks/useAdminAccess.ts` | Stored as `"1"` when Super session is active |
| `15_000` | `hooks/useNetworkStatus.ts` | Network probe interval in ms (15 seconds) |
| `1500` | `OrdersContext.tsx` | Default delivery fee in Naira |
| `14` | `constants/colors.ts` | Global border radius (`colors.radius`) |

### Dark Mode Is Disabled

`useColors()` always returns the light palette. The dark palette is fully defined but suppressed. Every screen in the app looks identical in light and dark OS modes. This is intentional per the file comment but surprising to new developers.

### Notifications Only Fire on the Triggering Device

Every `sendLocalNotification` call in `lib/notifications.ts` fires a local notification **on the device that called the function**. If a business accepts an order (which calls `notifyNewOrder`), the business's phone shows "New Order Received" — not the customer's phone. Cross-device notifications are architecturally planned (push tokens are stored) but the server-side sender is not implemented.

### PaymentModal Does Not Call Paystack

Despite Paystack being mentioned throughout the codebase and `EXPO_PUBLIC_PAYSTACK_KEY` being in environment docs, `PaymentModal.tsx` shows a bank transfer UI and generates a fake reference locally. The "I've completed the transfer" button fires `onSuccess(makeRef())` with a client-generated string — no HTTP request to Paystack.

### Subscription Is Wiped On Reinstall

`ll_subscription_v1` lives in AsyncStorage. Uninstalling the app on iOS/Android deletes AsyncStorage. A business that has paid ₦18,000 for a Pro plan would lose their access on reinstall.

### Dispatchers Are Fake

`constants/services.ts` exports a `DISPATCHERS` array with UUIDs like `"11111111-1111-4111-8111-111111111111"`. These are not real Supabase user accounts. Assigning one of these "dispatchers" to an order writes a non-existent UUID to `orders.assigned_driver_id`. Real dispatcher users would never see those orders in their Deliveries tab (the RLS policy `assigned_driver_id = auth.uid()` would never match).

### Business Sees All Orders (Not Just Theirs)

The Supabase RLS policy for businesses is:

```sql
CREATE POLICY "Business users can read their business orders" ON orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'BUSINESS')
  );
```

This allows **any** user with role=BUSINESS to read **all** orders on the platform. There is no filtering by which business the user belongs to. In the client code, `OrdersContext` applies no business-specific filter when `role === "BUSINESS"`. In a multi-business deployment, every business would see every other business's orders.

### Demo Subscription Survives Logout

`signOut()` clears `demo_role`, `demo_user`, and `user_role` from AsyncStorage. It does NOT clear `ll_subscription_v1`. If Business User A subscribes and logs out, Business User B logging in on the same device inherits User A's subscription status.

### `AppState` Triggers Network Re-probe

`useNetworkStatus` listens to `AppState.addEventListener("change")` and probes when the state becomes `"active"` (app returns to foreground). This means offline detection is retried every time the user switches back to the app, even mid-session.

### Metro in CI Mode

The `.env` file contains `CI=1`. This puts Metro bundler in CI mode: no file watching, no automatic reloads. Any code change requires a workflow restart to take effect. This is expected in the Replit environment.

### `testSupabaseConnection` Does Not Gate Auth

`testSupabaseConnection()` is called after the auth session is restored, not before. It is purely informational — its result only affects the `connectionStatus` state used for the warning banner in `login.tsx`. Even if the probe times out (12-second timeout), authentication still proceeds normally.

---

## Section 21 — Engineering Conventions

### File Naming

- Screens: `lowercase-with-hyphens.tsx` (e.g., `create-order.tsx`, `saved-addresses.tsx`)
- Contexts: `PascalCase + Context.tsx` (e.g., `AuthContext.tsx`)
- Hooks: `useCamelCase.ts` (e.g., `useColors.ts`, `useAdminAccess.ts`)
- Components: `PascalCase.tsx` (e.g., `PaymentModal.tsx`)
- Constants: `camelCase.ts` (e.g., `colors.ts`, `services.ts`)
- Platform splits: `ComponentName.tsx` (web) + `ComponentName.native.tsx` (native)

### TypeScript Patterns

- All shared types in `types/index.ts` — no inline type definitions in screen files
- `as const` used on role arrays and route lists
- Discriminated unions for `OrderStatus` (9 values), `UserRole` (4 values), `ConnectionStatus`
- Zod is used in the API server (`@workspace/api-zod`) but not in the mobile app
- `UserRole` is always imported from `@/types` — never redefined locally

### Context Pattern

Every context follows this pattern:
```typescript
// 1. Define the type
interface ThingContextType { ... }

// 2. Create with defaults (so consumers never get undefined)
const ThingContext = createContext<ThingContextType>({ ... });

// 3. Named export hook
export function useThing() { return useContext(ThingContext); }

// 4. Named export provider
export function ThingProvider({ children }) { ... }
```

### Error Handling Patterns

- Auth errors: returned as `{ error: string | null }` from `signIn/signUp` — never thrown
- Supabase calls in `OrdersContext`: if error + online → surface to caller; if error + offline → use local fallback
- Notifications: all calls wrapped in try/catch, failures silently swallowed
- `safe<T>(fn, fallback)` utility in `AuthContext` wraps any Supabase call

### Screen Layout Pattern

Every screen uses:
```typescript
const colors = useColors();
const insets = useSafeAreaInsets();
// ...
<ScrollView
  contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 100 : 100) }}
>
```

The `paddingBottom` of `100` (or `insets.bottom + 100` on native) ensures content is not obscured by the tab bar on web.

### Shadow Pattern

Reusable shadow object defined locally in each screen:
```typescript
const shadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 3,
};
```

### Theming Pattern

All color values come from `useColors()`. No hardcoded hex strings in component code except for semantic colors (e.g., `"#059669"` for success green, `"#ef4444"` for error red) that are not in the design token set.

### Logging

In the API server: `req.log` for request context, `logger` singleton for outside. No `console.log` in server code. In the mobile app: `console.log` is used sparingly for diagnostic messages (prefixed with `[LaundryLink]`).

---

## Section 22 — Known Limitations

### Subscription Stored Device-Locally

**Why:** The subscription system was implemented quickly without a server-side verification step. Paystack webhooks weren't set up, so there was no trusted event to write to Supabase.  
**Impact:** Reinstalling the app loses subscription. Multiple devices don't share subscription state. Admins can't manage business subscriptions from the admin panel.  
**Fix direction:** Implement Paystack webhook handler → verify payment → write to `businesses.subscription_tier/active/expires_at` in Supabase → have the app read subscription from Supabase instead of AsyncStorage.

### Dispatcher Assignment Uses Fake UUIDs

**Why:** Real dispatcher accounts were not yet created during development. Hardcoded dispatchers were used as a placeholder.  
**Impact:** Assigned dispatchers never see orders in their app.  
**Fix direction:** Remove `DISPATCHERS` constant. Replace with a Supabase query that fetches real users with `role = 'DISPATCHER'`.

### Business Order Isolation Not Enforced

**Why:** The RLS policy was written role-based, not business-based, to avoid the FK dependency that was dropped.  
**Impact:** Multi-tenancy is broken — all businesses see all orders.  
**Fix direction:** Add a `businesses` row per business user. Update RLS to `business_id = (SELECT id FROM businesses WHERE user_id = auth.uid())`.

### KYC Has No Backend

**Why:** Not yet implemented. Only the UI was built.  
**Impact:** Dispatcher identities are unverified.  
**Fix direction:** Create `kyc_submissions` table, add `POST /api/kyc/submit` endpoint.

### No Cross-Device Push Notifications

**Why:** Server-side sender not implemented. Tokens are collected but never read.  
**Impact:** Users on different devices don't receive notifications for events they care about.  
**Fix direction:** Implement server-side Expo Push API integration in the Express server.

### PaymentModal Does Not Verify Payment

**Why:** Paystack integration was not completed. Bank transfer confirmation is manual.  
**Impact:** Orders can be "paid" without actual payment.  
**Fix direction:** Implement Paystack webhook at `POST /api/paystack/webhook`, verify HMAC signature with `PAYSTACK_SECRET_KEY`, confirm order payment in Supabase.

### Dark Mode Disabled

**Why:** Intentional product decision — light mode enforced per spec.  
**Impact:** The dark palette in `colors.ts` is unused dead code.  
**Fix direction:** To re-enable, change `useColors()` to return `colors.dark` when `colorScheme === "dark"`.

### API Server Is a Stub

**Why:** The backend was not yet built — all logic went into the client.  
**Impact:** No webhook handling, no server-side validation, no push notification dispatch.  
**Fix direction:** Implement routes one by one, starting with Paystack webhook and push notification sender.

---

## Section 23 — Recommended Engineering Workflow

### Modules to Rarely Touch

1. **`types/index.ts`** — changing types ripples everywhere; always check consumers
2. **`app/_layout.tsx`** — provider order matters; errors here crash the entire app
3. **`lib/supabase.ts`** — session storage decision (AsyncStorage) is deliberate and must not change without migrating existing sessions
4. **`supabase/schema.sql`** — changes here require corresponding Supabase dashboard migrations; never add/remove columns without updating all app code that references them
5. **`contexts/AuthContext.tsx`** — the route guard logic is subtle; regressions here lock users out of the app

### Modules That Are Isolated

1. **`hooks/useNetworkStatus.ts`** — no dependencies on business logic; can be modified without side effects
2. **`constants/colors.ts`** — design tokens only; changing values affects appearance but not logic
3. **`lib/offlineQueue.ts`** — standalone AsyncStorage CRUD; only consumed by `OrdersContext`
4. **`app/(customer)/help.tsx`**, **`terms.tsx`**, **`privacy.tsx`** — static content screens with no business logic
5. **`app/(admin)/analytics.tsx`** — read-only derived data; cannot mutate anything

### Modules with Many Dependencies

1. **`OrdersContext.tsx`** — consumed by every role's screens; change the API and 20+ screens break
2. **`constants/services.ts`** — `DEFAULT_BUSINESS_ID` and `DISPATCHERS` are used in order creation and assignment throughout
3. **`lib/subscription.ts`** — `SUBSCRIPTION_PLANS` is imported by `SubscriptionContext`, `SubscriptionPaywall`, `(admin)/index.tsx`, `(admin)/businesses.tsx`

### Recommended Debugging Approach

1. **Blank white screen on launch:** fonts not loaded → check `app/_layout.tsx` useFonts
2. **Stuck on loading spinner after auth:** `isLoading` never became false → check Supabase network or AsyncStorage access
3. **Order not appearing after creation:** check Supabase insert error in `console.log` → check `[LaundryLink] createOrder Supabase error` log
4. **Subscription paywall always showing:** clear AsyncStorage key `ll_subscription_v1` or call `beginTrial()` in dev
5. **Admin Quick Actions not navigating:** check that `router.push(route)` paths match the actual tab screen names
6. **Realtime not updating:** check Supabase dashboard → Database → Replication → ensure `orders` table is enabled for realtime

### Recommended Deployment Order

1. Deploy Supabase schema (run `schema.sql` in Supabase SQL Editor)
2. Deploy API server (`artifacts/api-server`) — needed for health checks
3. Set environment variables (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_PAYSTACK_KEY`)
4. Build mobile app via EAS (`eas build --platform android --profile preview`)
5. Before production: implement Paystack webhook, cross-device push, subscription Supabase sync

---

## Section 24 — Onboarding Guide

### How to Understand This Project Quickly (Suggested Reading Order)

**Day 1 — Understand the domain:**
1. Read `replit.md` (project overview, stack, structure)
2. Read `types/index.ts` (all data shapes — 10 minutes)
3. Read `supabase/schema.sql` (database — 15 minutes)
4. Read `lib/subscription.ts` (plan definitions — 5 minutes)

**Day 2 — Understand auth and data:**
5. Read `lib/supabase.ts` (client setup — 5 minutes)
6. Read `contexts/AuthContext.tsx` (auth flow — 30 minutes)
7. Read `contexts/OrdersContext.tsx` (the core data layer — 45 minutes)
8. Read `constants/services.ts` and `constants/laundromats.ts` (hardcoded data — 10 minutes)

**Day 3 — Understand the screens:**
9. Walk through `app/(auth)/login.tsx` and `signup.tsx`
10. Walk through `app/(customer)/create-order.tsx` (the most complex screen)
11. Walk through `app/order/[id].tsx` (the shared order detail)
12. Walk through `app/(admin)/index.tsx` and `businesses.tsx`

**Day 4 — Understand the gaps:**
13. Read `components/PaymentModal.tsx` — understand it doesn't call Paystack
14. Read `app/(dispatcher)/kyc.tsx` — understand it's a placeholder
15. Read `artifacts/api-server/src/` — understand it's essentially empty
16. Read this document's Section 20 (Hidden Knowledge)

### Common Pitfalls

1. **"Why doesn't dark mode work?"** — `useColors()` always returns light. This is intentional.
2. **"Why can't I see the business's orders?"** — RLS shows all orders to all businesses. Not a bug — it's a known limitation.
3. **"The dispatcher I assigned doesn't see the order"** — Dispatchers in `DISPATCHERS` constant are fake UUIDs.
4. **"My subscription disappeared"** — AsyncStorage was cleared. Check `ll_subscription_v1`.
5. **"Changes to code don't appear"** — Metro is in CI mode (`CI=1`). Restart the workflow.
6. **"The notification fires on my phone, not the customer's"** — All notifications are local-device only.
7. **"TS errors everywhere"** — The 22 pre-existing errors in `BlurView`, `MapView`, `GestureHandlerRootView` are type definition mismatches, not logic errors. Do not try to fix them by changing component code.

### How to Safely Add a New Feature

1. Start by defining any new types in `types/index.ts`
2. If it requires database storage: add a table to `schema.sql` + run migration in Supabase
3. If it requires new context state: add to the appropriate context (Auth/Orders/Subscription) or create a new context
4. Build the screen in the appropriate role folder
5. Register the screen in the role's `_layout.tsx`
6. If it should be accessible from the admin dashboard Quick Actions: add an entry to the array in `(admin)/index.tsx`
7. Run `pnpm --filter @workspace/laundry-link run typecheck` before considering it done

### How to Safely Modify an Existing Feature

1. **Identify all consumers** — use grep to find every file that imports the thing you're changing
2. **Check the context API** — changing a function signature in a context breaks every screen that calls it
3. **Check `types/index.ts`** — changing a type shape breaks every place that constructs or reads that shape
4. **Do not change AsyncStorage keys** — changing `"ll_subscription_v1"` to something else leaves all existing users with stale data in the old key; implement a migration if needed
5. **Do not change the Supabase column name convention** — the `mapOrder()` function in `OrdersContext` maps snake_case → camelCase; if you rename a column, update this mapper

---

## Section 25 — Final Knowledge Transfer Summary

### Top 20 Most Important Things Every New Engineer Must Know

1. **The API server is a stub.** All business logic is client-side directly against Supabase.
2. **Subscription state is AsyncStorage-only.** Reinstalling the app wipes it. Supabase has subscription columns that are unused.
3. **Dark mode is disabled.** `useColors()` always returns light. This is intentional.
4. **PaymentModal does not call Paystack.** It generates a fake reference and calls `onSuccess` immediately.
5. **Dispatchers are fake.** `DISPATCHERS` in `constants/services.ts` has fake UUIDs that don't match any real users.
6. **All notifications are device-local.** Cross-device push requires a server sender that doesn't exist yet.
7. **All businesses see all orders.** Business RLS is role-based, not business-scoped.
8. **The Super Admin passphrase is `"MAFIA CODE BRUV"`.** It's hardcoded. Anyone with source access knows it.
9. **`DEFAULT_BUSINESS_ID` ("freshclean-jos") does not exist in the Supabase seed.** The seed has "cleanpro-abuja". This is a data mismatch.
10. **Metro runs in CI mode.** Code changes require a workflow restart to take effect.
11. **Session is restored before the network probe.** Auth works even if Supabase is temporarily unreachable.
12. **AsyncStorage has version-suffixed keys** (v1, v4). These imply previous versions existed; do not mix old and new keys.
13. **Demo mode = Supabase keys absent.** If keys are present but Supabase is unreachable, `isDemo` is false and real errors are surfaced.
14. **`push_tokens` table is populated but never read.** Server-side push dispatch is missing.
15. **KYC screen is placeholder.** No data is persisted from the KYC form.
16. **TanStack React Query is installed but unused.** `QueryClientProvider` is mounted; zero `useQuery` calls exist.
17. **`user_role` AsyncStorage key is written but never read.** The role always comes from JWT. This write is dead state.
18. **Business history RLS joins on `businesses` table** which may not have a matching row for every `business_id` in orders (since the FK was dropped).
19. **`expo-secure-store` is listed as a dependency but explicitly not used** for auth sessions. AsyncStorage is used instead due to iOS 2 KB limit.
20. **Subscription prices in code (₦10k/₦18k/₦30k) differ from documentation (₦15k/₦35k/₦70k).** The code is authoritative.

### Top 20 Highest-Risk Files

| # | File | Risk |
|---|---|---|
| 1 | `app/_layout.tsx` | Crashes entire app if broken |
| 2 | `contexts/AuthContext.tsx` | Locks all users out if route guard breaks |
| 3 | `contexts/OrdersContext.tsx` | Breaks all order functionality |
| 4 | `lib/supabase.ts` | Breaks all Supabase connectivity |
| 5 | `supabase/schema.sql` | Schema changes require careful migration |
| 6 | `contexts/SubscriptionContext.tsx` | Breaks business access gating |
| 7 | `lib/subscription.ts` | Plan logic used everywhere |
| 8 | `types/index.ts` | Type changes ripple throughout |
| 9 | `constants/services.ts` | DEFAULT_BUSINESS_ID used in order creation |
| 10 | `app/(auth)/login.tsx` | Only user entry point |
| 11 | `app/(auth)/signup.tsx` | Only user creation path |
| 12 | `hooks/useAdminAccess.ts` | Contains the hardcoded passphrase |
| 13 | `app/order/[id].tsx` | Shared across all roles; complex logic |
| 14 | `components/SubscriptionPaywall.tsx` | Gates all business functionality |
| 15 | `app/(customer)/create-order.tsx` | Core customer action |
| 16 | `hooks/useNetworkStatus.ts` | Offline detection affects order creation |
| 17 | `lib/offlineQueue.ts` | AsyncStorage key mismatch could lose queued orders |
| 18 | `components/PaymentModal.tsx` | Simulates payment — security risk |
| 19 | `app/(admin)/settings.tsx` | Admin role management (simulated) |
| 20 | `artifacts/api-server/src/app.ts` | Entry point for all future backend routes |

### Top 20 Core Files

| # | File | Why Core |
|---|---|---|
| 1 | `types/index.ts` | All data shapes |
| 2 | `contexts/AuthContext.tsx` | Auth + routing |
| 3 | `contexts/OrdersContext.tsx` | All order operations |
| 4 | `lib/supabase.ts` | Database connection |
| 5 | `supabase/schema.sql` | Database structure |
| 6 | `contexts/SubscriptionContext.tsx` | Subscription gating |
| 7 | `lib/subscription.ts` | Plan definitions |
| 8 | `app/_layout.tsx` | App shell |
| 9 | `constants/services.ts` | Default business + dispatchers |
| 10 | `constants/laundromats.ts` | Business picker data |
| 11 | `app/(customer)/create-order.tsx` | Core customer action |
| 12 | `app/order/[id].tsx` | Order detail + actions |
| 13 | `hooks/useColors.ts` | Design system |
| 14 | `constants/colors.ts` | Design tokens |
| 15 | `lib/notifications.ts` | Notification helpers |
| 16 | `hooks/useNetworkStatus.ts` | Connectivity detection |
| 17 | `lib/offlineQueue.ts` | Offline resilience |
| 18 | `components/SubscriptionPaywall.tsx` | Business revenue gate |
| 19 | `components/PaymentModal.tsx` | Customer payment UX |
| 20 | `hooks/useAdminAccess.ts` | Admin role hierarchy |

### Top 20 Safest Files to Modify

| # | File | Why Safe |
|---|---|---|
| 1 | `app/(customer)/help.tsx` | Static content, no business logic |
| 2 | `app/(customer)/terms.tsx` | Static content |
| 3 | `app/(customer)/privacy.tsx` | Static content |
| 4 | `constants/colors.ts` | Visual only, no logic |
| 5 | `app/+not-found.tsx` | Never affects normal flow |
| 6 | `components/EmptyState.tsx` | Purely presentational |
| 7 | `components/StatusBadge.tsx` | Purely presentational |
| 8 | `components/SkeletonLoader.tsx` | Purely presentational |
| 9 | `app/(admin)/analytics.tsx` | Read-only derived data |
| 10 | `app/(dispatcher)/vehicle-details.tsx` | AsyncStorage only |
| 11 | `app/(dispatcher)/service-area.tsx` | AsyncStorage only |
| 12 | `components/DemoModeBanner.tsx` | Single boolean condition |
| 13 | `components/ErrorFallback.tsx` | Only renders on crash |
| 14 | `app/(customer)/saved-addresses.tsx` | AsyncStorage only |
| 15 | `app/(customer)/payment-methods.tsx` | Static explainer UI |
| 16 | `app/(customer)/notifications-screen.tsx` | Local notification list |
| 17 | `artifacts/api-server/src/routes/health.ts` | Isolated route |
| 18 | `app/(admin)/orders.tsx` | Read-only monitoring |
| 19 | `app/(admin)/users.tsx` | Simulated user management |
| 20 | `hooks/useNetworkStatus.ts` | No business state dependencies |

### Top 20 Architectural Decisions

| # | Decision | Reason |
|---|---|---|
| 1 | AsyncStorage for sessions instead of expo-secure-store | iOS 2 KB limit silently fails with full Supabase sessions |
| 2 | Client-direct Supabase access (no backend API layer) | Speed of development; RLS handles authorization |
| 3 | Subscription stored in AsyncStorage (not Supabase) | Paystack webhook not implemented; no trusted confirmation event |
| 4 | P2P payment model (no platform wallet) | Simplifies legal/financial compliance; no escrow needed |
| 5 | Demo mode when env vars absent | Allows full app testing without Supabase setup |
| 6 | Lazy-loading expo-notifications | Prevents crashes in Expo Go on Android SDK 53+ |
| 7 | File-based routing (Expo Router) | Eliminates boilerplate navigation setup |
| 8 | Role stored in user_metadata (JWT) | Role available client-side without extra DB query |
| 9 | Dropped business_id FK on orders | Prevents RLS circular dependency on order creation |
| 10 | Light-mode-only enforcement | Product spec decision; dark palette preserved for future |
| 11 | Supabase realtime for "live" driver tracking | Avoids Socket.IO infrastructure; uses existing Supabase subscription |
| 12 | Offline queue with max 3 retry attempts | Prevents infinite retry loops; discards stale orders |
| 13 | Hardcoded laundromats in constants | No business onboarding flow; speeds up MVP |
| 14 | Hardcoded dispatcher list | No real dispatcher profiles; speeds up order flow testing |
| 15 | useProtectedRoute inside AuthProvider | Auth state is co-located with routing logic |
| 16 | Per-role tab groups in separate Expo Router groups | Clean separation of role UIs; impossible to navigate cross-role |
| 17 | AsyncStorage key versioning (v1, v4) | Allows breaking changes without migrating old data |
| 18 | `testSupabaseConnection` as background probe | Never blocks auth; purely informational |
| 19 | `safe<T>` wrapper in AuthContext | Prevents uncaught promise rejections from Supabase calls |
| 20 | `mapOrder()` function for snake→camelCase | Single translation layer between DB and app types |

### Top Technical Debt Items

1. Subscription not synced to Supabase (risk: data loss on reinstall)
2. Paystack webhook not implemented (risk: unverified payments)
3. Dispatchers are fake UUIDs (risk: broken feature)
4. Business order isolation not enforced (risk: data leak in multi-tenant)
5. Super Admin passphrase hardcoded in source (risk: security)
6. KYC has no backend (risk: unverified dispatchers)
7. Cross-device push notifications not implemented
8. No review/dispute/refund flow
9. `businesses` table subscription columns never used
10. `push_tokens` table never consumed server-side
11. Subscription price mismatch (code vs docs)
12. `DEFAULT_BUSINESS_ID` doesn't match any seeded Supabase row
13. `user_role` AsyncStorage key written but never read
14. TanStack React Query installed and unused
15. `profiles.updated_at` has no auto-update trigger

### Top Future Opportunities

1. Paystack webhook + Supabase subscription sync → real billing
2. Server-side Expo push dispatch → real cross-device notifications
3. Real dispatcher matching (zone-based, proximity-based)
4. Business onboarding flow (self-registration + admin verification)
5. Real Supabase query for business selection in order creation
6. Review and rating system
7. Dispute and refund flow
8. Real-time driver tracking via Supabase Broadcast (not full refresh)
9. Multi-branch support for Enterprise businesses
10. Dark mode re-enable (infrastructure already exists)
11. CSV export in business analytics
12. Paystack card checkout (currently bank transfer only)
13. KYC backend with document verification
14. Admin real audit log table
15. Subscription plan change notifications

### Onboarding Time Estimate

An experienced React Native engineer with Supabase familiarity, reading this document plus the source files it references, should reach **full operational understanding** — able to safely add features and fix bugs without introducing regressions — in approximately:

- **2–3 days** to understand the codebase structure, auth, orders, and subscription systems
- **4–5 days** to understand all screens, edge cases, and hidden quirks
- **7–10 days** to be fully confident making changes to any module, including the backend scaffold

The most time-consuming part will be understanding the interaction between Supabase RLS policies and the client-side role filtering in `OrdersContext`, and the subscription system's gap between the AsyncStorage state and the Supabase `businesses` table.

---

*End of Developer Knowledge Transfer Document. All information was derived from direct inspection of the source code. No code was modified, generated, or refactored during the preparation of this document.*
