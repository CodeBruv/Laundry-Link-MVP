---
name: Place Order Supabase bugs
description: Root causes that silently blocked all Supabase order creation and made orders invisible to business users.
---

## Rule
When setting up or debugging the Supabase orders flow, watch for two structural bugs.

**Bug 1 — FK violation on business_id**
The original schema had `business_id text NOT NULL REFERENCES businesses(id)`. The `businesses` table only seeds `cleanpro-abuja`, but the app has 7 laundromats with different IDs. Every `INSERT` into `orders` failed with a FK violation (error code `23503`). The fix: remove the FK (`business_id text NOT NULL` with no reference).

**Bug 2 — Business RLS tied to businesses.user_id**
The original policy checked `businesses.user_id = auth.uid()`, but no business record has a `user_id` set, so business users saw zero rows. The fix: role-based policy checking `profiles.role = 'BUSINESS'`.

**Bug 3 — Silent Supabase error fallback**
`createOrder` returned `{ error: null }` even when Supabase INSERT failed, silently writing to local storage. Business reads Supabase → order invisible to business. Fix: when `isOnline` and Supabase returns an error, return the actual error to the caller.

**Why:** Business users read from Supabase. If orders go to local storage only, business sees nothing. Must fail loudly when online so the user knows.

**Migration SQL for live DBs (run in Supabase SQL editor):**
```sql
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_business_id_fkey;
DROP POLICY IF EXISTS "Business users can read their business orders" ON orders;
DROP POLICY IF EXISTS "Business users can update order status" ON orders;
CREATE POLICY "Business users can read their business orders"
  ON orders FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'BUSINESS')
  );
CREATE POLICY "Business users can update order status"
  ON orders FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'BUSINESS')
  );
```
