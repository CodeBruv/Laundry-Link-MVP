import { CATALOGUE_AS_SERVICES } from "@/constants/catalogue";

export { DEFAULT_BUSINESS_ID, DEFAULT_BUSINESS_NAME } from "@/constants/businessConfig";

/**
 * LAUNDRY_SERVICES — production catalogue as LaundryService objects.
 *
 * Source of truth is constants/catalogue.ts (CatalogueItem[]).
 * This export exists for backward compatibility with screens that import
 * from constants/services.ts. New code should import from catalogue.ts
 * directly to access category, description, and pricing metadata.
 */
export const LAUNDRY_SERVICES = CATALOGUE_AS_SERVICES;

/**
 * DISPATCHERS — pending replacement with live Supabase query.
 *
 * This array is intentionally empty. Real dispatcher users are fetched from
 * the `profiles` table (role = "DISPATCHER") at runtime. Hardcoded UUIDs
 * were removed because they referenced non-existent database rows.
 *
 * See: TASK-DISP-01 in laundry-link-v1-backlog.md
 */
export const DISPATCHERS: { id: string; name: string }[] = [];
