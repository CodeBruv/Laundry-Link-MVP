# LaundryLink — Version 1.0 Launch Backlog

**Target:** Production deployment powering **PurePress Laundry** operations  
**Scope:** Single-business operational backbone — NOT a public SaaS launch  
**Basis:** Engineering Handover Audit + Developer Knowledge Transfer Document  
**Instructions:** This is an engineering backlog only. No code is generated here.

---

## Table of Contents

1. [Epic 1 — Authentication](#epic-1--authentication)
2. [Epic 2 — Customer Experience](#epic-2--customer-experience)
3. [Epic 3 — Orders](#epic-3--orders)
4. [Epic 4 — Dispatch](#epic-4--dispatch)
5. [Epic 5 — Laundry Operations (Business)](#epic-5--laundry-operations-business)
6. [Epic 6 — Payments](#epic-6--payments)
7. [Epic 7 — Notifications](#epic-7--notifications)
8. [Epic 8 — Administration](#epic-8--administration)
9. [Epic 9 — Security](#epic-9--security)
10. [Epic 10 — Production Configuration](#epic-10--production-configuration)
11. [Epic 11 — Data Migration & Cleanup](#epic-11--data-migration--cleanup)
12. [Epic 12 — Infrastructure](#epic-12--infrastructure)
13. [Epic 13 — Testing](#epic-13--testing)
14. [Epic 14 — Deployment](#epic-14--deployment)
15. [Blockers](#blockers)
16. [Final Summary](#final-summary)

---

## Epic 1 — Authentication

---

### TASK-AUTH-01 · Seed PurePress Laundry Business Record in Supabase

**Purpose:**  
The Supabase `businesses` table currently has only one seeded row (`cleanpro-abuja`). Before any PurePress staff can be linked to a business, a proper PurePress Laundry record must exist with the correct ID matching `DEFAULT_BUSINESS_ID` in the app, or `DEFAULT_BUSINESS_ID` must be changed to match the PurePress row.

**Current Status:** Missing  
**Priority:** Critical  
**Launch Critical:** Yes  
**Dependencies:** None  
**Acceptance Criteria:**
- A row exists in `businesses` for PurePress Laundry with a stable `id` value
- `DEFAULT_BUSINESS_ID` in `constants/services.ts` matches that `id`
- `DEFAULT_BUSINESS_NAME` matches the business display name
- `is_verified = true` for the PurePress row

**Estimated Complexity:** Small  
**Suggested Implementation Order:** 1st — blocks all other business-specific tasks

---

### TASK-AUTH-02 · Create Real PurePress Staff Accounts

**Purpose:**  
PurePress Laundry staff (business role) need real Supabase user accounts linked to the PurePress business record. Currently there are no real BUSINESS-role users in the system.

**Current Status:** Missing  
**Priority:** Critical  
**Launch Critical:** Yes  
**Dependencies:** TASK-AUTH-01  
**Acceptance Criteria:**
- At least one real BUSINESS-role user account exists in Supabase auth
- That user's `user_metadata.role = "BUSINESS"`
- Corresponding `profiles` row exists
- User can log in and reach the `/(business)` tab group

**Estimated Complexity:** Small  
**Suggested Implementation Order:** 2nd

---

### TASK-AUTH-03 · Create Real Dispatcher Accounts

**Purpose:**  
All dispatchers used by PurePress must have real Supabase user accounts with `role = "DISPATCHER"`. The current `DISPATCHERS` hardcoded array in `constants/services.ts` uses fake UUIDs that don't correspond to any real users — dispatcher assignment is completely broken in production.

**Current Status:** Missing  
**Priority:** Critical  
**Launch Critical:** Yes  
**Dependencies:** TASK-AUTH-01  
**Acceptance Criteria:**
- All PurePress dispatchers have Supabase accounts with `role = "DISPATCHER"`
- Each dispatcher can log in and see the `/(dispatcher)` tab group
- The hardcoded `DISPATCHERS` constant is replaced with a dynamic Supabase query
- When a business assigns a dispatcher, a real `auth.uid()` is written to `orders.assigned_driver_id`
- Assigned dispatcher sees the order in their Deliveries tab

**Estimated Complexity:** Medium  
**Suggested Implementation Order:** 3rd

---

### TASK-AUTH-04 · Remove Redundant `user_role` AsyncStorage Write

**Purpose:**  
`AuthContext.tsx` writes `user_role` to AsyncStorage on every login/signup. This value is never read — role always comes from the JWT. Dead state in AsyncStorage creates confusion and potential bugs.

**Current Status:** Needs Refactor  
**Priority:** Low  
**Launch Critical:** No  
**Dependencies:** None  
**Acceptance Criteria:**
- The `AsyncStorage.setItem("user_role", ...)` call is removed
- No other code reads `user_role` from AsyncStorage
- Auth flow is unaffected

**Estimated Complexity:** Small  
**Suggested Implementation Order:** Post-launch cleanup

---

### TASK-AUTH-05 · Add Forgot Password / Password Reset Flow

**Purpose:**  
Currently there is no password reset mechanism. If a PurePress staff member or customer forgets their password, they are locked out permanently.

**Current Status:** Missing  
**Priority:** High  
**Launch Critical:** Yes (for production support)  
**Dependencies:** Email provider configured (see TASK-CONFIG-05)  
**Acceptance Criteria:**
- "Forgot Password" link visible on `(auth)/login.tsx`
- Tapping it triggers `supabase.auth.resetPasswordForEmail(email)`
- User receives a reset email from Supabase
- Deep link returns user to a password reset screen in the app
- New password is saved and user can log in

**Estimated Complexity:** Medium  
**Suggested Implementation Order:** Sprint 2

---

## Epic 2 — Customer Experience

---

### TASK-CX-01 · Replace Hardcoded Laundromats List with PurePress Configuration

**Purpose:**  
`constants/laundromats.ts` contains 7 hardcoded fictional businesses across 3 cities. Customers in the order creation wizard see "FreshClean Laundry", "CleanPro Laundry", "Island Wash", etc. — none of which are PurePress. For V1.0, the order creation flow must show only PurePress Laundry.

**Current Status:** Needs Refactor  
**Priority:** Critical  
**Launch Critical:** Yes  
**Dependencies:** TASK-AUTH-01  
**Acceptance Criteria:**
- Only PurePress Laundry appears in the laundromat picker during order creation
- The PurePress bank account details (bankName, accountNumber, accountName) are correct and real
- The PurePress pickup fee and delivery fee match actual business pricing
- The PurePress service list matches the real services offered

**Estimated Complexity:** Small  
**Suggested Implementation Order:** 4th

---

### TASK-CX-02 · Update Default Services List to Match PurePress Pricing

**Purpose:**  
`constants/services.ts` has services priced for "FreshClean Laundry Jos". These must match PurePress Laundry's actual pricing before orders can be created with correct totals.

**Current Status:** Needs Refactor  
**Priority:** Critical  
**Launch Critical:** Yes  
**Dependencies:** TASK-CX-01  
**Acceptance Criteria:**
- `LAUNDRY_SERVICES` array reflects PurePress's real service names and prices
- Order totals calculated from these services are accurate
- No fictional service names appear to customers

**Estimated Complexity:** Small  
**Suggested Implementation Order:** 5th

---

### TASK-CX-03 · Fix Order Number Collision Risk

**Purpose:**  
Order numbers are generated as `LL-{last 6 digits of Date.now()}`. Two orders created within 1 millisecond would get the same order number. Supabase has a UNIQUE constraint which would produce an unhandled error. This is unlikely but catastrophic when it happens.

**Current Status:** Partial  
**Priority:** High  
**Launch Critical:** Yes  
**Dependencies:** None  
**Acceptance Criteria:**
- Order number generation uses a strategy that avoids collision (e.g., UUID prefix + timestamp, or a Supabase sequence)
- If a collision does occur, `createOrder` returns a meaningful error rather than crashing
- Order numbers remain human-readable for customer reference

**Estimated Complexity:** Small  
**Suggested Implementation Order:** Sprint 1

---

### TASK-CX-04 · Persist Saved Addresses to Supabase

**Purpose:**  
Saved addresses are stored in AsyncStorage only. Customers who reinstall the app lose all saved addresses. For a production service, addresses must persist across devices and reinstalls.

**Current Status:** Partial  
**Priority:** Medium  
**Launch Critical:** No (AsyncStorage works for V1.0 if customers are patient)  
**Dependencies:** TASK-DB-01 (saved_addresses table)  
**Acceptance Criteria:**
- `saved_addresses` table created in Supabase
- Address CRUD operations read/write to Supabase
- Existing AsyncStorage addresses are migrated on first post-update launch
- Addresses survive app reinstall

**Estimated Complexity:** Medium  
**Suggested Implementation Order:** Sprint 3

---

### TASK-CX-05 · Add Order Cancellation UI for Customers

**Purpose:**  
The `CANCELLED` status exists in the order state machine and in the database CHECK constraint, but there is no UI element allowing a customer to cancel a PENDING order. Customers who placed orders by mistake have no self-service option.

**Current Status:** Partial  
**Priority:** High  
**Launch Critical:** Yes  
**Dependencies:** None  
**Acceptance Criteria:**
- Customers can cancel orders that are in `PENDING` status from `order/[id].tsx`
- Cancellation is not available once the order moves past `PENDING`
- A confirmation prompt is shown before cancellation
- Cancellation records a history entry with `status = "CANCELLED"`
- Business is notified that the order was cancelled

**Estimated Complexity:** Small  
**Suggested Implementation Order:** Sprint 2

---

## Epic 3 — Orders

---

### TASK-ORD-01 · Fix Business Order Isolation for Multi-Staff Scenario

**Purpose:**  
The Supabase RLS policy for BUSINESS users allows any business-role user to read all orders from all businesses. For V1.0 (single business), this is not catastrophic — there's only one business. However, once a second business is added (or when testing), all orders from all businesses are visible. The fix is still important for production correctness.

**Current Status:** Partial  
**Priority:** High  
**Launch Critical:** No (single-business V1.0 masks this)  
**Dependencies:** TASK-AUTH-01  
**Acceptance Criteria:**
- Business users see only orders where `business_id` matches their linked business record
- The Supabase RLS policy filters by `business_id = (SELECT id FROM businesses WHERE user_id = auth.uid())`
- Admin users still see all orders

**Estimated Complexity:** Medium  
**Suggested Implementation Order:** Sprint 2

---

### TASK-ORD-02 · Add Business ID Foreign Key Constraint (or Validation)

**Purpose:**  
`orders.business_id` has no foreign key constraint (deliberately dropped). Orders can be created with any string as `business_id`. For V1.0, all orders should reference the PurePress business ID. Client-side validation should enforce this.

**Current Status:** Partial  
**Priority:** Medium  
**Launch Critical:** No  
**Dependencies:** TASK-AUTH-01  
**Acceptance Criteria:**
- Order creation validates that `businessId` is a known business ID before submitting
- Invalid business IDs are rejected with a clear error message
- Optionally: re-add FK constraint to the database if the data integrity concern is accepted

**Estimated Complexity:** Small  
**Suggested Implementation Order:** Sprint 2

---

### TASK-ORD-03 · Implement Status Transition Enforcement

**Purpose:**  
The order status machine (PENDING → ACCEPTED → … → DELIVERED) is only enforced in the UI (buttons shown/hidden per status). Any client with Supabase access could set any status. For production integrity, transitions should be validated.

**Current Status:** Partial  
**Priority:** Medium  
**Launch Critical:** No (acceptable for single-business internal tool)  
**Dependencies:** TASK-API-01  
**Acceptance Criteria:**
- `PATCH /api/orders/:id/status` endpoint validates that the requested transition is legal
- Illegal transitions (e.g., DELIVERED → PENDING) return 422
- The mobile client calls this endpoint instead of direct Supabase update

**Estimated Complexity:** Large  
**Suggested Implementation Order:** Sprint 4

---

### TASK-ORD-04 · Improve Offline Queue Error Handling

**Purpose:**  
Queued orders are silently discarded after 3 failed attempts. There is no user-visible feedback that their offline order was lost. A customer in a low-connectivity area could think their order was placed when it wasn't.

**Current Status:** Partial  
**Priority:** High  
**Launch Critical:** Yes  
**Dependencies:** None  
**Acceptance Criteria:**
- When a queued order is discarded (3 failed attempts), the user is shown a notification or in-app alert
- The discarded order details are available so the customer can resubmit manually
- Alternatively: move failed items to a "retry manually" list instead of discarding

**Estimated Complexity:** Medium  
**Suggested Implementation Order:** Sprint 2

---

### TASK-ORD-05 · Realtime Efficiency — Scoped Subscription Instead of Full Refresh

**Purpose:**  
The Supabase realtime channel listens to ALL changes on the `orders` table and calls `refreshOrders()` (a full re-fetch of all orders) on any event. At scale or with multiple concurrent users, this is inefficient and may cause rate limiting. The subscription should filter to only relevant order IDs.

**Current Status:** Partial  
**Priority:** Medium  
**Launch Critical:** No  
**Dependencies:** None  
**Acceptance Criteria:**
- Realtime subscription filters to orders relevant to the current user's role/ID
- Or: individual updates are applied to in-memory state without a full re-fetch

**Estimated Complexity:** Medium  
**Suggested Implementation Order:** Sprint 3

---

## Epic 4 — Dispatch

---

### TASK-DISP-01 · Replace Hardcoded Dispatcher Array with Real Supabase Query

**Purpose:**  
This is the single most broken feature in the entire app. `constants/services.ts` exports `DISPATCHERS` with three fake UUIDs. When a business assigns one of these, the `assigned_driver_id` in Supabase is set to a UUID that belongs to no real user. Real dispatcher users will never see those orders.

**Current Status:** Missing  
**Priority:** Critical  
**Launch Critical:** Yes  
**Dependencies:** TASK-AUTH-03  
**Acceptance Criteria:**
- The `DISPATCHERS` constant is removed or deprecated
- Business order management screen fetches real dispatcher users from Supabase (`role = "DISPATCHER"`)
- The dropdown shows real dispatcher names from their `profiles` rows
- `assignDispatcher()` writes the real dispatcher's `auth.uid()` to `assigned_driver_id`
- The assigned dispatcher immediately sees the order in their Deliveries tab

**Estimated Complexity:** Medium  
**Suggested Implementation Order:** Immediately after TASK-AUTH-03

---

### TASK-DISP-02 · Scope Dispatcher Order Visibility to Assigned-Only

**Purpose:**  
`OrdersContext` filters dispatcher orders with `.not("assigned_driver_id", "is", null)` — this returns ALL orders that have ANY dispatcher assigned, showing every business's assigned orders to every dispatcher simultaneously. Each dispatcher should only see orders assigned specifically to them.

**Current Status:** Partial  
**Priority:** Critical  
**Launch Critical:** Yes  
**Dependencies:** TASK-DISP-01  
**Acceptance Criteria:**
- Dispatcher Supabase query filters to `assigned_driver_id = auth.uid()`
- Dispatchers only see their own assigned orders
- RLS policy enforces the same rule server-side

**Estimated Complexity:** Small  
**Suggested Implementation Order:** Immediately after TASK-DISP-01

---

### TASK-DISP-03 · Build KYC Backend

**Purpose:**  
`(dispatcher)/kyc.tsx` is a placeholder UI. Submitting it discards all data. For a production operation, dispatcher identity verification is required both for liability and for operational trust.

**Current Status:** Missing  
**Priority:** High  
**Launch Critical:** Yes (for dispatcher onboarding)  
**Dependencies:** TASK-DB-02 (kyc_submissions table), TASK-API-01  
**Acceptance Criteria:**
- `kyc_submissions` table created in Supabase
- `POST /api/kyc/submit` endpoint accepts NIN, BVN, guarantor data
- Data is stored associated with the dispatcher's `auth.uid()`
- KYC submission status (PENDING, VERIFIED, REJECTED) visible to dispatcher
- Admin can view and update KYC status

**Estimated Complexity:** Large  
**Suggested Implementation Order:** Sprint 2

---

### TASK-DISP-04 · Implement Continuous GPS Location Sharing

**Purpose:**  
Driver location is updated only when the dispatcher manually triggers it. For real delivery tracking, location should update continuously while the dispatcher is on a delivery.

**Current Status:** Missing  
**Priority:** High  
**Launch Critical:** Yes (customers need live tracking)  
**Dependencies:** None (expo-location is available)  
**Acceptance Criteria:**
- Dispatcher taps "Start Delivery" → location sharing begins automatically
- `expo-location.watchPositionAsync()` updates `orders.driver_lat/driver_lng` every N seconds
- Location sharing stops when order is marked DELIVERED or sharing is manually ended
- Battery/performance: use appropriate accuracy level for delivery context

**Estimated Complexity:** Medium  
**Suggested Implementation Order:** Sprint 2

---

### TASK-DISP-05 · Show Dispatcher Status in Business Order View

**Purpose:**  
When a business assigns a dispatcher, the order management screen shows the dispatcher name but not their current status (en route, nearby, etc.). For operational clarity, at minimum the dispatcher's location relative to the business should be visible.

**Current Status:** Missing  
**Priority:** Medium  
**Launch Critical:** No  
**Dependencies:** TASK-DISP-04  
**Acceptance Criteria:**
- Business order detail shows dispatcher location on the map when sharing is active
- Business can see "Dispatcher is X km away" or similar indicator

**Estimated Complexity:** Medium  
**Suggested Implementation Order:** Sprint 3

---

## Epic 5 — Laundry Operations (Business)

---

### TASK-BIZ-01 · Build Business Profile Creation / Edit Form

**Purpose:**  
There is currently no in-app flow for a business to create or edit their profile. `(business)/profile.tsx` is read-only display. Business records must be manually seeded in Supabase. For PurePress, a one-time setup form is needed, and the profile must be editable by staff.

**Current Status:** Partial  
**Priority:** High  
**Launch Critical:** Yes  
**Dependencies:** TASK-AUTH-01  
**Acceptance Criteria:**
- PurePress staff can edit business name, address, phone, description from `(business)/profile.tsx`
- Changes are persisted to the Supabase `businesses` table
- Bank account details for payment collection are editable by staff

**Estimated Complexity:** Medium  
**Suggested Implementation Order:** Sprint 2

---

### TASK-BIZ-02 · Persist Custom Service Pricing to Supabase

**Purpose:**  
Business-configured custom service pricing is stored in AsyncStorage only. This means pricing is device-specific — changing prices on one staff member's phone does not update prices seen by other staff or customers.

**Current Status:** Partial  
**Priority:** High  
**Launch Critical:** Yes  
**Dependencies:** TASK-DB-03 (service_pricing table), TASK-AUTH-01  
**Acceptance Criteria:**
- `service_pricing` table created in Supabase
- Business service pricing reads from and writes to Supabase
- All staff devices see the same prices
- Customer order creation shows Supabase-sourced pricing, not the hardcoded constant

**Estimated Complexity:** Medium  
**Suggested Implementation Order:** Sprint 2

---

### TASK-BIZ-03 · Add CSV / Report Export to Business Analytics

**Purpose:**  
`(business)/reports.tsx` shows revenue and order breakdowns but has no export. For accounting and operational management, PurePress staff need to export order data.

**Current Status:** Missing  
**Priority:** Medium  
**Launch Critical:** No  
**Dependencies:** None  
**Acceptance Criteria:**
- Business analytics screen has a "Export CSV" button
- Exported CSV includes: order number, date, services, total, status, customer name
- File is saved to device storage or shared via share sheet

**Estimated Complexity:** Medium  
**Suggested Implementation Order:** Sprint 3

---

### TASK-BIZ-04 · Simplify or Remove Subscription Paywall for PurePress V1.0

**Purpose:**  
For V1.0, PurePress is the only business. There is no "subscription" for a single internal operator — the paywall in `(business)/index.tsx` is irrelevant and blocks staff from accessing the dashboard in a fresh install.

Two paths exist:
- **Option A:** Seed an active Enterprise subscription for PurePress in Supabase (once that column is used)
- **Option B:** Give admin the ability to grant a business permanent access without a subscription payment

**Current Status:** Partial  
**Priority:** Critical  
**Launch Critical:** Yes  
**Dependencies:** TASK-PAY-03 (or workaround: hardcode PurePress as subscribed)  
**Acceptance Criteria:**
- PurePress staff land on the dashboard without seeing a subscription paywall
- The trial/subscribe flow is either bypassed for PurePress or auto-populated

**Estimated Complexity:** Small  
**Suggested Implementation Order:** Sprint 1 (workaround first, proper fix in Sprint 3)

---

## Epic 6 — Payments

---

### TASK-PAY-01 · Implement Paystack Webhook Handler

**Purpose:**  
This is the most critical missing backend feature. Currently, payment confirmation is entirely manual — a customer taps "I've completed the transfer" and a fake reference is stored. There is no verification that money was actually sent. In production, this means orders can be marked as paid without payment.

**Current Status:** Missing  
**Priority:** Critical  
**Launch Critical:** Yes  
**Dependencies:** TASK-API-01, Paystack Live Keys (TASK-CONFIG-01)  
**Acceptance Criteria:**
- `POST /api/paystack/webhook` endpoint exists in the API server
- Endpoint verifies Paystack HMAC signature using `PAYSTACK_SECRET_KEY`
- On `charge.success` event: updates `orders.status = "PAID"` and `paystack_ref` in Supabase
- On `subscription.create` event: updates `businesses` subscription columns in Supabase
- Invalid signatures return 401 and are logged
- Webhook URL is registered in the Paystack dashboard

**Estimated Complexity:** Large  
**Suggested Implementation Order:** Sprint 1 (highest priority backend task)

---

### TASK-PAY-02 · Implement Real Paystack Card Checkout for Order Payment

**Purpose:**  
`PaymentModal.tsx` currently shows a bank transfer UI that generates a fake reference. For a professional customer experience, a real Paystack inline checkout or deep link to Paystack should be used for card payments, while bank transfer remains as an alternative.

**Current Status:** Missing  
**Priority:** Critical  
**Launch Critical:** Yes  
**Dependencies:** TASK-PAY-01, TASK-CONFIG-01  
**Acceptance Criteria:**
- Customer taps "Pay by Card" → real Paystack checkout opens via `expo-web-browser`
- Paystack checkout is initialized with the correct amount and customer email
- On return to app: webhook confirms payment (not client-side callback)
- Bank transfer remains available as an alternative (with honest instructions that it is not auto-verified)
- The fake `makeRef()` function is no longer used for card payments

**Estimated Complexity:** Large  
**Suggested Implementation Order:** Sprint 2 (after webhook is live)

---

### TASK-PAY-03 · Sync Subscription State to Supabase

**Purpose:**  
Subscription state is stored in AsyncStorage only. Reinstalling the app, getting a new device, or having a second staff member on the same business account all result in lost subscription state. For a real business, this is critical data that must live in the database.

**Current Status:** Missing  
**Priority:** Critical  
**Launch Critical:** Yes  
**Dependencies:** TASK-PAY-01  
**Acceptance Criteria:**
- After a successful Paystack payment for a subscription, the Paystack webhook writes to `businesses.subscription_tier`, `subscription_active`, `subscription_expires_at`
- `SubscriptionContext` reads subscription state from Supabase, not AsyncStorage
- Subscription survives reinstall and is accessible on multiple devices
- AsyncStorage subscription is used only as a cache with Supabase as source of truth

**Estimated Complexity:** Large  
**Suggested Implementation Order:** Sprint 2

---

### TASK-PAY-04 · Add Payment Retry / Failure Recovery

**Purpose:**  
There is no UI for a failed or abandoned Paystack payment session. If a customer opens the checkout but closes it (abandons), the order remains in READY status with no clear path to retry payment.

**Current Status:** Missing  
**Priority:** Medium  
**Launch Critical:** No (workaround: customers can try again manually)  
**Dependencies:** TASK-PAY-02  
**Acceptance Criteria:**
- Order detail screen shows a "Retry Payment" button when status is READY and payment has been attempted but not confirmed
- Abandoned payment sessions do not corrupt order state

**Estimated Complexity:** Small  
**Suggested Implementation Order:** Sprint 3

---

### TASK-PAY-05 · Add Partial Payment Tracking (Pickup Fee)

**Purpose:**  
The P2P payment model has two distinct payments: a pickup fee (customer pays dispatcher at pickup) and a service + delivery fee (customer pays after laundry is done). Currently only the service/delivery payment is tracked. The pickup fee is lost.

**Current Status:** Missing  
**Priority:** Low  
**Launch Critical:** No  
**Dependencies:** None  
**Acceptance Criteria:**
- Order model has `pickup_fee_paid: boolean` field
- Dispatcher can confirm pickup fee received
- Both payments are visible in order history

**Estimated Complexity:** Medium  
**Suggested Implementation Order:** Version 1.1

---

## Epic 7 — Notifications

---

### TASK-NOTIF-01 · Implement Server-Side Expo Push Notification Dispatch

**Purpose:**  
All notifications currently fire on the device that triggers the action. A business accepting a customer's order fires "New Order Received" on the business's own phone, not the customer's. Cross-device notification delivery requires an API server endpoint that reads push tokens from Supabase and calls the Expo Push API.

**Current Status:** Missing  
**Priority:** Critical  
**Launch Critical:** Yes  
**Dependencies:** TASK-API-01, `push_tokens` table (exists)  
**Acceptance Criteria:**
- `POST /api/push/send` endpoint accepts `{ userId, title, body, data }`
- Endpoint looks up all push tokens for the given `userId` from `push_tokens` table
- Sends via Expo Push API (`https://exp.host/--/api/v2/push/send`)
- Handles Expo push receipts and removes expired/invalid tokens
- Called by `OrdersContext` functions on relevant status transitions:
  - Business accepts order → notify customer
  - Order ready → notify customer
  - Dispatcher assigned → notify customer
  - Payment confirmed → notify business

**Estimated Complexity:** Large  
**Suggested Implementation Order:** Sprint 2

---

### TASK-NOTIF-02 · Add `orderId` to Notification Payloads for Deep Links

**Purpose:**  
The `useNotifications` hook has a `addNotificationResponseReceivedListener` that checks `data.orderId` to deep-link to the order detail screen. However, none of the `sendLocalNotification` calls in `lib/notifications.ts` include `orderId` in the data payload. Deep links from notification taps never fire.

**Current Status:** Partial  
**Priority:** High  
**Launch Critical:** Yes  
**Dependencies:** TASK-NOTIF-01  
**Acceptance Criteria:**
- All order-related notification helpers pass `{ orderId, type }` in the `data` parameter
- Tapping a notification on iOS/Android navigates directly to `/order/{orderId}`
- Deep link works for both local and server-sent push notifications

**Estimated Complexity:** Small  
**Suggested Implementation Order:** Sprint 2 (after TASK-NOTIF-01)

---

### TASK-NOTIF-03 · Persist Notification Inbox to Supabase

**Purpose:**  
`(customer)/notifications-screen.tsx` shows a local device notification list. Notifications are device-local only and disappear on reinstall. For a production service, notification history should persist.

**Current Status:** Missing  
**Priority:** Low  
**Launch Critical:** No  
**Dependencies:** TASK-DB-04 (notifications table)  
**Acceptance Criteria:**
- `notifications` table in Supabase stores per-user notification records
- Notification inbox screen reads from Supabase
- Unread count persists across devices
- Notifications older than 30 days are auto-purged

**Estimated Complexity:** Medium  
**Suggested Implementation Order:** Version 1.1

---

## Epic 8 — Administration

---

### TASK-ADMIN-01 · Build Real Admin Activity Log

**Purpose:**  
`(admin)/settings.tsx` shows a simulated activity log with hardcoded sample events generated in-memory. For production, admin actions must be logged to an actual database table for accountability and debugging.

**Current Status:** Missing  
**Priority:** High  
**Launch Critical:** Yes (for operational accountability)  
**Dependencies:** TASK-DB-05 (admin_activity_log table), TASK-API-01  
**Acceptance Criteria:**
- `admin_activity_log` table created in Supabase
- Key admin actions are logged: user suspension, business modification, order override, passphrase use
- The admin settings screen reads from this table
- Log cannot be edited or deleted by any app role

**Estimated Complexity:** Medium  
**Suggested Implementation Order:** Sprint 3

---

### TASK-ADMIN-02 · Make Admin User Management Functional

**Purpose:**  
`(admin)/users.tsx` has UI for suspending, deleting, and adding users — but these actions have no backend. Tapping "Suspend" produces no real effect.

**Current Status:** Partial  
**Priority:** High  
**Launch Critical:** Yes  
**Dependencies:** TASK-API-01  
**Acceptance Criteria:**
- Admin can disable a user via Supabase Admin API (via the Express server, not directly from client)
- Admin can delete a user (with confirmation)
- Suspended users cannot log in
- User management actions are logged to `admin_activity_log`

**Estimated Complexity:** Large  
**Suggested Implementation Order:** Sprint 3

---

### TASK-ADMIN-03 · Admin Order Override (Force Status Change)

**Purpose:**  
Admin needs the ability to override an order's status in case of disputes, errors, or abandoned orders. Currently admin sees all orders but cannot update them through any admin-specific path.

**Current Status:** Missing  
**Priority:** Medium  
**Launch Critical:** Yes  
**Dependencies:** None  
**Acceptance Criteria:**
- Admin can change any order to any status from `(admin)/orders.tsx`
- Override is logged in `order_status_history` with note "Admin override"
- Override is logged in `admin_activity_log`

**Estimated Complexity:** Medium  
**Suggested Implementation Order:** Sprint 3

---

## Epic 9 — Security

---

### TASK-SEC-01 · Remove Hardcoded Super Admin Passphrase

**Purpose:**  
`"MAFIA CODE BRUV"` is hardcoded in `hooks/useAdminAccess.ts`. It is visible to anyone with source code access. In a production app with real users and payment data, this is an unacceptable security vulnerability.

**Current Status:** Missing  
**Priority:** Critical  
**Launch Critical:** Yes  
**Dependencies:** TASK-API-01  
**Acceptance Criteria:**
- The hardcoded passphrase is removed from source code
- Super admin elevation is either:
  - Handled entirely via Supabase dashboard (`user_metadata.admin_tier = "SUPER"`)
  - Or: the passphrase is stored in a server-side environment variable and verified via `POST /api/admin/verify-passphrase` endpoint
- No passphrase appears in the app source code or version control

**Estimated Complexity:** Medium  
**Suggested Implementation Order:** Sprint 1 (before production)

---

### TASK-SEC-02 · Add Auth Middleware to Express API Server

**Purpose:**  
The API server has no authentication. Any HTTP client can call any endpoint. In production, all API endpoints (except `/healthz`) must verify the caller's Supabase JWT before processing the request.

**Current Status:** Missing  
**Priority:** Critical  
**Launch Critical:** Yes  
**Dependencies:** TASK-API-01  
**Acceptance Criteria:**
- `middlewares/auth.ts` validates Supabase JWTs using the Supabase JWT secret
- All protected routes use this middleware
- `/healthz` remains public
- Unauthenticated requests receive 401
- Middleware makes `req.user` available to handlers

**Estimated Complexity:** Medium  
**Suggested Implementation Order:** Sprint 1 (before any endpoint handles real data)

---

### TASK-SEC-03 · Add Rate Limiting to API Server

**Purpose:**  
Without rate limiting, the API server is vulnerable to brute-force, DoS, and abuse. The Paystack webhook endpoint in particular must be protected (though it uses HMAC verification as the primary guard).

**Current Status:** Missing  
**Priority:** High  
**Launch Critical:** Yes  
**Dependencies:** TASK-API-01  
**Acceptance Criteria:**
- Rate limiting applied globally (e.g., 100 requests per IP per minute)
- More restrictive rate limit on auth endpoints
- Paystack webhook endpoint whitelisted from IP-based rate limiting (uses HMAC instead)
- Rate limit errors return 429

**Estimated Complexity:** Small  
**Suggested Implementation Order:** Sprint 2

---

### TASK-SEC-04 · Audit and Tighten Supabase RLS Policies

**Purpose:**  
Current RLS policies have gaps: businesses see all orders, history JOINs may fail due to dropped FK, authenticated users can insert history rows without role restriction. For production, policies must be tightened.

**Current Status:** Partial  
**Priority:** High  
**Launch Critical:** Yes  
**Dependencies:** TASK-AUTH-01  
**Acceptance Criteria:**
- Business read policy on `orders` is scoped to orders belonging to that business
- `order_status_history` insert is restricted to the order's customer, business, or dispatcher
- All policies are tested with at least one real user per role
- RLS is enabled on all tables (confirm no tables have RLS disabled)

**Estimated Complexity:** Medium  
**Suggested Implementation Order:** Sprint 2

---

### TASK-SEC-05 · Server-Side Validation for Order Creation

**Purpose:**  
The entire order creation flow is client-side. A malicious or buggy client could create orders with invalid amounts, nonexistent business IDs, or incorrect totals. The API server should validate order creation inputs.

**Current Status:** Missing  
**Priority:** Medium  
**Launch Critical:** No (RLS provides some protection)  
**Dependencies:** TASK-API-01  
**Acceptance Criteria:**
- `POST /api/orders` endpoint validates: businessId exists, items are real services, totalAmount matches sum of items, deliveryFee is correct
- Invalid orders are rejected with descriptive error
- Valid orders are inserted by the server (server-side Supabase service key), not by the client anon key

**Estimated Complexity:** Large  
**Suggested Implementation Order:** Sprint 4

---

## Epic 10 — Production Configuration

---

### TASK-CONFIG-01 · Set Paystack Live Keys

**Purpose:**  
`EXPO_PUBLIC_PAYSTACK_KEY` must be a live `pk_live_...` key before any real payments can be processed. Currently missing or using test keys.

**Current Status:** Missing  
**Priority:** Critical  
**Launch Critical:** Yes  
**Dependencies:** Paystack merchant account for PurePress  
**Acceptance Criteria:**
- `EXPO_PUBLIC_PAYSTACK_KEY` is set to the PurePress Paystack live public key
- `PAYSTACK_SECRET_KEY` (server-side, not public) is set in the API server environment
- Test keys are never committed to source control
- Paystack webhook URL is registered pointing to the production API server

**Estimated Complexity:** Small  
**Suggested Implementation Order:** Sprint 1

---

### TASK-CONFIG-02 · Set Production Supabase Keys

**Purpose:**  
The app must point to a production Supabase project (not a dev project) with the PurePress data.

**Current Status:** Missing  
**Priority:** Critical  
**Launch Critical:** Yes  
**Dependencies:** Supabase production project created  
**Acceptance Criteria:**
- `EXPO_PUBLIC_SUPABASE_URL` points to the production Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` is the production anon key
- The Supabase service role key is available server-side for the API server (never in client code)
- RLS policies are enabled on the production project
- Schema has been applied to the production Supabase project

**Estimated Complexity:** Small  
**Suggested Implementation Order:** Sprint 1

---

### TASK-CONFIG-03 · Configure Expo EAS Build for Production

**Purpose:**  
EAS build configuration (`eas.json`) must be set up correctly for Android APK/AAB and iOS IPA production builds.

**Current Status:** Missing  
**Priority:** Critical  
**Launch Critical:** Yes  
**Dependencies:** Expo account, Apple Developer / Google Play accounts  
**Acceptance Criteria:**
- `eas.json` exists with `preview` (APK) and `production` (AAB/IPA) profiles
- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_PAYSTACK_KEY` are set as EAS secrets
- Production APK builds successfully on EAS
- App launches without crash on a physical Android device

**Estimated Complexity:** Medium  
**Suggested Implementation Order:** Sprint 2

---

### TASK-CONFIG-04 · Set `SESSION_SECRET` for API Server

**Purpose:**  
`SESSION_SECRET` is listed as a required environment variable for the API server. It must be a strong random value in production.

**Current Status:** Missing  
**Priority:** High  
**Launch Critical:** Yes  
**Dependencies:** None  
**Acceptance Criteria:**
- `SESSION_SECRET` is set in the production environment with a cryptographically random value (minimum 32 bytes)
- The value is never committed to source control
- The API server starts cleanly with this variable set

**Estimated Complexity:** Small  
**Suggested Implementation Order:** Sprint 1

---

### TASK-CONFIG-05 · Configure Email Provider for Supabase Auth Emails

**Purpose:**  
Supabase sends transactional emails (signup confirmation, password reset) via its default SMTP. For production, a dedicated email provider (SendGrid, Postmark, Resend) must be configured in the Supabase dashboard to ensure deliverability and branded emails.

**Current Status:** Missing  
**Priority:** High  
**Launch Critical:** Yes  
**Dependencies:** Email provider account  
**Acceptance Criteria:**
- Supabase Auth is configured with a production SMTP provider
- Signup confirmation and password reset emails are branded with LaundryLink / PurePress identity
- Emails do not land in spam folders
- SPF/DKIM records are configured for the sending domain

**Estimated Complexity:** Small  
**Suggested Implementation Order:** Sprint 2

---

### TASK-CONFIG-06 · Configure Push Notification Credentials

**Purpose:**  
Expo push notifications require valid APNs credentials (iOS) and FCM credentials (Android) to send notifications on physical devices. These must be configured in the Expo EAS dashboard.

**Current Status:** Missing  
**Priority:** High  
**Launch Critical:** Yes  
**Dependencies:** Apple Developer account (iOS), Google Play account (Android), TASK-EAS-01  
**Acceptance Criteria:**
- APNs certificate/key configured in EAS for iOS
- FCM server key configured in EAS for Android
- `getExpoPushTokenAsync()` returns a valid token on physical devices
- Test push notification delivered to a physical device

**Estimated Complexity:** Medium  
**Suggested Implementation Order:** Sprint 2

---

### TASK-CONFIG-07 · Configure Production Domain and API URL

**Purpose:**  
The API server must be reachable from the production mobile app on a stable, HTTPS domain. Currently, the app talks directly to Supabase and notifications would call `localhost`.

**Current Status:** Missing  
**Priority:** Critical  
**Launch Critical:** Yes  
**Dependencies:** Domain + hosting for API server  
**Acceptance Criteria:**
- API server is deployed with HTTPS on a production domain (e.g., `api.laundrylink.ng`)
- `EXPO_PUBLIC_API_URL` is set in the app pointing to this domain
- All API calls from the app use this URL
- Paystack webhook URL uses this domain

**Estimated Complexity:** Medium  
**Suggested Implementation Order:** Sprint 2

---

### TASK-CONFIG-08 · Supabase Realtime Enabled for `orders` Table

**Purpose:**  
Supabase Realtime must be explicitly enabled for the `orders` table in the Supabase dashboard. If it was not enabled when the production project was set up, live order updates will not work.

**Current Status:** Unknown  
**Priority:** Critical  
**Launch Critical:** Yes  
**Dependencies:** TASK-CONFIG-02  
**Acceptance Criteria:**
- Supabase dashboard → Database → Replication → `orders` table has realtime enabled
- Order status changes propagate to all connected clients in real time

**Estimated Complexity:** Small  
**Suggested Implementation Order:** Sprint 1

---

## Epic 11 — Data Migration & Cleanup

---

### TASK-DATA-01 · Remove All Hardcoded Fictional Laundromats

**Purpose:**  
`constants/laundromats.ts` lists 7 fictional businesses: "FreshClean Laundry", "Plateau Wash", "Tin City Laundry", "Highland CleanHouse", "CleanPro Laundry", "FreshWash Express", "Island Wash". Customers in V1.0 must only see PurePress Laundry.

**Current Status:** Needs Refactor  
**Priority:** Critical  
**Launch Critical:** Yes  
**Dependencies:** TASK-AUTH-01, TASK-CX-01  
**Acceptance Criteria:**
- `LAUNDROMATS` array contains only PurePress Laundry (or is replaced by a Supabase query)
- `CITIES` and `DEFAULT_CITY` reflect PurePress's actual operating city
- No fictional business names appear anywhere in the customer-facing UI
- `getLaundromatsForCity()` function returns only PurePress for the PurePress city

**Estimated Complexity:** Small  
**Suggested Implementation Order:** Sprint 1

---

### TASK-DATA-02 · Remove / Replace Hardcoded Dispatcher Array

**Purpose:**  
`constants/services.ts` exports `DISPATCHERS` with three fictional names and fake UUIDs. This must be removed before production.

**Current Status:** Needs Refactor  
**Priority:** Critical  
**Launch Critical:** Yes  
**Dependencies:** TASK-DISP-01  
**Acceptance Criteria:**
- `DISPATCHERS` constant is removed from `constants/services.ts`
- All code that imported `DISPATCHERS` now fetches real dispatcher users from Supabase
- No fictional dispatcher names ("Aminu Suleiman", "Daniel Okafor", "Chioma Eze") appear in the app

**Estimated Complexity:** Small  
**Suggested Implementation Order:** Sprint 1

---

### TASK-DATA-03 · Remove or Archive Demo Accounts

**Purpose:**  
Any demo accounts created during development in the Supabase production project (or migrated from dev) must be removed. Demo orders, demo businesses, and placeholder data must be cleared.

**Current Status:** Missing  
**Priority:** Critical  
**Launch Critical:** Yes  
**Dependencies:** TASK-CONFIG-02 (production project must be clean)  
**Acceptance Criteria:**
- Production Supabase has no demo/test user accounts
- All orders with `order_number` matching the test pattern or with `customer_name = "Demo User"` are removed
- The "cleanpro-abuja" seeded business row is removed or updated to be the PurePress row

**Estimated Complexity:** Small  
**Suggested Implementation Order:** Sprint 1

---

### TASK-DATA-04 · Update App Branding from "LaundryLink" to PurePress Identity

**Purpose:**  
The app displays "LaundryLink" in the login screen logo, tagline, and throughout. For V1.0, PurePress Laundry is operating this app. Branding should reflect PurePress while the underlying SaaS architecture remains intact.

**Current Status:** Needs Refactor  
**Priority:** Medium  
**Launch Critical:** No (operational before public-facing)  
**Dependencies:** PurePress brand assets (logo, colors)  
**Acceptance Criteria:**
- Login screen shows PurePress logo/name instead of generic LaundryLink
- App store name (if applicable) reflects PurePress
- Primary color tokens in `constants/colors.ts` match PurePress brand colors
- Tagline reflects PurePress's positioning

**Estimated Complexity:** Medium  
**Suggested Implementation Order:** Sprint 3

---

### TASK-DATA-05 · Fix DEFAULT_BUSINESS_ID / Supabase Seed Mismatch

**Purpose:**  
`DEFAULT_BUSINESS_ID = "freshclean-jos"` in `constants/services.ts` does not match the seeded Supabase business `id = "cleanpro-abuja"`. Orders created with the default will reference a business that doesn't exist in the database. This is a silent data integrity bug.

**Current Status:** Needs Refactor  
**Priority:** Critical  
**Launch Critical:** Yes  
**Dependencies:** TASK-AUTH-01  
**Acceptance Criteria:**
- `DEFAULT_BUSINESS_ID` matches the real PurePress business ID in Supabase
- The mismatch between services.ts and schema.sql is eliminated
- All new orders reference the correct PurePress business ID

**Estimated Complexity:** Small  
**Suggested Implementation Order:** Sprint 1

---

## Epic 12 — Infrastructure

---

### TASK-API-01 · Set Up Core API Server Foundation

**Purpose:**  
The API server currently has one stub route. Before any business logic can be added (webhooks, push notifications, admin operations), the server needs a proper foundation: database connection, auth middleware, error handling, and a deployment target.

**Current Status:** Missing  
**Priority:** Critical  
**Launch Critical:** Yes  
**Dependencies:** TASK-CONFIG-02, TASK-CONFIG-07  
**Acceptance Criteria:**
- API server connects to Supabase via service role key (for admin operations)
- `middlewares/auth.ts` is implemented (see TASK-SEC-02)
- Centralized error handling middleware returns consistent JSON errors
- Health endpoint returns DB connection status
- Server is deployed and reachable at the production API URL

**Estimated Complexity:** Large  
**Suggested Implementation Order:** Sprint 1 (blocks all other backend tasks)

---

### TASK-DB-01 · Create `saved_addresses` Table

**Purpose:**  
Saved addresses need to persist in Supabase, not AsyncStorage.

**Current Status:** Missing  
**Priority:** Medium  
**Launch Critical:** No  
**Dependencies:** None  
**Acceptance Criteria:**
- Table: `saved_addresses(id, user_id, label, address, is_default, created_at)`
- RLS: users can only access their own addresses
- Migration applied to production Supabase

**Estimated Complexity:** Small

---

### TASK-DB-02 · Create `kyc_submissions` Table

**Purpose:**  
KYC data submitted by dispatchers needs to be persisted.

**Current Status:** Missing  
**Priority:** High  
**Launch Critical:** Yes  
**Dependencies:** None  
**Acceptance Criteria:**
- Table: `kyc_submissions(id, dispatcher_id, nin, bvn, guarantor_name, guarantor_phone, status, created_at, reviewed_at, reviewed_by)`
- `status` CHECK: PENDING, VERIFIED, REJECTED
- RLS: dispatcher can read their own; admin can read/update all

**Estimated Complexity:** Small

---

### TASK-DB-03 · Create `service_pricing` Table

**Purpose:**  
Business service pricing must persist in Supabase, not AsyncStorage.

**Current Status:** Missing  
**Priority:** High  
**Launch Critical:** Yes  
**Dependencies:** TASK-AUTH-01  
**Acceptance Criteria:**
- Table: `service_pricing(id, business_id, name, description, price_per_unit, unit, is_active, updated_at)`
- RLS: business owner can CRUD their own pricing; customers/dispatchers can read
- Seed with PurePress pricing on first migration

**Estimated Complexity:** Small

---

### TASK-DB-04 · Create `notifications` Table

**Purpose:**  
Notification inbox must persist server-side.

**Current Status:** Missing  
**Priority:** Low  
**Launch Critical:** No  
**Dependencies:** None  
**Acceptance Criteria:**
- Table: `notifications(id, user_id, title, body, data jsonb, read, created_at)`
- RLS: users access only their own notifications
- Auto-purge rows older than 30 days (pg_cron or trigger)

**Estimated Complexity:** Small

---

### TASK-DB-05 · Create `admin_activity_log` Table

**Purpose:**  
Admin actions must be logged in an append-only table.

**Current Status:** Missing  
**Priority:** High  
**Launch Critical:** Yes  
**Dependencies:** None  
**Acceptance Criteria:**
- Table: `admin_activity_log(id, admin_id, action, target_type, target_id, note, created_at)`
- No UPDATE or DELETE RLS policy — append-only
- Admin screens read from this table

**Estimated Complexity:** Small

---

## Epic 13 — Testing

---

### TASK-TEST-01 · Customer Order Creation Journey

**Purpose:** Verify the complete customer order creation flow works on a real device with production Supabase.

**Current Status:** Untested  
**Priority:** Critical  
**Launch Critical:** Yes  
**Test Steps:**
1. Customer signs up with real email
2. Customer creates an order with PurePress services
3. Order appears in `(customer)/orders.tsx`
4. Order appears in business `(business)/orders.tsx` instantly (realtime)
5. Order number format is correct
6. Total amount matches selected services

---

### TASK-TEST-02 · Business Order Lifecycle Journey

**Purpose:** Verify business can take an order from PENDING to DELIVERED.

**Current Status:** Untested  
**Priority:** Critical  
**Launch Critical:** Yes  
**Test Steps:**
1. Business receives order (realtime notification)
2. Business accepts → ACCEPTED
3. Dispatcher is assigned (real dispatcher user, not fake UUID)
4. Order status progresses: PICKED_UP → IN_PROGRESS → READY
5. Customer receives real push notification at each step

---

### TASK-TEST-03 · Payment Flow End-to-End

**Purpose:** Verify payment from customer reaches PurePress and is confirmed in the app.

**Current Status:** Untested  
**Priority:** Critical  
**Launch Critical:** Yes  
**Test Steps:**
1. Order in READY state
2. Customer opens PaymentModal → initiates Paystack checkout (test mode first)
3. Paystack test payment completes
4. Webhook fires → order status updates to PAID
5. Business receives push notification: "Payment received"
6. Fake `makeRef()` is NOT used

---

### TASK-TEST-04 · Dispatcher Assignment and Delivery Journey

**Purpose:** Verify real dispatcher receives order and completes delivery.

**Current Status:** Untested  
**Priority:** Critical  
**Launch Critical:** Yes  
**Test Steps:**
1. Business assigns a real dispatcher user from the Supabase-sourced dropdown
2. Dispatcher sees the order in their Deliveries tab immediately
3. Dispatcher shares location → customer sees movement on map
4. Dispatcher marks DELIVERED
5. Customer receives push notification

---

### TASK-TEST-05 · Offline Order Creation

**Purpose:** Verify offline queue works correctly.

**Current Status:** Untested  
**Priority:** High  
**Launch Critical:** Yes  
**Test Steps:**
1. Put device in airplane mode
2. Create an order → offline banner appears
3. Queue length is 1 in AsyncStorage
4. Restore connectivity → queue flushes automatically
5. Order appears in Supabase with correct data
6. If queue fails 3 times → user is notified

---

### TASK-TEST-06 · Authentication Edge Cases

**Current Status:** Untested  
**Priority:** High  
**Launch Critical:** Yes  
**Test Cases:**
- Login with wrong password shows error (not crash)
- Login with Supabase unreachable shows warning banner
- Session restored after app kill + reopen
- Logout clears all state and returns to login
- Password reset email received and link works
- ADMIN role correctly redirects to `/(admin)` not `/(customer)`

---

### TASK-TEST-07 · Role Permission Tests

**Current Status:** Untested  
**Priority:** Critical  
**Launch Critical:** Yes  
**Test Cases:**
- Customer cannot access `/(business)` routes (test via `router.push`)
- Business cannot view or modify customer-only data
- Dispatcher only sees their assigned orders (not all dispatched orders)
- Admin can view all roles' data

---

### TASK-TEST-08 · Push Notification Tests

**Current Status:** Untested  
**Priority:** Critical  
**Launch Critical:** Yes  
**Test Cases:**
- Permission prompt appears on first install
- Token is stored in Supabase `push_tokens` table
- Customer receives notification when business accepts their order (cross-device)
- Tapping notification navigates to correct order detail screen
- Notifications work on both iOS and Android physical devices

---

### TASK-TEST-09 · Subscription Paywall Test

**Current Status:** Untested  
**Priority:** High  
**Launch Critical:** Yes  
**Test Cases:**
- Fresh install without subscription shows paywall
- Starting trial bypasses paywall for 7 days
- Expired trial re-shows paywall
- Successful Paystack payment activates subscription in Supabase (once TASK-PAY-03 complete)
- Subscription survives reinstall (once TASK-PAY-03 complete)

---

### TASK-TEST-10 · Security Tests

**Current Status:** Untested  
**Priority:** Critical  
**Launch Critical:** Yes  
**Test Cases:**
- Customer cannot read another customer's orders (RLS test via Supabase API)
- Unauthenticated API call returns 401
- Paystack webhook with invalid signature returns 401
- Super admin passphrase is not in app source (grep test)
- `PAYSTACK_SECRET_KEY` is not in client-side code (grep test)

---

## Epic 14 — Deployment

---

### TASK-DEPLOY-01 · Deploy API Server to Production Host

**Purpose:**  
The Express API server must be hosted on a stable HTTPS server. It cannot run on the Replit development environment for production use.

**Current Status:** Missing  
**Priority:** Critical  
**Launch Critical:** Yes  
**Dependencies:** TASK-API-01, TASK-CONFIG-07  
**Acceptance Criteria:**
- API server is deployed to a production host (Railway, Render, Fly.io, or VPS)
- Server listens on HTTPS with a valid SSL certificate
- Health endpoint at `https://api.laundrylink.ng/api/healthz` returns `{"status":"ok"}`
- Environment variables are set securely (not in source control)
- Auto-restart on crash is configured

**Estimated Complexity:** Medium  
**Suggested Implementation Order:** Sprint 2

---

### TASK-DEPLOY-02 · Build Production Android APK via EAS

**Purpose:**  
PurePress staff and customers need an installable APK before Play Store submission.

**Current Status:** Missing  
**Priority:** Critical  
**Launch Critical:** Yes  
**Dependencies:** TASK-CONFIG-03, all Critical tasks complete  
**Acceptance Criteria:**
- `eas build --platform android --profile preview` completes without error
- APK installs on a real Android device
- App connects to production Supabase
- All core flows tested on a physical device before distribution

**Estimated Complexity:** Medium  
**Suggested Implementation Order:** Sprint 3 (after all Critical tasks done)

---

### TASK-DEPLOY-03 · Submit to Google Play (Internal Test Track)

**Purpose:**  
For controlled initial distribution to PurePress staff and beta customers.

**Current Status:** Missing  
**Priority:** High  
**Launch Critical:** No (APK distribution is acceptable for V1.0)  
**Dependencies:** TASK-DEPLOY-02  
**Acceptance Criteria:**
- App submitted to Google Play internal testing track
- PurePress staff receive test invitations
- Play Store listing has correct name, icon, and screenshots

**Estimated Complexity:** Medium  
**Suggested Implementation Order:** Sprint 4

---

---

## Blockers

### Launch Blockers

These must be resolved before any real user places a real order.

| # | Blocker | Task |
|---|---|---|
| 1 | Hardcoded fake dispatcher UUIDs — assignment is completely broken | TASK-DISP-01, TASK-DISP-02 |
| 2 | No Paystack webhook — payments are unverified | TASK-PAY-01 |
| 3 | Subscription state not in Supabase — lost on reinstall | TASK-PAY-03 |
| 4 | Hardcoded Super Admin passphrase in source | TASK-SEC-01 |
| 5 | All notifications are device-local only | TASK-NOTIF-01 |
| 6 | PurePress business record does not exist in Supabase | TASK-AUTH-01 |
| 7 | `DEFAULT_BUSINESS_ID` does not match any seeded Supabase row | TASK-DATA-05 |
| 8 | Fictional laundromats shown to customers | TASK-DATA-01 |
| 9 | No real dispatcher accounts | TASK-AUTH-03 |
| 10 | API server has no auth, no database, no business logic | TASK-API-01, TASK-SEC-02 |
| 11 | No password reset flow | TASK-AUTH-05 |
| 12 | Business paywall blocks PurePress staff on fresh install | TASK-BIZ-04 |

### Important Improvements (Pre-Launch or Sprint 2)

- Real Paystack card checkout (TASK-PAY-02)
- KYC backend for dispatcher onboarding (TASK-DISP-03)
- Continuous GPS location sharing (TASK-DISP-04)
- Business profile edit form (TASK-BIZ-01)
- Service pricing in Supabase (TASK-BIZ-02)
- Admin user management backend (TASK-ADMIN-02)
- Offline queue failure notification (TASK-ORD-04)
- Email provider configuration (TASK-CONFIG-05)
- Production domain + HTTPS API (TASK-CONFIG-07)

### Future Improvements (Post-Launch)

- Review and rating system
- Dispute / refund flow
- Order cancellation UI for customers (TASK-CX-05)
- Saved addresses in Supabase (TASK-CX-04)
- Business order isolation fix (TASK-ORD-01)
- Realtime efficiency (TASK-ORD-05)
- Admin audit log (TASK-ADMIN-01)
- Persistent notification inbox (TASK-NOTIF-03)
- CSV report export (TASK-BIZ-03)
- Dark mode re-enable

### Version 2 Candidates (Post-PurePress, SaaS Expansion)

- Multi-business SaaS onboarding
- Multi-branch (Enterprise) support
- Socket.IO for true real-time driver tracking
- Cloudinary integration for media upload
- SMS notification fallback
- Automated zone-based dispatcher matching
- Paystack recurring subscriptions for SaaS billing
- Dispatcher earnings tracking and payouts
- Customer loyalty / referral system
- Web dashboard for business analytics

---

## Final Summary

### Top 20 Launch-Critical Engineering Tasks

| Priority | Task | Description |
|---|---|---|
| 1 | TASK-AUTH-01 | Seed PurePress Laundry business record in Supabase |
| 2 | TASK-DATA-05 | Fix DEFAULT_BUSINESS_ID / Supabase seed mismatch |
| 3 | TASK-DATA-01 | Remove fictional laundromats, show only PurePress |
| 4 | TASK-DATA-02 | Remove fake dispatcher array |
| 5 | TASK-AUTH-03 | Create real dispatcher accounts in Supabase |
| 6 | TASK-DISP-01 | Replace hardcoded DISPATCHERS with Supabase query |
| 7 | TASK-DISP-02 | Scope dispatcher order visibility to assigned-only |
| 8 | TASK-SEC-01 | Remove hardcoded Super Admin passphrase |
| 9 | TASK-API-01 | Set up core API server foundation (DB + auth + error handling) |
| 10 | TASK-SEC-02 | Add auth middleware to Express API server |
| 11 | TASK-PAY-01 | Implement Paystack webhook handler |
| 12 | TASK-PAY-02 | Implement real Paystack card checkout |
| 13 | TASK-PAY-03 | Sync subscription state to Supabase |
| 14 | TASK-NOTIF-01 | Implement server-side Expo push notification dispatch |
| 15 | TASK-NOTIF-02 | Add orderId to notification payloads for deep links |
| 16 | TASK-BIZ-04 | Bypass/resolve subscription paywall for PurePress |
| 17 | TASK-AUTH-05 | Add forgot password / password reset flow |
| 18 | TASK-CONFIG-01 | Set Paystack live keys in production |
| 19 | TASK-CONFIG-02 | Set production Supabase project and keys |
| 20 | TASK-DEPLOY-01 | Deploy API server to production HTTPS host |

---

### Recommended Implementation Sequence

#### Sprint 1 — Foundation & Data (before any real user touches the app)

1. TASK-AUTH-01 — Create PurePress Supabase record
2. TASK-DATA-05 — Fix DEFAULT_BUSINESS_ID mismatch
3. TASK-DATA-01 — Remove fictional laundromats
4. TASK-DATA-02 — Remove fake dispatcher constant
5. TASK-DATA-03 — Clean demo accounts from production Supabase
6. TASK-SEC-01 — Remove hardcoded passphrase
7. TASK-CONFIG-01 — Set Paystack keys
8. TASK-CONFIG-02 — Set production Supabase keys
9. TASK-CONFIG-08 — Enable Supabase Realtime on orders table
10. TASK-CONFIG-04 — Set SESSION_SECRET
11. TASK-API-01 — Core API server foundation
12. TASK-SEC-02 — Auth middleware on API server
13. TASK-BIZ-04 — Unblock PurePress staff dashboard

#### Sprint 2 — Real Operations

14. TASK-AUTH-03 — Create real dispatcher accounts
15. TASK-DISP-01 — Replace DISPATCHERS with real Supabase query
16. TASK-DISP-02 — Scope dispatcher order visibility
17. TASK-PAY-01 — Paystack webhook handler
18. TASK-PAY-02 — Real Paystack card checkout
19. TASK-NOTIF-01 — Server-side push notification dispatch
20. TASK-NOTIF-02 — Add orderId to notification data payloads
21. TASK-AUTH-05 — Forgot password / reset
22. TASK-CONFIG-05 — Email provider for auth emails
23. TASK-CONFIG-06 — Push notification credentials (APNs/FCM)
24. TASK-CONFIG-07 — Production domain + HTTPS
25. TASK-DEPLOY-01 — Deploy API server

#### Sprint 3 — Quality & Stability

26. TASK-PAY-03 — Sync subscription to Supabase
27. TASK-BIZ-01 — Business profile edit form
28. TASK-BIZ-02 — Service pricing in Supabase
29. TASK-CX-01 — PurePress service list correct
30. TASK-CX-02 — PurePress pricing correct
31. TASK-DISP-03 — KYC backend
32. TASK-DISP-04 — Continuous GPS location sharing
33. TASK-SEC-04 — Tighten RLS policies
34. TASK-ADMIN-02 — Make admin user management functional
35. TASK-CONFIG-03 — EAS build configuration

#### Sprint 4 — Hardening

36. TASK-ORD-04 — Offline queue failure notifications
37. TASK-CX-05 — Customer order cancellation UI
38. TASK-ORD-01 — Business order isolation
39. TASK-ADMIN-01 — Real admin activity log
40. TASK-TEST-01 through TASK-TEST-10 — All testing epics
41. TASK-DEPLOY-02 — Production APK build

---

### Features That Should Absolutely NOT Be Worked On Before Launch

1. **Multi-tenant SaaS onboarding flow** — V1.0 is single-business only
2. **Review and rating system** — Zero infrastructure exists; high complexity
3. **Dispute / refund flow** — No payment verification exists yet; this comes after TASK-PAY-01
4. **Socket.IO live tracking** — Supabase realtime is sufficient for V1.0 operational scale
5. **Cloudinary / media upload** — No operational need identified for launch
6. **Dark mode** — Intentionally disabled; infrastructure exists but not a launch requirement
7. **Multi-branch (Enterprise)** — No second branch to manage
8. **Dispatcher earnings tracking** — No earnings model established yet
9. **CSV export** — Manual workaround via Supabase dashboard is acceptable for V1.0
10. **Web dashboard** — Mobile app covers all V1.0 operational needs
11. **SMS notification fallback** — Push notifications sufficient for V1.0 if configured
12. **Customer loyalty / referral** — Growth feature, not operational necessity

---

*End of LaundryLink Version 1.0 Launch Backlog. All task estimates assume an experienced React Native / Node.js engineer. Sprint sizing assumes approximately 10 engineering days per sprint.*
