# LaundryLink — Complete Engineering Handover Audit

**Prepared by:** Principal Software Engineer (incoming)
**Codebase inspected:** `/home/runner/workspace` — pnpm monorepo, React Native + Expo SDK 54
**Date:** July 11, 2026
**Purpose:** Full reverse-engineering handover. No code was modified during this audit.

---

## Section 1 — Executive Summary

### What LaundryLink Is

LaundryLink is a multi-role mobile marketplace platform for laundry logistics in Nigeria (Abuja-first). It connects **customers** who need laundry done, **businesses** (laundromats) that process clothes, and **dispatchers** (riders) who handle pickup and delivery. An **admin** role oversees the platform. The payment model is fully peer-to-peer (P2P) — no platform wallet, no commissions. Revenue comes from SaaS subscriptions sold to businesses (in Naira).

### Maturity Level

| Dimension | Assessment |
|---|---|
| Overall completion | ~55% |
| Architecture quality | Good foundation, several critical gaps |
| Code quality | Consistent, readable, well-typed |
| Technical debt | Low-to-medium |
| Deployment readiness | Not production-ready |
| Marketplace readiness | No |
| Production readiness | No |

### Estimated Completion by Module

| Module | Completion |
|---|---|
| Auth (login/signup/roles) | 90% |
| Customer flow (order, track, pay) | 75% |
| Business flow (accept, update, services) | 70% |
| Dispatcher flow (delivery, KYC, zone) | 55% |
| Admin dashboard | 65% |
| Subscription/billing | 40% |
| Notifications (push) | 60% |
| API server (backend) | 5% |
| Payment (Paystack) | 55% |
| Realtime (Supabase) | 60% |
| Maps | 50% |
| Review / dispute / refund flows | 0% |
| Socket.IO / live tracking server | 0% |
| Cloudinary / media upload | 0% |

### Current Strengths

- Clean TypeScript throughout with consistent naming conventions
- Dual-mode operation (Supabase live / local demo fallback) works well
- Offline queue for order creation is thoughtfully implemented
- Role-based routing is solid and prevents wrong-role screen access
- Supabase RLS policies are mostly correct and security-conscious
- Dark mode is complete across all screens
- Order status history tracking is correctly wired end-to-end
- `safe()` error wrapper in AuthContext prevents uncaught promise crashes

### Current Weaknesses

- **API server is a stub** — only a health endpoint exists; all business logic is entirely client-side
- **Subscription state is AsyncStorage-only** — not synced to Supabase; Supabase `businesses` table has subscription columns that are completely unused by the app
- **Subscription prices are inconsistent** between `lib/subscription.ts` (₦10k/₦18k/₦30k) and `replit.md` (₦15k/₦35k/₦70k)
- **Super Admin passphrase is hardcoded** as a plaintext string in source code
- **Admin Quick Actions were non-functional** (all `View` — no navigation wired) — fixed during this engagement
- **Businesses screen used wrong context** (admin's own subscription shown for all businesses) — fixed during this engagement
- **Business order isolation is not enforced client-side** — any BUSINESS user sees all orders (relies entirely on RLS which may not be configured correctly in all deployments)
- **Dispatcher pool assignment is not implemented** — the query `not("assigned_driver_id", "is", null)` shows ALL dispatched orders to ALL dispatchers simultaneously (no per-dispatcher scoping)
- **KYC form has no backend** — data is captured in UI but never persisted
- **No review, dispute, or refund flows exist**
- **No Socket.IO** — live driver location is polled via Supabase, not streamed

### Highest Risks

1. Subscription state stored in AsyncStorage means **clearing app data or reinstalling wipes the subscription** — businesses lose access
2. The hardcoded Super Admin passphrase (`"MAFIA CODE BRUV"`) is visible to anyone with source access
3. Dispatcher order visibility is not scoped — all dispatchers see all assigned orders from all businesses
4. `businesses` table uses a **text primary key that defaults to the literal string `'cleanpro-abuja'`** — only one row can exist in the seed
5. The API server is not implemented — any feature that requires server-side logic (webhooks, Paystack verification, push sending) has no backend

### Highest Priorities for Incoming Team

1. Migrate subscription state from AsyncStorage to Supabase `businesses` table
2. Implement Paystack webhook handler in the API server
3. Fix dispatcher order assignment scoping
4. Remove or rotate the hardcoded Super Admin passphrase
5. Implement business-level order isolation

---

## Section 2 — Product Overview

### Business Model

LaundryLink charges laundromats a monthly SaaS subscription (Naira). Customers pay laundromats and dispatchers **directly** — the platform takes no commission.

### Customer Journey

1. Customer signs up with email/password, selects "Customer" role
2. Opens app → redirected to `/(customer)` tab group
3. Creates a new order via 4-step wizard (Pickup address → Delivery address → Service selection → Summary)
4. Order is created in Supabase (status: `PENDING`) with a notification fired
5. Customer tracks order via status cards on the Orders tab
6. When order is `READY`, customer pays the laundromat (P2P: Paystack card or bank transfer)
7. Business confirms payment → status → `OUT_FOR_DELIVERY` → dispatcher dispatched
8. Customer sees live order detail screen with status timeline and map
9. Order marked `DELIVERED` by dispatcher

**Missing:** Rating/review of business or dispatcher after delivery. No refund or dispute mechanism.

### Business Journey

1. Business registers with "Business" role — must separately contact admin to be listed
2. Lands on `/(business)` tab group, gated behind a subscription paywall
3. Purchases/trials a SaaS plan (Starter/Pro/Enterprise) — payment simulated via Paystack
4. Views incoming orders; accepts them (`PENDING → ACCEPTED`)
5. Updates status: `ACCEPTED → PICKED_UP → IN_PROGRESS → READY`
6. Customer pays; business marks `READY → PAID`
7. Assigns a dispatcher (manual, no automated matching)
8. Dispatches for delivery
9. Views analytics (revenue, order breakdown) on the Reports tab
10. Manages custom service pricing on the Services tab

**Missing:** Actual business profile creation form. Businesses are currently created only via manual SQL seed. No multi-branch support (Enterprise feature listed but not built).

### Dispatcher Journey

1. Dispatcher registers with "Dispatcher" role
2. Completes KYC form (NIN, BVN, guarantor) — UI only, no backend storage
3. Sets service zone (multi-select from Abuja zones list, stored in AsyncStorage)
4. Sets vehicle details (AsyncStorage)
5. Views deliveries assigned to them
6. Navigates to pickup address; updates status to `OUT_FOR_DELIVERY`
7. Delivers; marks `DELIVERED`
8. Shares live location to order detail map via `updateDriverLocation`

**Missing:** Automated zone-based dispatcher matching. Dispatcher earnings tracking. Dispatcher rating. KYC verification backend.

### Admin Journey

1. Admin signs up with email/password, selects "Admin" role (or is promoted via Supabase dashboard)
2. Lands on `/(admin)` tab group — 5 tabs: Overview, Users, Orders, Analytics, Settings
3. Views platform stats (total orders, revenue, businesses, active orders)
4. Manages users: search, filter by role, add, suspend, delete
5. Monitors all orders platform-wide with status filter
6. Views analytics: revenue over time, status breakdown, system health
7. Manages role hierarchy via Settings tab (promote/demote admins)
8. Can unlock Super Admin tier via passphrase (`"MAFIA CODE BRUV"`)
9. Super Admin sees additional controls: dispatcher analytics, platform config, business management
10. Views businesses screen (accessible via Quick Actions on the dashboard)

### Sub-Admin Journey

There is no separate `SUB-ADMIN` role in `UserRole`. Admin tier (SUPER vs STAFF) is managed entirely in-app via the `useAdminAccess` hook with passphrase unlock. STAFF admins see the full dashboard but cannot access super-admin-gated sections (dispatcher analytics, business plan management, platform config).

### Payment Flow (P2P)

```
Customer places order → No upfront payment
        ↓
Dispatcher arrives → Customer pays pickup fee DIRECTLY (cash or bank transfer)
        ↓
Laundromat finishes → Status: READY
        ↓
Customer pays service + delivery fee → Paystack card OR bank transfer (P2P)
        ↓
Business confirms receipt → marks PAID
        ↓
Dispatcher dispatched for delivery
        ↓
Dispatcher paid directly by laundromat or customer
```

The platform never holds money. Paystack is used **only for card processing convenience** — money goes directly to the business.

**Webhook:** Paystack webhooks are not handled. The API server has no webhook endpoint. Payment confirmation is currently manual.

### Order Lifecycle / Status Machine

```
PENDING → ACCEPTED → PICKED_UP → IN_PROGRESS → READY → PAID → OUT_FOR_DELIVERY → DELIVERED
Any state → CANCELLED
```

All transitions are recorded in `order_status_history`. Transitions are manually triggered by the appropriate role (business updates most statuses; dispatcher updates PICKED_UP, OUT_FOR_DELIVERY, DELIVERED; customer pays to trigger PAID).

### Notification Flow

- On `createOrder`: fires `notifyNewOrder` → Expo local notification
- On `updateOrderStatus`: fires `notifyStatusChange` or `notifyOrderReady`
- On `assignDispatcher`: fires `notifyDispatcherAssigned`
- On `markOrderPaid`: fires `notifyPaymentReceived`
- Push token stored in Supabase `push_tokens` table
- `useNotifications` hook handles Expo push token registration and deep link tap routing
- **Missing:** Server-side push dispatch. All notifications are currently **device-local only** — they fire on the same device that triggers the action, not cross-device.

### Commission Model

**None.** Explicitly designed as P2P with no platform commission. Sole revenue stream is the business SaaS subscription.

### KYC Flow

- Dispatcher fills in NIN, BVN, guarantor name/phone on `kyc.tsx`
- Form submits → **data is discarded** (no backend, no Supabase table for KYC data)
- No document upload, no verification, no status tracking
- This is entirely placeholder UI

### Review Flow

**Not implemented.** No UI, no data model, no API endpoint.

### Dispute / Refund Flow

**Not implemented.** No UI, no data model, no API endpoint.

### Business Verification Flow

**Partial.** `is_verified` boolean exists in the `businesses` table and is seeded as `true` for the default business. There is no admin UI flow to verify or reject a new business registration. Verification must be done manually via SQL or Supabase dashboard.

---

## Section 3 — Architecture

### High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                      React Native / Expo App                      │
│                                                                    │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐   │
│  │   AuthCtx   │  │  OrdersCtx   │  │  SubscriptionCtx       │   │
│  │  Supabase   │  │  Supabase +  │  │  AsyncStorage only     │   │
│  │  Auth       │  │  AsyncStorage│  │  (NOT in Supabase)     │   │
│  └─────────────┘  └──────────────┘  └────────────────────────┘   │
│                                                                    │
│  Role-gated Tab Groups:                                           │
│  /(customer) | /(business) | /(dispatcher) | /(admin)            │
└──────────────────────┬───────────────────────────────────────────┘
                       │ REST + Realtime (postgres_changes)
                       ▼
┌──────────────────────────────────────────┐
│            Supabase (hosted)              │
│  • Auth (email/password, JWT sessions)    │
│  • PostgreSQL + RLS                       │
│  • Realtime (postgres_changes channel)    │
│  • Storage (not used — no media upload)   │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│    API Server (Express 5 — STUB)          │
│  • GET /api/healthz only                  │
│  • No business logic implemented          │
│  • No Paystack webhook handler            │
│  • No push notification sender            │
└──────────────────────────────────────────┘

Third-party:
  Paystack   — expo-web-browser opens Paystack checkout (P2P)
  Expo Push  — device-local only (no server sender implemented)
  Maps       — react-native-maps (native) / canvas fallback (web)
```

### Frontend

| Concern | Technology |
|---|---|
| Framework | React Native (Expo SDK 54, managed workflow) |
| Routing | Expo Router v6 (file-based, Stack + Tabs) |
| State | React Context (Auth, Orders, Subscription) |
| Server state | TanStack React Query (installed but unused — no `useQuery` calls) |
| Styling | React Native StyleSheet |
| Design tokens | `constants/colors.ts` via `useColors()` hook |
| Fonts | Inter 400/500/600/700 via `@expo-google-fonts/inter` |
| Icons | `@expo/vector-icons` Feather |
| Gesture handling | `react-native-gesture-handler` |
| Animation | None (no Reanimated, no Animated API) |

### Backend

| Concern | Technology / Status |
|---|---|
| Framework | Express 5 |
| Logger | Pino with `req.log` pattern |
| Routes | `GET /api/healthz` only |
| Database | Not connected |
| Auth middleware | Not implemented |
| Rate limiting | Not implemented |
| Business logic | Not implemented |

### Database

- **Provider:** Supabase (hosted PostgreSQL)
- **Schema:** `artifacts/laundry-link/supabase/schema.sql`
- **ORM:** Drizzle ORM is listed in the stack but **not used** — all access uses the Supabase JS client with raw column names
- **Extensions:** `uuid-ossp`, `pg_stat_statements`

### Authentication

- **Provider:** Supabase Auth (email/password only)
- **Session storage:** AsyncStorage (NOT expo-secure-store — iOS 2 KB per-value limit would truncate sessions)
- **Role storage:** `user.user_metadata.role` (set at signup, carried in JWT)
- **Demo mode:** When env vars are absent, local fake users work in full demo mode

### Authorization

- **Route guard:** `useProtectedRoute()` in AuthContext — redirects on every segment change
- **Role check:** Derived from `user.user_metadata.role`
- **Admin tier:** `useAdminAccess()` hook — SUPER vs STAFF

### Realtime

- **Method:** Supabase `postgres_changes` channel on the `orders` table — any event triggers a full `refreshOrders()` call
- **Socket.IO:** Not implemented
- **Driver location:** Supabase row updates (not true streaming — effectively polling)

### State Management

| Concern | Solution |
|---|---|
| Auth / session | `AuthContext` — Supabase session |
| Orders | `OrdersContext` — Supabase + AsyncStorage fallback |
| Subscription | `SubscriptionContext` — AsyncStorage ONLY |
| Server state | TanStack React Query (mounted, but zero screen usage) |
| Local persistence | AsyncStorage (saved addresses, offline queue, demo user, subscription) |

### Offline Strategy

- `useNetworkStatus` hook: periodic `fetch` probe to `https://clients3.google.com/generate_204`
- `offlineQueue.ts`: AsyncStorage-backed queue for failed order creation
- On re-connect: `OrdersContext` flushes queue (max 3 attempts per item, then discards)
- `OfflineBanner`: slides in from top when offline

### Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | For live mode |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public JWT | For live mode |
| `EXPO_PUBLIC_PAYSTACK_KEY` | Paystack public key (must start with `pk_`) | For live payments |
| `SESSION_SECRET` | API server session signing key | For API server |
| `PORT` | Injected by Replit workflows | Runtime |
| `BASE_PATH` | Injected by Replit proxy | Runtime |

### Folder Structure

```
artifacts/laundry-link/
├── app/
│   ├── _layout.tsx              Root: SafeArea, Contexts, GestureHandler, fonts
│   ├── index.tsx                Auth-based redirect (no UI)
│   ├── +not-found.tsx           404 fallback
│   ├── (auth)/                  Login + Signup
│   ├── (customer)/              Customer tab group — 10 screens
│   ├── (business)/              Business tab group — 6 screens
│   ├── (dispatcher)/            Dispatcher tab group — 6 screens
│   ├── (admin)/                 Admin tab group — 6 screens
│   └── order/[id].tsx           Shared order detail (all roles)
├── components/                  11 shared UI components
├── contexts/                    Auth, Orders, Subscription providers
├── constants/                   colors.ts, services.ts, laundromats.ts
├── hooks/                       useColors, useNetworkStatus, useNotifications, useAdminAccess
├── lib/                         supabase.ts, subscription.ts, offlineQueue.ts, notifications.ts
├── supabase/schema.sql          Full DB schema with RLS
└── types/index.ts               All shared TypeScript types
```

---

## Section 4 — Feature Inventory

### Auth Module

| Feature | Status | Notes |
|---|---|---|
| Email/password signup | ✅ Complete | Role selected at signup |
| Email/password login | ✅ Complete | Real error messages surfaced |
| Role-based redirect on login | ✅ Complete | 4 role groups |
| Session persistence | ✅ Complete | AsyncStorage |
| Demo mode (no Supabase keys) | ✅ Complete | Full local simulation |
| Logout | ✅ Complete | Clears all AsyncStorage |
| Google OAuth | ❌ Missing | |
| Forgot password | ❌ Missing | |
| Reset password | ❌ Missing | |
| Email verification | ❌ Missing | Not handled in-app |
| Phone verification | ❌ Missing | |

### Customer Module

| Feature | Status | Notes |
|---|---|---|
| Home screen with active orders | ✅ Complete | No mock data |
| 4-step order creation wizard | ✅ Complete | Pickup → Delivery → Services → Summary |
| Order list with status tracking | ✅ Complete | |
| Order detail with timeline | ✅ Complete | |
| Live map (driver location) | ⚠️ Partial | Native: MapView+Polyline. Web: canvas fallback. Not streamed. |
| Payment modal (Paystack) | ⚠️ Partial | Opens Paystack checkout; no webhook verification |
| Saved addresses | ✅ Complete | AsyncStorage |
| Payment methods explainer | ✅ Complete | P2P explainer only |
| Notifications screen | ✅ Complete | Local notification list |
| Help screen | ✅ Complete | FAQ, contact form (UI only) |
| Terms of Service | ✅ Complete | |
| Privacy Policy | ✅ Complete | NDPR-aware |
| Profile screen | ✅ Complete | Links to sub-screens |
| Review / Rating | ❌ Missing | |
| Order cancellation UI | ⚠️ Partial | Status exists in enum; no dedicated cancel UI |
| Dispute flow | ❌ Missing | |
| Refund flow | ❌ Missing | |

### Business Module

| Feature | Status | Notes |
|---|---|---|
| Dashboard with live stats | ✅ Complete | Subscription-gated |
| Subscription paywall | ✅ Complete | Shows plans, trial, purchase |
| Plan purchase via Paystack | ⚠️ Partial | PaymentModal opens; state written to AsyncStorage only |
| Order management | ✅ Complete | Accept, update status, full lifecycle |
| Dispatcher assignment | ⚠️ Partial | Manual — no zone matching |
| Custom service pricing | ✅ Complete | AsyncStorage |
| Analytics / Reports | ✅ Complete | Revenue, status breakdown — no CSV export |
| Business profile | ⚠️ Partial | Read-only display. No edit form. |
| Business registration | ❌ Missing | No in-app form. Must be manually seeded in Supabase. |
| Multi-branch support | ❌ Missing | Enterprise feature — not built |

### Dispatcher Module

| Feature | Status | Notes |
|---|---|---|
| Dashboard with delivery stats | ✅ Complete | |
| Active delivery list | ✅ Complete | |
| Order detail + status update | ✅ Complete | |
| Live location sharing | ⚠️ Partial | Supabase update-based, not streamed |
| Vehicle details | ✅ Complete | AsyncStorage |
| Service area selection | ✅ Complete | Abuja zones, AsyncStorage |
| KYC form | ⚠️ Placeholder | UI only — no backend, no persistence |
| KYC verification status | ❌ Missing | |
| Earnings tracking | ❌ Missing | |
| Zone-based auto-matching | ❌ Missing | |
| Dispatcher rating | ❌ Missing | |

### Admin Module

| Feature | Status | Notes |
|---|---|---|
| Dashboard overview (stats) | ✅ Complete | Live from OrdersContext |
| Quick Actions navigation | ✅ Fixed | Was broken (plain Views) — now 5 Pressable items with router.push |
| User management | ✅ Complete | Search, filter, suspend, delete, add user |
| Order monitoring | ✅ Complete | Search, status filter, sort |
| Analytics | ✅ Complete | Revenue charts, system health, role-gated dispatcher metrics |
| Businesses screen | ✅ Fixed | Was using wrong subscription context — now shows all businesses with simulated tiers |
| Role hierarchy / settings | ✅ Complete | Super/Staff tier, passphrase unlock, activity log |
| Super Admin passphrase | ⚠️ Security risk | Hardcoded plaintext `"MAFIA CODE BRUV"` in source |
| Admin can suspend businesses | ⚠️ Placeholder | Button exists for super admin; no backend |
| Admin can promote users | ⚠️ Partial | UI in settings.tsx; no Supabase write |

### Subscription Module

| Feature | Status | Notes |
|---|---|---|
| 3-tier plan display | ✅ Complete | Starter / Pro / Enterprise |
| 7-day free trial | ✅ Complete | Timer tracked in AsyncStorage |
| Plan purchase (simulated) | ⚠️ Partial | Opens Paystack; writes to AsyncStorage only |
| Feature gating | ✅ Complete | `canAccess(feature)` correctly gates screens |
| Subscription expiry | ✅ Complete | Checked on each read from AsyncStorage |
| Subscription synced to Supabase | ❌ Missing | businesses table has the columns; app never writes them |
| Paystack webhook verification | ❌ Missing | No API server handler |
| Plan upgrade/downgrade | ✅ Complete | |
| Plan cancellation | ✅ Complete | |

---

## Section 5 — Authentication & Authorization

### Login Flow

1. User enters email + password on `(auth)/login.tsx`
2. `signIn()` calls `supabase.auth.signInWithPassword()`
3. Supabase returns a JWT session — stored in AsyncStorage automatically
4. `onAuthStateChange` fires → sets `user`, `session`, `role` in state
5. `useProtectedRoute` routes user to their role's tab group

### Signup Flow

1. User enters name, email, password, selects role on `(auth)/signup.tsx`
2. `signUp()` calls `supabase.auth.signUp()` with `options.data = { full_name, role }`
3. Supabase trigger `on_auth_user_created` auto-inserts a `profiles` row
4. `supabase.auth.updateUser()` called again to ensure metadata is set (redundant but harmless)
5. Role also stored in AsyncStorage (`user_role` key) — redundant since JWT carries it

### Protected Routes

`useProtectedRoute()` runs in AuthContext on every segment change:
- No user + not in `(auth)` → redirect to login
- User + in `(auth)` → redirect to role's home

### Role Permissions Summary

| Permission | Customer | Business | Dispatcher | Admin |
|---|---|---|---|---|
| Place order | ✅ | ❌ | ❌ | ❌ |
| View own orders | ✅ | N/A | N/A | ✅ all |
| Accept/update order status | ❌ | ✅ | Partial | ✅ |
| Assign dispatcher | ❌ | ✅ | ❌ | ✅ |
| Mark order paid | ❌ | ✅ | ❌ | ✅ |
| Update driver location | ❌ | ❌ | ✅ | ❌ |
| Manage service pricing | ❌ | ✅ | ❌ | ❌ |
| View analytics | ❌ | ✅ own | ❌ | ✅ all |
| Manage users | ❌ | ❌ | ❌ | ✅ |
| Manage businesses | ❌ | ❌ | ❌ | ✅ Super |
| Purchase subscription | ❌ | ✅ | ❌ | ❌ |
| Unlock Super Admin | ❌ | ❌ | ❌ | ✅ passphrase |

### Admin Tier System

| Method | How it works |
|---|---|
| Metadata | `user.user_metadata.admin_tier === "SUPER"` (set via Supabase dashboard) |
| Email list | `HARDCODED_SUPER_EMAILS` array in source (currently empty) |
| Passphrase | Enter `"MAFIA CODE BRUV"` in Settings → stored in AsyncStorage `admin_super_session` |

Super session persists across app restarts until explicitly revoked. The passphrase is visible to anyone with source code access — this must be replaced before any public release.

---

## Section 6 — Database Audit

### Table: `profiles`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | References `auth.users(id)` — cascade delete |
| `email` | text NOT NULL | Duplicated from auth.users — can drift |
| `full_name` | text | Nullable |
| `role` | text NOT NULL | CHECK: CUSTOMER/BUSINESS/DISPATCHER/ADMIN |
| `phone` | text | Nullable, no unique constraint |
| `avatar_url` | text | Nullable — no media upload integration |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | **No auto-update trigger** |

**Issues:** No index on `role`; `updated_at` never auto-updates; `avatar_url` unpopulatable.

### Table: `businesses`

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | **Defaults to literal `'cleanpro-abuja'`** — not a UUID |
| `user_id` | uuid | References `auth.users(id)` — nullable |
| `name` | text NOT NULL | |
| `subscription_tier` | text | CHECK: STARTER/PRO/ENTERPRISE — **NEVER WRITTEN BY APP** |
| `subscription_active` | boolean | Default false — **NEVER WRITTEN BY APP** |
| `subscription_expires_at` | timestamptz | Nullable — **NEVER WRITTEN BY APP** |
| `is_verified` | boolean | Default false |
| `logo_url` | text | No upload integration |

**Critical Issues:** Text PK defaulting to a literal string means only one seed business exists by default. Subscription columns are schema-only; the app uses AsyncStorage instead. No insert RLS policy (businesses created only via SQL).

### Table: `orders`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `uuid_generate_v4()` |
| `order_number` | text UNIQUE | Format: `LL-{6 digits}` |
| `customer_id` | uuid NOT NULL | References `auth.users(id)` |
| `business_id` | text NOT NULL | **No FK constraint** (intentionally dropped) |
| `assigned_driver_id` | uuid | No FK constraint |
| `status` | text | CHECK constraint (9 valid values) |
| `items` | jsonb | Array of OrderItem — not queryable per-field |
| `total_amount` | numeric(10,2) | |
| `delivery_fee` | numeric(10,2) | Default ₦1,500 |
| `driver_lat` / `driver_lng` | double precision | Location polling |
| `paystack_ref` | text | Unverified — set by client |
| `paid_at` | timestamptz | |

**Indexes:** customer_id, business_id, status, created_at DESC — well-indexed.

**Issues:** Both `business_id` and `assigned_driver_id` FKs were dropped (no referential integrity). All name fields (customer_name, business_name, assigned_driver_name) are denormalized and will drift. `paystack_ref` is set client-side without server verification.

### Table: `order_status_history`

Append-only audit table. Well-designed. Cascades on order delete. Indexed on `order_id`.

**Issue:** The business history RLS policy JOINs `businesses b ON b.id = o.business_id` — since that FK was dropped, this JOIN may produce empty results if the business_id in orders doesn't match a row in businesses.

### Table: `push_tokens`

Clean design. Unique constraint on `(user_id, token)`. Not consumed by any server-side push sender (server not implemented).

### Missing Tables

| Table | Needed For |
|---|---|
| `kyc_submissions` | Dispatcher KYC data |
| `reviews` | Customer ratings of businesses and dispatchers |
| `disputes` | Order dispute tracking |
| `refunds` | Refund request tracking |
| `saved_addresses` | Currently AsyncStorage-only |
| `service_pricing` | Currently AsyncStorage-only per business |
| `notifications` | Notification inbox (currently device-local only) |
| `admin_activity_log` | Currently simulated in-memory in settings.tsx |

---

## Section 7 — API Audit

### Implemented Endpoints

| Method | Path | Auth | Status |
|---|---|---|---|
| GET | `/api/healthz` | None | ✅ Returns health status |

### Missing Endpoints (Required for Production)

| Endpoint | Purpose |
|---|---|
| `POST /api/paystack/webhook` | Verify Paystack HMAC signature, confirm subscription/payment |
| `POST /api/push/send` | Server-side Expo push notification dispatch |
| `GET /api/admin/users` | Server-side user management |
| `POST /api/kyc/submit` | Store and queue KYC submissions |
| `GET /api/businesses` | Business registry |
| `POST /api/businesses` | Create new business |
| `PATCH /api/orders/:id/status` | Authorized status transitions with server validation |
| `POST /api/subscriptions/activate` | Write subscription to Supabase after Paystack confirmation |

**Critical note:** All data access is currently client-to-Supabase using the anon key. Business logic (status transition validation, subscription gating, payment verification) is fully client-side and can be bypassed.

---

## Section 8 — Frontend Audit

### Screens by Role Group

#### `(auth)/` — 2 screens

| Screen | Status | Notes |
|---|---|---|
| `login.tsx` | ✅ Complete | Error display, links to signup |
| `signup.tsx` | ✅ Complete | Name/email/password/role selector, demo mode aware |

#### `(customer)/` — 10 screens

| Screen | Status | Notes |
|---|---|---|
| `index.tsx` | ✅ Complete | Active orders, CTA, how-it-works |
| `create-order.tsx` | ✅ Complete | 4-step wizard, real submission |
| `orders.tsx` | ✅ Complete | Order list with status tracking |
| `profile.tsx` | ✅ Complete | Menu with sub-screen links |
| `saved-addresses.tsx` | ✅ Complete | Add/edit/default, AsyncStorage |
| `payment-methods.tsx` | ✅ Complete | P2P explainer only |
| `notifications-screen.tsx` | ✅ Complete | Local notification list, mark-read |
| `help.tsx` | ✅ Complete | FAQ accordion, contact form (UI only) |
| `terms.tsx` | ✅ Complete | 10 sections, NDPR-aware |
| `privacy.tsx` | ✅ Complete | 9 sections, NDPR compliant |

#### `(business)/` — 6 screens

| Screen | Status | Notes |
|---|---|---|
| `index.tsx` | ✅ Complete | Subscription-gated, live stats |
| `orders.tsx` | ✅ Complete | Accept/update, assign dispatcher |
| `services.tsx` | ✅ Complete | Custom pricing, AsyncStorage |
| `reports.tsx` | ✅ Complete | Revenue, status breakdown — no CSV export |
| `subscription.tsx` | ⚠️ Partial | Plan management; payment writes to AsyncStorage only |
| `profile.tsx` | ⚠️ Partial | Display only — no edit form |

#### `(dispatcher)/` — 6 screens

| Screen | Status | Notes |
|---|---|---|
| `index.tsx` | ✅ Complete | Delivery stats dashboard |
| `deliveries.tsx` | ✅ Complete | Active delivery list |
| `profile.tsx` | ✅ Complete | Links to sub-screens |
| `vehicle-details.tsx` | ✅ Complete | AsyncStorage |
| `service-area.tsx` | ✅ Complete | Zone multi-select, AsyncStorage |
| `kyc.tsx` | ⚠️ Placeholder | UI only — no backend |

#### `(admin)/` — 6 screens

| Screen | Status | Notes |
|---|---|---|
| `index.tsx` | ✅ Fixed | Quick Actions now navigate (5 items, Pressable + router.push) |
| `users.tsx` | ✅ Complete | Search, filter, suspend, delete, add user modal |
| `orders.tsx` | ✅ Complete | Platform-wide order monitoring |
| `analytics.tsx` | ✅ Complete | Revenue, system health, role-gated dispatcher metrics |
| `settings.tsx` | ✅ Complete | Role hierarchy, passphrase unlock, activity log |
| `businesses.tsx` | ✅ Fixed | Removed wrong subscription context; per-business simulated tiers |

#### Shared Screens

| Screen | Status | Notes |
|---|---|---|
| `order/[id].tsx` | ✅ Complete | Order detail, live map, status timeline |
| `index.tsx` (root) | ✅ Complete | Auth redirect only |
| `+not-found.tsx` | ✅ Complete | 404 fallback |

### Components

| Component | Status | Notes |
|---|---|---|
| `SubscriptionPaywall.tsx` | ✅ Complete | Plan cards, trial, upgrade/cancel |
| `PaymentModal.tsx` | ⚠️ Partial | Paystack via expo-web-browser; no webhook verification |
| `DemoModeBanner.tsx` | ✅ Complete | Amber banner when demo mode active |
| `OfflineBanner.tsx` | ✅ Complete | Slides down when offline |
| `SkeletonLoader.tsx` | ✅ Complete | Skeleton cards for loading states |
| `OrderCard.tsx` | ✅ Complete | Status-colored order summary card |
| `OrderMap.tsx` | ⚠️ Partial | Web canvas fallback (no real map on web) |
| `OrderMap.native.tsx` | ✅ Complete | MapView + Polyline + Markers (native only) |
| `OrderTimeline.tsx` | ✅ Complete | Status history timeline |
| `StatusBadge.tsx` | ✅ Complete | Color-coded status chips |
| `RoleSelector.tsx` | ✅ Complete | Role picker for signup |
| `ErrorBoundary.tsx` | ✅ Complete | React error boundary at root |
| `EmptyState.tsx` | ✅ Complete | Reusable empty state component |

### Dark Mode

Fully implemented across all screens via `useColorScheme()` → `useColors()`. Light/dark palettes in `constants/colors.ts`.

### Accessibility

Not audited. No `accessibilityLabel`, `accessibilityRole`, or `accessibilityHint` props were observed in the codebase.

---

## Section 9 — Backend Audit

### API Server (`artifacts/api-server/src/`)

```
app.ts         Express 5 setup — Pino HTTP logger, CORS, routes
index.ts       Entry point — binds PORT env var
lib/
  logger.ts    Pino singleton logger
routes/
  health.ts    GET /api/healthz
  index.ts     Route aggregator
middlewares/   (empty placeholder directory)
```

**Controllers:** None | **Services:** None | **Business logic:** None
**Database:** Not connected | **Auth middleware:** None | **Rate limiting:** None

### Dead Code / Unused

- `src/middlewares/.gitkeep` — placeholder directory, empty
- TanStack React Query is installed; `QueryClientProvider` wraps the app; **zero `useQuery` or `useMutation` calls exist in any screen**
- `expo-secure-store` is listed as a dependency but explicitly not used for auth sessions (AsyncStorage chosen due to iOS 2 KB limit)

---

## Section 10 — Socket.IO Audit

**Socket.IO is not implemented anywhere in the codebase.** No `socket.io` server or client package. No event definitions.

Live driver location updates are implemented as Supabase row updates (`UPDATE orders SET driver_lat, driver_lng`), which trigger the realtime `postgres_changes` subscription, which causes a full `refreshOrders()` call. This is functional but inefficient at scale (re-fetches all orders on each location ping).

**For production:** A Socket.IO or Supabase Realtime Broadcast channel scoped per-order would be required for smooth live tracking without full refreshes.

---

## Section 11 — Payment Audit

### Paystack Integration

- **Client:** `expo-web-browser` opens Paystack checkout page
- **Public key:** `EXPO_PUBLIC_PAYSTACK_KEY` — if starts with `pk_`, live Paystack; if absent, demo simulation
- **Location:** `components/PaymentModal.tsx`

### Current Payment Flow

```
User taps "Pay" →
  PaymentModal opens →
    If EXPO_PUBLIC_PAYSTACK_KEY present:
      expo-web-browser opens Paystack checkout →
        User pays on Paystack web page →
          Browser closes →
            App calls markOrderPaid(orderId, reference) →
              Supabase order updated (status=PAID, paystack_ref=reference)
    Else (demo):
      Simulated success after 2 seconds
```

### Critical Payment Gaps

| Gap | Risk Level |
|---|---|
| No Paystack webhook handler | 🔴 Critical — payment reference is never verified server-side |
| No server-side payment verification | 🔴 Critical — anyone can pass a fake reference |
| Subscription payments not synced to Supabase | 🔴 Critical — reinstalling app loses all subscription state |
| No retry / failure recovery UI | 🟡 Medium — abandoned payment sessions leave orders stranded |
| No partial payment tracking | 🟡 Medium — pickup fee and delivery fee are distinct P2P transactions |

### Wallet / Commission

**Not applicable.** Explicitly P2P — no platform wallet, no commission deduction, no payout logic needed.

---

## Section 12 — Inconsistencies & Technical Debt

| Inconsistency | Location | Details |
|---|---|---|
| Subscription prices mismatch | `lib/subscription.ts` vs `replit.md` | Code: ₦10k/₦18k/₦30k · Docs: ₦15k/₦35k/₦70k |
| Subscription columns ignored | Supabase `businesses` table | Columns exist but are never read or written |
| `user_role` AsyncStorage key | `AuthContext` signIn/signUp | Written but never read (role comes from JWT) |
| Dispatcher order filter | `OrdersContext` | `.not("assigned_driver_id", "is", null)` shows ALL dispatched orders to ALL dispatchers |
| Business order filter | `OrdersContext` | Any `BUSINESS` role user sees all orders — scoping relies entirely on RLS correctness |
| TanStack React Query | `app/_layout.tsx` | Installed and mounted but zero usage |
| Hardcoded laundromats list | `constants/laundromats.ts` | Not pulled from Supabase `businesses` table |
| Admin activity log | `(admin)/settings.tsx` | Generated in-memory with hardcoded sample events — not a real audit log |
| BlurView TS errors | All `_layout.tsx` files | Pre-existing TS2786 — type definition version mismatch |
| GestureHandlerRootView TS error | `app/_layout.tsx` | Pre-existing TS2322 |
| MapView / Polyline / Marker TS errors | `OrderMap.native.tsx` | Pre-existing TS2786 — react-native-maps types mismatch |

---

## Section 13 — Deployment Readiness Checklist

| Item | Status |
|---|---|
| Environment variables documented | ✅ |
| Supabase schema in version control | ✅ |
| EAS build configuration documented | ✅ (eas.json instructions in replit.md) |
| API server deployable | ⚠️ Deployable but a stub |
| Paystack webhook handler | ❌ |
| Cross-device push notifications | ❌ |
| Subscription state persistent across reinstalls | ❌ |
| Business isolation (multi-tenant orders) | ❌ |
| KYC backend | ❌ |
| Review / dispute / refund system | ❌ |
| Real admin activity audit log | ❌ |
| Rate limiting on API | ❌ |
| Super Admin passphrase removed from source | ❌ Must be replaced before any public release |
| TypeScript typecheck 0 errors | ❌ 22 pre-existing errors (all type-definition version mismatches, not logic errors) |

---

## Section 14 — Recommended Next Steps (Priority Order)

| Priority | Task |
|---|---|
| P0 | Replace hardcoded Super Admin passphrase with a server-verified token |
| P0 | Implement `POST /api/paystack/webhook` to verify payment references server-side |
| P0 | Sync subscription state to Supabase `businesses` table on plan purchase |
| P1 | Scope dispatcher order visibility to their assigned orders only |
| P1 | Implement business-level order isolation (each business sees only their own orders) |
| P1 | Build business registration form (currently must be manually seeded) |
| P1 | Implement KYC backend — create `kyc_submissions` table and POST endpoint |
| P2 | Implement server-side Expo push notification dispatch |
| P2 | Build review / rating flow (data model + UI) |
| P2 | Build dispute / refund flow |
| P2 | Replace in-memory admin activity log with a real `admin_activity_log` table |
| P3 | Fix TypeScript errors (BlurView, MapView, GestureHandlerRootView type definitions) |
| P3 | Resolve subscription price inconsistency (code vs docs) |
| P3 | Add `updated_at` trigger to `profiles` table |
| P3 | Add `role` index to `profiles` for admin query performance |
| P3 | Implement Socket.IO or Supabase Broadcast for live driver tracking |

---

*End of engineering handover audit. This document reflects the state of the codebase as of July 11, 2026. Incoming engineers should treat the Supabase schema, AuthContext, and OrdersContext as the most stable and well-implemented portions of the system. The API server, subscription persistence, and all missing flows represent the highest-priority engineering work required before a production launch.*
