import { LaundryService } from "@/types";

// Must match the laundromat ID in constants/laundromats.ts for the default business
export const DEFAULT_BUSINESS_ID = "freshclean-jos";
export const DEFAULT_BUSINESS_NAME = "FreshClean Laundry";

export const LAUNDRY_SERVICES: LaundryService[] = [
  {
    id: "shirt-wash",
    businessId: DEFAULT_BUSINESS_ID,
    name: "Shirt Wash & Iron",
    description: "Wash, dry, and iron shirts",
    pricePerUnit: 500,
    unit: "shirt",
    isActive: true,
  },
  {
    id: "trouser-press",
    businessId: DEFAULT_BUSINESS_ID,
    name: "Trouser Press",
    description: "Steam press for trousers",
    pricePerUnit: 800,
    unit: "trouser",
    isActive: true,
  },
  {
    id: "native-wear",
    businessId: DEFAULT_BUSINESS_ID,
    name: "Native Wear",
    description: "Careful wash and press for native attire",
    pricePerUnit: 1500,
    unit: "set",
    isActive: true,
  },
  {
    id: "bedsheet",
    businessId: DEFAULT_BUSINESS_ID,
    name: "Bedsheet Wash",
    description: "Deep wash for bedding and duvet covers",
    pricePerUnit: 1100,
    unit: "sheet",
    isActive: true,
  },
  {
    id: "suit",
    businessId: DEFAULT_BUSINESS_ID,
    name: "Suit (Dry Clean)",
    description: "Professional dry cleaning for suits",
    pricePerUnit: 3000,
    unit: "suit",
    isActive: true,
  },
  {
    id: "dress",
    businessId: DEFAULT_BUSINESS_ID,
    name: "Ladies Dress",
    description: "Gentle wash and iron for dresses",
    pricePerUnit: 1200,
    unit: "dress",
    isActive: true,
  },
  {
    id: "express-fee",
    businessId: DEFAULT_BUSINESS_ID,
    name: "Express Handling",
    description: "Priority same-day handling when available",
    pricePerUnit: 2000,
    unit: "order",
    isActive: true,
  },
];

export const DISPATCHERS = [
  { id: "11111111-1111-4111-8111-111111111111", name: "Aminu Suleiman" },
  { id: "22222222-2222-4222-8222-222222222222", name: "Daniel Okafor" },
  { id: "33333333-3333-4333-8333-333333333333", name: "Chioma Eze" },
];
