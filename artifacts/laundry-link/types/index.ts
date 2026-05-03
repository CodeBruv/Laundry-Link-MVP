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

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: OrderStatus;
  changedBy?: string;
  note?: string;
  createdAt: string;
}

export interface CreateOrderInput {
  pickupAddress: string;
  deliveryAddress: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee: number;
  specialRequests?: string;
  urgent?: boolean;
}
