// ── PurePress Laundry — Pricing Rules ─────────────────────────────────────
//
// All monetary values are in Nigerian Naira (₦).
// All percentages are integers representing percent (20 = 20%).
//
// Do NOT hardcode pricing anywhere else in the codebase.
// All pricing decisions must flow through this file.

export type SurchargeType = "flat" | "percentage";

export interface Surcharge {
  id: string;
  label: string;
  type: SurchargeType;
  value: number;
  description: string;
}

export interface PromoCode {
  code: string;
  type: SurchargeType;
  value: number;
  description: string;
  expiresAt?: string;
  usageLimit?: number;
}

// ── Transport pricing ──────────────────────────────────────────────────────

export const PICKUP_FEE = {
  baseNgn: 600,
  perKmNgn: 50,
  maxNgn: 2000,
  freeRadiusKm: 3,
} as const;

export const DELIVERY_FEE = {
  baseNgn: 1500,
  perKmNgn: 75,
  maxNgn: 3500,
  freeRadiusKm: 3,
} as const;

// ── Surcharges ─────────────────────────────────────────────────────────────

export const SURCHARGES: Record<string, Surcharge> = {
  whiteGarment: {
    id: "white-garment",
    label: "White Garment",
    type: "percentage",
    value: 20,
    description: "Extra care for white and very light-coloured garments (+20%)",
  },
  corsetStonework: {
    id: "corset-stonework",
    label: "Corset / Stonework",
    type: "percentage",
    value: 30,
    description: "Garments with beading, stonework, or corset structure (+30%)",
  },
  sameDay: {
    id: "same-day",
    label: "Same-Day",
    type: "percentage",
    value: 50,
    description: "Turnaround within the same business day (+50%) — subject to availability",
  },
  nextDay: {
    id: "next-day",
    label: "Next-Day",
    type: "percentage",
    value: 25,
    description: "Turnaround by the following business day (+25%)",
  },
  fortyEightHour: {
    id: "48-hour",
    label: "48-Hour",
    type: "percentage",
    value: 15,
    description: "Guaranteed turnaround within 48 hours (+15%)",
  },
  afterHours: {
    id: "after-hours",
    label: "After-Hours",
    type: "flat",
    value: 500,
    description: "Pickup or delivery outside operating hours (+₦500 flat)",
  },
  holiday: {
    id: "holiday",
    label: "Holiday",
    type: "percentage",
    value: 25,
    description: "Service on public holidays (+25%)",
  },
};

// ── Deposit ────────────────────────────────────────────────────────────────

export const DEPOSIT_RULES = {
  percentageOfTotal: 30,
  minimumNgn: 1000,
  description:
    "30% of order total (minimum ₦1,000) is required before pickup is scheduled.",
} as const;

// ── Storage ────────────────────────────────────────────────────────────────

export const STORAGE_RULES = {
  freeStorageDays: 3,
  dailyFeeNgn: 200,
  maxStorageDays: 14,
  description:
    "First 3 days free. ₦200/day thereafter. Maximum 14 days — after which management decides disposition.",
} as const;

// ── Promo codes ────────────────────────────────────────────────────────────
//
// In production, promo codes should be stored in the Supabase `promo_codes`
// table and fetched at runtime. This static list is for pre-launch testing
// only — all codes are inactive by default.
//
// See: TASK-PAY-02 in laundry-link-v1-backlog.md

export const PROMO_CODES: PromoCode[] = [
  // Add real promo codes here or seed from database
];

// ── Calculation helpers ────────────────────────────────────────────────────

export function calculateSurcharge(
  baseAmount: number,
  surcharge: Surcharge,
): number {
  if (surcharge.type === "flat") return surcharge.value;
  return Math.round((baseAmount * surcharge.value) / 100);
}

export function calculateDeposit(totalNgn: number): number {
  const computed = Math.round((totalNgn * DEPOSIT_RULES.percentageOfTotal) / 100);
  return Math.max(computed, DEPOSIT_RULES.minimumNgn);
}

export function calculateBalanceDue(totalNgn: number): number {
  return totalNgn - calculateDeposit(totalNgn);
}

export function calculateStorageFee(daysStored: number): number {
  const billableDays = Math.max(0, daysStored - STORAGE_RULES.freeStorageDays);
  return billableDays * STORAGE_RULES.dailyFeeNgn;
}

export function applyPromoCode(
  totalNgn: number,
  code: string,
): { discount: number; valid: boolean; message: string } {
  const promo = PROMO_CODES.find(
    (p) => p.code.toUpperCase() === code.trim().toUpperCase(),
  );
  if (!promo) return { discount: 0, valid: false, message: "Invalid promo code." };
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    return { discount: 0, valid: false, message: "This promo code has expired." };
  }
  const discount = calculateSurcharge(totalNgn, {
    id: promo.code,
    label: promo.code,
    type: promo.type,
    value: promo.value,
    description: promo.description,
  });
  return { discount, valid: true, message: promo.description };
}
