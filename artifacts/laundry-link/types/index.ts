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

export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PICKED_UP"
  | "IN_PROGRESS"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export interface Order {
  id: string;
  customerId: string;
  businessId: string;
  dispatcherId?: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  pickupAddress: string;
  deliveryAddress: string;
  notes?: string;
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
}

export type SubscriptionTier = "STARTER" | "PRO" | "ENTERPRISE";

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: number;
  features: string[];
  recommended?: boolean;
}
