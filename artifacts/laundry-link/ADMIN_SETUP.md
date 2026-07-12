# PurePress Laundry — First Administrator Setup

## Overview

Admin accounts are **never** created through the public registration flow. The Admin role is assigned manually through the Supabase dashboard after a trusted user signs up through the normal flow.

There are two tiers of admin access in the app:

| Tier | How it works | What it can do |
|---|---|---|
| `STAFF` | Any user with `role = "ADMIN"` in their profile | View dashboard, users, businesses, orders |
| `SUPER` | Admin profile + `user_metadata.admin_tier = "SUPER"` | All STAFF permissions + Super Admin unlock (passphrase elevation) |

---

## Step-by-Step: Create the First Super Admin

### Step 1 — Remove ADMIN from the sign-up role picker (pending TASK-AUTH-02)

Until this is done, the sign-up form shows ADMIN as an option. This must be hidden before any real users register. See `app/(auth)/signup.tsx`.

### Step 2 — Create a user account normally

The intended admin should sign up in the app using their email and password, selecting **any role** (e.g. CUSTOMER). The role will be overridden manually.

### Step 3 — Promote the user to ADMIN role

In the Supabase dashboard:

1. Go to **Table Editor** → `profiles`
2. Find the user by email
3. Set `role = "ADMIN"`
4. Save

This grants access to the admin dashboard screens in the app.

### Step 4 — Grant Super Admin tier (optional but recommended)

Still in the Supabase dashboard:

1. Go to **Authentication** → **Users**
2. Find the user
3. Click **Edit user**
4. Under **User Metadata**, add:

```json
{
  "admin_tier": "SUPER"
}
```

5. Save

This grants `isSuperAdmin = true` in `useAdminAccess()` without needing the passphrase unlock.

### Step 5 — Link the business owner account (optional)

If the admin is also the PurePress business owner:

```sql
update businesses
set user_id = '<paste-admin-user-uuid-here>'
where id = 'purepress-jos';
```

Run this in the Supabase SQL editor. The UUID is found in Authentication → Users.

---

## Step-by-Step: Link PurePress Business to Owner

After the business owner account is created:

```sql
-- Replace the UUID with the actual business owner's auth.users.id
update businesses
set user_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
where id = 'purepress-jos';
```

This allows the owner to update their business profile through the app (uses the `Business owners can update their business` RLS policy).

---

## Passphrase-Based Super Admin Elevation

The app supports an alternative passphrase-based elevation path for emergency use:

1. Set `EXPO_PUBLIC_ADMIN_PASSPHRASE` in your `.env` or EAS secrets
2. From the Admin dashboard, tap the lock icon and enter the passphrase
3. `isSuperAdmin` becomes true for the current device session
4. Session is stored in AsyncStorage and persists until `revokeSuper()` is called

**Recommendation:** Use `user_metadata.admin_tier = "SUPER"` in production. Reserve the passphrase for emergency access when the Supabase dashboard is unavailable.

---

## Admin Dashboard Access

Admin users are automatically routed to `/(admin)` by the route guard in `AuthContext.tsx`. No additional configuration is needed.

The admin dashboard provides:
- Live platform stats (order counts, status breakdowns)
- User list derived from order history
- Business subscription status

---

## Security Notes

- Admin accounts must use strong, unique passwords
- Enable Supabase MFA (Multi-Factor Authentication) for admin accounts: Authentication → Users → enable TOTP
- The `ADMIN` role check uses `profiles.role`, which is protected by RLS
- Admin screens run on-device — they query Supabase directly, not a protected backend
- For true production security, move sensitive admin operations to the API server with server-side role checks

---

## Future Work

| Task | Description |
|---|---|
| TASK-AUTH-02 | Remove ADMIN from public sign-up role selector |
| TASK-SEC-01 | Move admin passphrase to Supabase user_metadata exclusively |
| TASK-SEC-02 | Add server-side admin role verification on API routes |
