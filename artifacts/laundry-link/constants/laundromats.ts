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

export const LAUNDROMATS: Laundromat[] = [
  {
    id: "cleanpro-maitama",
    name: "CleanPro Laundry",
    location: "Maitama, Abuja",
    zone: "Maitama",
    rating: 4.8,
    reviewCount: 143,
    distanceKm: 0.4,
    phone: "+2348012345678",
    bankName: "Access Bank",
    accountNumber: "0123456789",
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
    zone: "Wuse Zone 2",
    rating: 4.6,
    reviewCount: 89,
    distanceKm: 0.9,
    phone: "+2348023456789",
    bankName: "GTBank",
    accountNumber: "0234567890",
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
  {
    id: "sparkle-garki",
    name: "SparkleClean",
    location: "Garki Area 11, Abuja",
    zone: "Garki Area 11",
    rating: 4.4,
    reviewCount: 56,
    distanceKm: 1.8,
    phone: "+2348034567890",
    bankName: "First Bank",
    accountNumber: "3045678901",
    accountName: "Sparkle Laundry Services",
    pickupFee: 400,
    deliveryFee: 800,
    isOpen: true,
    services: [
      { id: "shirt", name: "Shirt Wash & Iron", pricePerUnit: 350, unit: "shirt" },
      { id: "trouser", name: "Trouser Press", pricePerUnit: 600, unit: "trouser" },
      { id: "native", name: "Native Wear", pricePerUnit: 1200, unit: "set" },
      { id: "bedsheet", name: "Bedsheet Wash", pricePerUnit: 900, unit: "sheet" },
      { id: "shoes", name: "Shoe Cleaning", pricePerUnit: 500, unit: "pair" },
    ],
  },
  {
    id: "royalwash-jabi",
    name: "RoyalWash",
    location: "Jabi, Abuja",
    zone: "Jabi",
    rating: 4.7,
    reviewCount: 211,
    distanceKm: 1.2,
    phone: "+2348045678901",
    bankName: "Zenith Bank",
    accountNumber: "2056789012",
    accountName: "RoyalWash Nigeria Ltd",
    pickupFee: 700,
    deliveryFee: 1200,
    isOpen: false,
    services: [
      { id: "shirt", name: "Shirt Wash & Iron", pricePerUnit: 550, unit: "shirt" },
      { id: "trouser", name: "Trouser Press", pricePerUnit: 850, unit: "trouser" },
      { id: "native", name: "Native Wear", pricePerUnit: 1800, unit: "set" },
      { id: "bedsheet", name: "Bedsheet Wash", pricePerUnit: 1300, unit: "sheet" },
      { id: "jacket", name: "Jacket Dry Clean", pricePerUnit: 2800, unit: "jacket" },
      { id: "wedding", name: "Wedding Outfit", pricePerUnit: 8000, unit: "outfit" },
    ],
  },
];

export function sortLaundromats(
  list: Laundromat[],
  by: "distance" | "rating" | "price",
): Laundromat[] {
  return [...list].sort((a, b) => {
    if (by === "distance") return a.distanceKm - b.distanceKm;
    if (by === "rating") return b.rating - a.rating;
    if (by === "price") {
      const aAvg = a.services.reduce((s, sv) => s + sv.pricePerUnit, 0) / a.services.length;
      const bAvg = b.services.reduce((s, sv) => s + sv.pricePerUnit, 0) / b.services.length;
      return aAvg - bAvg;
    }
    return 0;
  });
}
