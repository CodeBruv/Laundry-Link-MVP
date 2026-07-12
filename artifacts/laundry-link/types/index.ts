export type UserRole = "CUSTOMER" | "BUSINESS" | "DISPATCHER" | "ADMIN";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
}

/**
 * OrderStatus — unified type covering both the legacy 9-status set
 * (backward-compatible with existing Supabase rows) and the full
 * PurePress 17-step production workflow.
 *
 * Legacy statuses (from original schema):
 *   PENDING → maps to DRAFT
 *   ACCEPTED → maps to DEPOSIT_PAID
 *   PICKED_UP → maps to PICKUP_COMPLETED
 *   IN_PROGRESS → maps to WASHING
 *   READY → maps to READY_FOR_DELIVERY
 *   PAID → maps to BALANCE_PAID
 *   OUT_FOR_DELIVERY → maps to DELIVERY_ASSIGNED
 *   DELIVERED, CANCELLED → kept as-is
 *
 * See: constants/orderStatuses.ts for the full status config and
 *      LEGACY_STATUS_MAP for the migration mapping.
 */
export type OrderStatus =
  // ── Legacy (backward compat — do not use for new orders) ─────────────
  | "PENDING"
  | "ACCEPTED"
  | "PICKED_UP"
  | "IN_PROGRESS"
  | "READY"
  | "PAID"
  | "OUT_FOR_DELIVERY"
  // ── PurePress production workflow ─────────────────────────────────────
  | "DRAFT"
  | "DEPOSIT_PAID"
  | "PICKUP_ASSIGNED"
  | "PICKUP_COMPLETED"
  | "RECEIVED_AT_LAUNDRY"
  | "SORTING"
  | "WASHING"
  | "DRYING"
  | "IRONING"
  | "QUALITY_CHECK"
  | "PACKAGING"
  | "SHELF_LOCATION"
  | "READY_FOR_DELIVERY"
  | "BALANCE_PAID"
  | "DELIVERY_ASSIGNED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  businessId: string;
  businessName: string;
  dispatcherId?: string;
  assignedDriverName?: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee: number;
  pickupAddress: string;
  deliveryAddress: string;
  specialRequests?: string;
  urgent?: boolean;
  driverLatitude?: number;
  driverLongitude?: number;
  isDriverLocationShared?: boolean;
  paystackRef?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  serviceName: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
}

export interface Business {
  id: string;
  userId: string;
  name: string;
  address: string;
  phone: string;
  description?: string;
  logoUrl?: string;
  isVerified: boolean;
  subscriptionTier?: "STARTER" | "PRO" | "ENTERPRISE";
  createdAt: string;
}

export interface LaundryService {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  pricePerUnit: number;
  unit: string;
  isActive: boolean;
  category?: string;
}

export type SubscriptionTier = "STARTER" | "PRO" | "ENTERPRISE";

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  monthlyPrice: number;
  features: string[];
  recommended?: boolean;
  maxOrders: number;
  maxDispatchers: number;
}

export interface SubscriptionState {
  tier: SubscriptionTier | null;
  active: boolean;
  isTrial: boolean;
  trialExpiresAt: string | null;
  subscribedAt: string | null;
  expiresAt: string | null;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: OrderStatus;
  changedBy?: string;
  note?: string;
  createdAt: string;
}

export interface CreateOrderInput {
  businessId?: string;
  businessName?: string;
  pickupAddress: string;
  deliveryAddress: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee: number;
  specialRequests?: string;
  urgent?: boolean;
}
