import { LaundryService } from "@/types";
import { BUSINESS_CONFIG } from "@/constants/businessConfig";

export { DEFAULT_BUSINESS_ID, DEFAULT_BUSINESS_NAME } from "@/constants/businessConfig";

export const LAUNDRY_SERVICES: LaundryService[] = [
  {
    id: "shirt-wash",
    businessId: BUSINESS_CONFIG.id,
    name: "Shirt Wash & Iron",
    description: "Wash, dry, and iron shirts",
    pricePerUnit: 500,
    unit: "shirt",
    isActive: true,
  },
  {
    id: "trouser-press",
    businessId: BUSINESS_CONFIG.id,
    name: "Trouser Press",
    description: "Steam press for trousers",
    pricePerUnit: 800,
    unit: "trouser",
    isActive: true,
  },
  {
    id: "native-wear",
    businessId: BUSINESS_CONFIG.id,
    name: "Native Wear",
    description: "Careful wash and press for native attire",
    pricePerUnit: 1500,
    unit: "set",
    isActive: true,
  },
  {
    id: "bedsheet",
    businessId: BUSINESS_CONFIG.id,
    name: "Bedsheet Wash",
    description: "Deep wash for bedding and duvet covers",
    pricePerUnit: 1100,
    unit: "sheet",
    isActive: true,
  },
  {
    id: "suit",
    businessId: BUSINESS_CONFIG.id,
    name: "Suit (Dry Clean)",
    description: "Professional dry cleaning for suits",
    pricePerUnit: 3000,
    unit: "suit",
    isActive: true,
  },
  {
    id: "dress",
    businessId: BUSINESS_CONFIG.id,
    name: "Ladies Dress",
    description: "Gentle wash and iron for dresses",
    pricePerUnit: 1200,
    unit: "dress",
    isActive: true,
  },
  {
    id: "express-fee",
    businessId: BUSINESS_CONFIG.id,
    name: "Express Handling",
    description: "Priority same-day handling when available",
    pricePerUnit: 2000,
    unit: "order",
    isActive: true,
  },
];

/**
 * DISPATCHERS — pending replacement with live Supabase query.
 *
 * This array is intentionally empty. Real dispatcher users are fetched from the
 * `profiles` table (role = "DISPATCHER") at runtime. Hardcoded UUIDs were
 * removed because they referenced non-existent database users, which broke
 * dispatcher assignment and RLS visibility.
 *
 * See: TASK-DISP-01 in laundry-link-v1-backlog.md
 */
export const DISPATCHERS: { id: string; name: string }[] = [];
