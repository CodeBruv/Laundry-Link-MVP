// ── PurePress Laundry — Business Settings ─────────────────────────────────
//
// Centralised operational configuration. Do not scatter these values
// across screens or context files.
//
// Values that must change before production go-live are marked with TODO.

// ── Operating hours ────────────────────────────────────────────────────────

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface DaySchedule {
  isOpen: boolean;
  open: string;  // "HH:MM" 24-hour
  close: string; // "HH:MM" 24-hour
}

export const OPERATING_HOURS: Record<DayOfWeek, DaySchedule> = {
  monday:    { isOpen: true,  open: "09:00", close: "17:00" },
  tuesday:   { isOpen: true,  open: "09:00", close: "17:00" },
  wednesday: { isOpen: true,  open: "09:00", close: "17:00" },
  thursday:  { isOpen: true,  open: "09:00", close: "17:00" },
  friday:    { isOpen: true,  open: "09:00", close: "17:00" },
  saturday:  { isOpen: true,  open: "09:00", close: "17:00" },
  sunday:    { isOpen: false, open: "09:00", close: "17:00" },
};

export const TIMEZONE = "Africa/Lagos";

export function isWithinOperatingHours(date: Date = new Date()): boolean {
  const day = date.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: TIMEZONE,
  }).toLowerCase() as DayOfWeek;
  const schedule = OPERATING_HOURS[day];
  if (!schedule.isOpen) return false;

  const timeStr = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIMEZONE,
  });
  return timeStr >= schedule.open && timeStr < schedule.close;
}

// ── Operations ─────────────────────────────────────────────────────────────

export const OPERATIONS = {
  serviceRadiusKm: 50,
  maxActiveOrdersPerDispatcher: 3,
  requireOtpOnPickup: false,
  requireOtpOnDelivery: false,
  otpValidityMinutes: 30,
  orderNumberPrefix: "PP",
} as const;

// ── Payment settings ───────────────────────────────────────────────────────

export const PAYMENT_SETTINGS = {
  depositPercentage: 30,
  depositMinimumNgn: 1000,
  acceptedMethods: ["bank_transfer", "paystack_card", "cash"] as const,
  bankName: "Access Bank",
  accountNumber: "0000000000", // TODO: replace with real PurePress account number
  accountName: "PurePress Laundry",
  paystackEnabled: false, // set to true when EXPO_PUBLIC_PAYSTACK_KEY is live
} as const;

// ── Cancellation policy ────────────────────────────────────────────────────

export const CANCELLATION_POLICY = {
  freeCancellationBeforePickup: true,
  cancellationWindowBeforePickupMinutes: 30,
  cancellationFeeAfterPickupNgn: 500,
  cancellationFeeAfterWashingNgn: 0, // full charge — already processed
  description:
    "Free cancellation up to 30 minutes before the assigned pickup time. " +
    "₦500 fee if cancelled after pickup. No refund once washing has started.",
} as const;

// ── Storage policy ─────────────────────────────────────────────────────────

export const STORAGE_POLICY = {
  freeStorageDays: 3,
  dailyFeeNgn: 200,
  maxStorageDays: 14,
  overdueAction: "notify_then_donate" as const,
  description:
    "First 3 days of storage are complimentary. " +
    "₦200/day applies from day 4. " +
    "Items uncollected after 14 days may be donated at management's discretion " +
    "after documented notification attempts.",
} as const;

// ── Compensation policy ────────────────────────────────────────────────────

export const COMPENSATION_POLICY = {
  policyReference: "PurePress Compensation Policy v1.0",
  maxCompensationPerItemNgn: 5000,
  requiresPhotoEvidence: true,
  claimWindowDays: 7,
  description:
    "Damage or loss claims must be submitted within 7 days of delivery " +
    "with photographic evidence. Maximum compensation is ₦5,000 per item.",
} as const;

// ── Notification preferences ───────────────────────────────────────────────

export const NOTIFICATION_PREFERENCES = {
  smsEnabled: false,
  emailEnabled: true,
  pushEnabled: true,
  channels: {
    statusChange: true,
    paymentConfirm: true,
    pickupAssigned: true,
    deliveryAssigned: true,
    readyForDelivery: true,
    delivered: true,
    orderCancelled: true,
    storageFeeWarning: true,
  },
} as const;

// ── Convenience export — full settings bundle ──────────────────────────────

export const BUSINESS_SETTINGS = {
  operatingHours: OPERATING_HOURS,
  timezone: TIMEZONE,
  operations: OPERATIONS,
  payment: PAYMENT_SETTINGS,
  cancellation: CANCELLATION_POLICY,
  storage: STORAGE_POLICY,
  compensation: COMPENSATION_POLICY,
  notifications: NOTIFICATION_PREFERENCES,
} as const;
