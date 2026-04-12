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
- **Role persistence**: Signup stores role in Supabase metadata and explicitly updates user metadata after signup
- **Demo mode**: If Supabase keys are missing or placeholder values, app falls back to local demo auth and shows a top banner
- **Storage**: AsyncStorage for local persistence, expo-secure-store for tokens
- **State**: React Context + TanStack React Query
- **Styling**: React Native StyleSheet with design tokens in constants/colors.ts
- **Dark Mode**: Supported via useColorScheme + colors.ts dark palette

### App Structure
```
artifacts/laundry-link/
  app/
    _layout.tsx          # Root layout with providers (Auth, Query, SafeArea, etc.)
    index.tsx            # Redirect based on auth state
    (auth)/              # Login/Signup screens
    (customer)/          # Customer role: Home, Orders, Profile tabs
    (business)/          # Business role: Dashboard, Orders, Services, Subscription, Profile tabs
    (dispatcher)/        # Dispatcher role: Dashboard, Deliveries, Profile tabs
    (admin)/             # Admin role: Dashboard, Users, Businesses, Settings tabs
  components/            # Shared components (RoleSelector, SubscriptionPaywall, etc.)
  contexts/              # AuthContext with Supabase + demo mode
  lib/                   # Supabase client setup
  constants/             # Design tokens (colors, radius)
  types/                 # TypeScript type definitions
```

### Design System
- Primary: #092d52 (deep navy)
- Accent: #1e40af (dark slate blue)
- Background: #f5f9ff / #ffffff
- Text: #1c1c1c
- Font: Inter (400/500/600/700)

### User Roles
- CUSTOMER: Place laundry orders
- BUSINESS: Manage laundromat, services, subscription
- DISPATCHER: Handle pickup/delivery
- ADMIN: Platform management

### Environment Variables
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
