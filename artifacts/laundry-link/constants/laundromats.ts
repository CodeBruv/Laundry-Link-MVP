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

export const CITIES = ["Jos", "Abuja", "Lagos", "Kano", "Port Harcourt"] as const;
export type City = (typeof CITIES)[number];

export const DEFAULT_CITY: City = "Jos";

export const LAUNDROMATS: Laundromat[] = [
  // ── Jos (default city) ──────────────────────────────────────────────────
  {
    id: "freshclean-jos",
    name: "FreshClean Laundry",
    location: "Rayfield, Jos",
    city: "Jos",
    zone: "Rayfield",
    rating: 4.8,
    reviewCount: 127,
    distanceKm: 0.5,
    phone: "+2348012345678",
    bankName: "Access Bank",
    accountNumber: "0123456789",
    accountName: "FreshClean Laundry Jos",
    pickupFee: 600,
    deliveryFee: 1200,
    isOpen: true,
    services: [
      { id: "shirt", name: "Shirt Wash & Iron", pricePerUnit: 500, unit: "shirt" },
      { id: "trouser", name: "Trouser Press", pricePerUnit: 800, unit: "trouser" },
      { id: "native", name: "Native Wear", pricePerUnit: 1500, unit: "set" },
      { id: "bedsheet", name: "Bedsheet Wash", pricePerUnit: 1100, unit: "sheet" },
      { id: "duvet", name: "Duvet Wash", pricePerUnit: 2500, unit: "duvet" },
      { id: "suit", name: "Suit Dry Clean", pricePerUnit: 3000, unit: "suit" },
    ],
  },
  {
    id: "plateau-wash-jos",
    name: "Plateau Wash",
    location: "GRA, Jos",
    city: "Jos",
    zone: "GRA",
    rating: 4.6,
    reviewCount: 84,
    distanceKm: 0.9,
    phone: "+2348023456789",
    bankName: "GTBank",
    accountNumber: "0234567890",
    accountName: "Plateau Wash Services",
    pickupFee: 500,
    deliveryFee: 1000,
    isOpen: true,
    services: [
      { id: "shirt", name: "Shirt Wash & Iron", pricePerUnit: 450, unit: "shirt" },
      { id: "trouser", name: "Trouser Press", pricePerUnit: 700, unit: "trouser" },
      { id: "native", name: "Native Wear", pricePerUnit: 1300, unit: "set" },
      { id: "bedsheet", name: "Bedsheet Wash", pricePerUnit: 950, unit: "sheet" },
      { id: "curtain", name: "Curtain Wash", pricePerUnit: 2000, unit: "curtain" },
    ],
  },
  {
    id: "tin-city-laundry",
    name: "Tin City Laundry",
    location: "Terminus, Jos",
    city: "Jos",
    zone: "Terminus",
    rating: 4.5,
    reviewCount: 61,
    distanceKm: 1.4,
    phone: "+2348034567890",
    bankName: "First Bank",
    accountNumber: "3045678901",
    accountName: "Tin City Laundry",
    pickupFee: 400,
    deliveryFee: 800,
    isOpen: true,
    services: [
      { id: "shirt", name: "Shirt Wash & Iron", pricePerUnit: 400, unit: "shirt" },
      { id: "trouser", name: "Trouser Press", pricePerUnit: 650, unit: "trouser" },
      { id: "native", name: "Native Wear", pricePerUnit: 1200, unit: "set" },
      { id: "bedsheet", name: "Bedsheet Wash", pricePerUnit: 900, unit: "sheet" },
      { id: "shoes", name: "Shoe Cleaning", pricePerUnit: 500, unit: "pair" },
    ],
  },
  {
    id: "highland-clean-jos",
    name: "Highland CleanHouse",
    location: "Anglo Jos",
    city: "Jos",
    zone: "Anglo",
    rating: 4.3,
    reviewCount: 38,
    distanceKm: 2.1,
    phone: "+2348045678901",
    bankName: "Zenith Bank",
    accountNumber: "2056789012",
    accountName: "Highland CleanHouse",
    pickupFee: 300,
    deliveryFee: 700,
    isOpen: false,
    services: [
      { id: "shirt", name: "Shirt Wash & Iron", pricePerUnit: 380, unit: "shirt" },
      { id: "trouser", name: "Trouser Press", pricePerUnit: 600, unit: "trouser" },
      { id: "native", name: "Native Wear", pricePerUnit: 1100, unit: "set" },
      { id: "bedsheet", name: "Bedsheet Wash", pricePerUnit: 850, unit: "sheet" },
    ],
  },

  // ── Abuja ─────────────────────────────────────────────────────────────
  {
    id: "cleanpro-maitama",
    name: "CleanPro Laundry",
    location: "Maitama, Abuja",
    city: "Abuja",
    zone: "Maitama",
    rating: 4.8,
    reviewCount: 143,
    distanceKm: 0.4,
    phone: "+2348056789012",
    bankName: "Access Bank",
    accountNumber: "0167890123",
    accountName: "CleanPro Laundry Ltd",
    pickupFee: 800,
    deliveryFee: 1500,
    isOpen: true,
    services: [
      { id: "shirt", name: "Shirt Wash & Iron", pricePerUnit: 600, unit: "shirt" },
      { id: "trouser", name: "Trouser Press", pricePerUnit: 900, unit: "trouser" },
      { id: "native", name: "Native Wear", pricePerUnit: 2000, unit: "set" },
      { id: "bedsheet", name: "Bedsheet Wash", pricePerUnit: 1400, unit: "sheet" },
      { id: "curtain", name: "Curtain Wash", pricePerUnit: 2500, unit: "curtain" },
      { id: "suit", name: "Suit Dry Clean", pricePerUnit: 3500, unit: "suit" },
    ],
  },
  {
    id: "freshwash-wuse2",
    name: "FreshWash Express",
    location: "Wuse Zone 2, Abuja",
    city: "Abuja",
    zone: "Wuse Zone 2",
    rating: 4.6,
    reviewCount: 89,
    distanceKm: 0.9,
    phone: "+2348067890123",
    bankName: "GTBank",
    accountNumber: "0278901234",
    accountName: "FreshWash Express",
    pickupFee: 500,
    deliveryFee: 1000,
    isOpen: true,
    services: [
      { id: "shirt", name: "Shirt Wash & Iron", pricePerUnit: 450, unit: "shirt" },
      { id: "trouser", name: "Trouser Press", pricePerUnit: 700, unit: "trouser" },
      { id: "native", name: "Native Wear", pricePerUnit: 1500, unit: "set" },
      { id: "bedsheet", name: "Bedsheet Wash", pricePerUnit: 1100, unit: "sheet" },
      { id: "duvet", name: "Duvet Wash", pricePerUnit: 3000, unit: "duvet" },
    ],
  },

  // ── Lagos ─────────────────────────────────────────────────────────────
  {
    id: "island-wash-vi",
    name: "Island Wash",
    location: "Victoria Island, Lagos",
    city: "Lagos",
    zone: "Victoria Island",
    rating: 4.9,
    reviewCount: 312,
    distanceKm: 0.6,
    phone: "+2348078901234",
    bankName: "Zenith Bank",
    accountNumber: "2089012345",
    accountName: "Island Wash Nigeria",
    pickupFee: 1000,
    deliveryFee: 2000,
    isOpen: true,
    services: [
      { id: "shirt", name: "Shirt Wash & Iron", pricePerUnit: 800, unit: "shirt" },
      { id: "trouser", name: "Trouser Press", pricePerUnit: 1200, unit: "trouser" },
      { id: "native", name: "Native Wear", pricePerUnit: 2500, unit: "set" },
      { id: "bedsheet", name: "Bedsheet Wash", pricePerUnit: 1800, unit: "sheet" },
      { id: "suit", name: "Suit Dry Clean", pricePerUnit: 4500, unit: "suit" },
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
      const avg = (l: Laundromat) => l.services.reduce((s, sv) => s + sv.pricePerUnit, 0) / l.services.length;
      return avg(a) - avg(b);
    }
    return 0;
  });
}
