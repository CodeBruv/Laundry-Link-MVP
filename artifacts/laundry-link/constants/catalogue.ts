import { BUSINESS_CONFIG } from "@/constants/businessConfig";
import { LaundryService } from "@/types";

// ── Service categories ─────────────────────────────────────────────────────

export type ServiceCategory =
  | "Regular"
  | "Native Wear"
  | "Formal"
  | "Bedding"
  | "Specialty"
  | "Add-on";

// ── Catalogue item definition ──────────────────────────────────────────────

export interface CatalogueItem {
  id: string;
  name: string;
  category: ServiceCategory;
  basePrice: number;
  unit: string;
  isActive: boolean;
  description?: string;
}

// ── PurePress production service catalogue ─────────────────────────────────
//
// All prices in Nigerian Naira (₦). basePrice is the standard rate;
// surcharges (white garment, stonework, express, etc.) are applied on top
// via pricingRules.ts.
//
// Do NOT hardcode prices into order screens. Always read from this catalogue.

export const CATALOGUE: CatalogueItem[] = [
  // ── Regular ───────────────────────────────────────────────────────────
  {
    id: "shirt",
    name: "Shirt",
    category: "Regular",
    basePrice: 500,
    unit: "shirt",
    isActive: true,
    description: "Wash, dry, and iron — collared and formal shirts",
  },
  {
    id: "trouser",
    name: "Trouser",
    category: "Regular",
    basePrice: 800,
    unit: "trouser",
    isActive: true,
    description: "Steam press and wash",
  },
  {
    id: "jeans",
    name: "Jeans",
    category: "Regular",
    basePrice: 900,
    unit: "pair",
    isActive: true,
    description: "Wash and line dry — no machine dry",
  },
  {
    id: "tshirt",
    name: "T-Shirt",
    category: "Regular",
    basePrice: 400,
    unit: "item",
    isActive: true,
    description: "Wash and fold",
  },
  {
    id: "shorts",
    name: "Shorts",
    category: "Regular",
    basePrice: 450,
    unit: "pair",
    isActive: true,
    description: "Wash and fold",
  },
  {
    id: "hoodie",
    name: "Hoodie",
    category: "Regular",
    basePrice: 1000,
    unit: "item",
    isActive: true,
    description: "Gentle wash, line dry",
  },
  {
    id: "tracksuit-set",
    name: "Tracksuit (Set)",
    category: "Regular",
    basePrice: 1500,
    unit: "set",
    isActive: true,
    description: "Top and bottom washed together",
  },
  {
    id: "tracksuit-top",
    name: "Tracksuit Top",
    category: "Regular",
    basePrice: 900,
    unit: "item",
    isActive: true,
    description: "Wash and fold",
  },
  {
    id: "tracksuit-bottom",
    name: "Tracksuit Bottom",
    category: "Regular",
    basePrice: 700,
    unit: "item",
    isActive: true,
    description: "Wash and fold",
  },

  // ── Native Wear ───────────────────────────────────────────────────────
  {
    id: "kaftan",
    name: "Kaftan",
    category: "Native Wear",
    basePrice: 2000,
    unit: "item",
    isActive: true,
    description: "Hand wash, gentle press",
  },
  {
    id: "agbada",
    name: "Agbada (Full Set)",
    category: "Native Wear",
    basePrice: 4500,
    unit: "set",
    isActive: true,
    description: "Agbada top, sokoto, and fila — hand wash and press",
  },
  {
    id: "female-native",
    name: "Female Native",
    category: "Native Wear",
    basePrice: 2500,
    unit: "item",
    isActive: true,
    description: "Ankara, iro and buba, wrapper — gentle wash and press",
  },
  {
    id: "aso-oke",
    name: "Aso-oke (per piece)",
    category: "Native Wear",
    basePrice: 1500,
    unit: "piece",
    isActive: true,
    description: "Dry clean only",
  },

  // ── Formal ────────────────────────────────────────────────────────────
  {
    id: "jacket",
    name: "Jacket",
    category: "Formal",
    basePrice: 2500,
    unit: "item",
    isActive: true,
    description: "Dry clean and press",
  },
  {
    id: "suit",
    name: "Suit (Dry Clean)",
    category: "Formal",
    basePrice: 4000,
    unit: "suit",
    isActive: true,
    description: "Full suit — jacket and trouser, dry cleaned and pressed",
  },
  {
    id: "ladies-dress",
    name: "Ladies Dress",
    category: "Formal",
    basePrice: 1200,
    unit: "dress",
    isActive: true,
    description: "Gentle wash and iron",
  },
  {
    id: "skirt",
    name: "Skirt",
    category: "Formal",
    basePrice: 800,
    unit: "item",
    isActive: true,
    description: "Wash and press",
  },
  {
    id: "blouse",
    name: "Blouse",
    category: "Formal",
    basePrice: 500,
    unit: "item",
    isActive: true,
    description: "Wash, dry, and iron",
  },

  // ── Bedding ───────────────────────────────────────────────────────────
  {
    id: "duvet-single",
    name: "Duvet (Single)",
    category: "Bedding",
    basePrice: 2500,
    unit: "item",
    isActive: true,
    description: "Machine wash, tumble dry",
  },
  {
    id: "duvet-double",
    name: "Duvet (Double)",
    category: "Bedding",
    basePrice: 3500,
    unit: "item",
    isActive: true,
    description: "Machine wash, tumble dry",
  },
  {
    id: "duvet-king",
    name: "Duvet (King)",
    category: "Bedding",
    basePrice: 4500,
    unit: "item",
    isActive: true,
    description: "Machine wash, tumble dry",
  },
  {
    id: "blanket-small",
    name: "Blanket (Small)",
    category: "Bedding",
    basePrice: 1500,
    unit: "item",
    isActive: true,
    description: "Machine wash",
  },
  {
    id: "blanket-medium",
    name: "Blanket (Medium)",
    category: "Bedding",
    basePrice: 2000,
    unit: "item",
    isActive: true,
    description: "Machine wash",
  },
  {
    id: "blanket-large",
    name: "Blanket (Large)",
    category: "Bedding",
    basePrice: 2500,
    unit: "item",
    isActive: true,
    description: "Machine wash",
  },
  {
    id: "bedsheet-set",
    name: "Bedsheet Set",
    category: "Bedding",
    basePrice: 1500,
    unit: "set",
    isActive: true,
    description: "Sheet, pillowcases, and fitted sheet washed together",
  },
  {
    id: "pillowcase",
    name: "Pillowcase",
    category: "Bedding",
    basePrice: 300,
    unit: "item",
    isActive: true,
    description: "Wash and iron",
  },

  // ── Specialty ─────────────────────────────────────────────────────────
  {
    id: "curtain-panel",
    name: "Curtain (per panel)",
    category: "Specialty",
    basePrice: 2000,
    unit: "panel",
    isActive: true,
    description: "Machine wash, hang to dry",
  },
  {
    id: "stain-treatment",
    name: "Stain Treatment",
    category: "Specialty",
    basePrice: 1000,
    unit: "item",
    isActive: true,
    description: "Targeted stain removal — success not guaranteed on set stains",
  },
  {
    id: "shoe-cleaning",
    name: "Shoe Cleaning",
    category: "Specialty",
    basePrice: 500,
    unit: "pair",
    isActive: true,
    description: "Hand clean, odour treatment",
  },

  // ── Add-ons ───────────────────────────────────────────────────────────
  {
    id: "express-handling",
    name: "Express Handling",
    category: "Add-on",
    basePrice: 2000,
    unit: "order",
    isActive: true,
    description: "Priority same-day handling — subject to availability",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

export function getCatalogueByCategory(): Record<ServiceCategory, CatalogueItem[]> {
  const result: Record<ServiceCategory, CatalogueItem[]> = {
    Regular: [],
    "Native Wear": [],
    Formal: [],
    Bedding: [],
    Specialty: [],
    "Add-on": [],
  };
  for (const item of CATALOGUE) {
    if (item.isActive) result[item.category].push(item);
  }
  return result;
}

export function getCatalogueItem(id: string): CatalogueItem | undefined {
  return CATALOGUE.find((item) => item.id === id);
}

/**
 * Convert a CatalogueItem to a LaundryService for use in the order wizard
 * and any code that still expects the legacy LaundryService interface.
 */
export function toService(item: CatalogueItem): LaundryService {
  return {
    id: item.id,
    businessId: BUSINESS_CONFIG.id,
    name: item.name,
    description: item.description,
    pricePerUnit: item.basePrice,
    unit: item.unit,
    isActive: item.isActive,
    category: item.category,
  };
}

/** All active catalogue items as LaundryService objects. */
export const CATALOGUE_AS_SERVICES: LaundryService[] = CATALOGUE
  .filter((item) => item.isActive)
  .map(toService);
