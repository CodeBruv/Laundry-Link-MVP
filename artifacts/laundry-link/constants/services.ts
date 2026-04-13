import { LaundryService } from "@/types";

export const DEFAULT_BUSINESS_ID = "cleanpro-abuja";
export const DEFAULT_BUSINESS_NAME = "CleanPro Laundry Abuja";

export const LAUNDRY_SERVICES: LaundryService[] = [
  {
    id: "shirt-wash",
    businessId: DEFAULT_BUSINESS_ID,
    name: "Shirt Wash",
    description: "Wash, dry, and fold shirts",
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
    description: "Careful wash and press for native wear",
    pricePerUnit: 1500,
    unit: "set",
    isActive: true,
  },
  {
    id: "bedsheet",
    businessId: DEFAULT_BUSINESS_ID,
    name: "Bedsheet Wash",
    description: "Deep wash for bedding",
    pricePerUnit: 1200,
    unit: "sheet",
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
  { id: "11111111-1111-4111-8111-111111111111", name: "Amina Yusuf" },
  { id: "22222222-2222-4222-8222-222222222222", name: "Daniel Okafor" },
  { id: "33333333-3333-4333-8333-333333333333", name: "Musa Bello" },
];
