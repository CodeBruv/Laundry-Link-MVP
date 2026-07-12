import { BUSINESS_CONFIG } from "@/constants/businessConfig";

export interface LaundryServiceItem {
  id: string;
  name: string;
  pricePerUnit: number;
  unit: string;
}

export interface Laundromat {
  id: string;
  name: string;
  location: string;
  city: string;
  zone: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  phone: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  pickupFee: number;
  deliveryFee: number;
  services: LaundryServiceItem[];
  isOpen: boolean;
}

/**
 * CITIES — V1.0 serves Jos only (PurePress Laundry operating city).
 * Additional cities will be added during SaaS expansion.
 */
export const CITIES = ["Jos"] as const;
export type City = (typeof CITIES)[number];

export const DEFAULT_CITY: City = "Jos";

/**
 * LAUNDROMATS — V1.0 contains only PurePress Laundry (Jos).
 *
 * Seven fictional laundromats (FreshClean, Plateau Wash, Tin City, Highland
 * CleanHouse, CleanPro, FreshWash, Island Wash) have been removed as they do
 * not correspond to real businesses or real database records.
 *
 * Bank account details below are placeholders — replace with real PurePress
 * account details before production payment testing.
 *
 * See: TASK-CX-01 in laundry-link-v1-backlog.md
 */
export const LAUNDROMATS: Laundromat[] = [
  {
    id: BUSINESS_CONFIG.id,
    name: BUSINESS_CONFIG.name,
    location: `Rayfield, ${BUSINESS_CONFIG.city}`,
    city: BUSINESS_CONFIG.city,
    zone: "Rayfield",
    rating: 5.0,
    reviewCount: 0,
    distanceKm: 0.0,
    phone: BUSINESS_CONFIG.phone,
    bankName: BUSINESS_CONFIG.bankName,
    accountNumber: BUSINESS_CONFIG.accountNumber,
    accountName: BUSINESS_CONFIG.accountName,
    pickupFee: BUSINESS_CONFIG.defaultPickupFee,
    deliveryFee: BUSINESS_CONFIG.defaultDeliveryFee,
    isOpen: true,
    services: [
      { id: "shirt", name: "Shirt Wash & Iron", pricePerUnit: 500, unit: "shirt" },
      { id: "trouser", name: "Trouser Press", pricePerUnit: 800, unit: "trouser" },
      { id: "native", name: "Native Wear", pricePerUnit: 1500, unit: "set" },
      { id: "bedsheet", name: "Bedsheet Wash", pricePerUnit: 1100, unit: "sheet" },
      { id: "duvet", name: "Duvet Wash", pricePerUnit: 2500, unit: "duvet" },
      { id: "suit", name: "Suit Dry Clean", pricePerUnit: 3000, unit: "suit" },
      { id: "dress", name: "Ladies Dress", pricePerUnit: 1200, unit: "dress" },
    ],
  },
];

export function getLaundromatsForCity(city: City): Laundromat[] {
  return LAUNDROMATS.filter((l) => l.city === city);
}

export function sortLaundromats(
  list: Laundromat[],
  by: "distance" | "rating" | "price",
): Laundromat[] {
  return [...list].sort((a, b) => {
    if (by === "distance") return a.distanceKm - b.distanceKm;
    if (by === "rating") return b.rating - a.rating;
    if (by === "price") {
      const avg = (l: Laundromat) =>
        l.services.reduce((s, sv) => s + sv.pricePerUnit, 0) / l.services.length;
      return avg(a) - avg(b);
    }
    return 0;
  });
}
