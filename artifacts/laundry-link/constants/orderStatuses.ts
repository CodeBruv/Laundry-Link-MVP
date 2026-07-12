import { OrderStatus } from "@/types";

// ── Production order lifecycle ─────────────────────────────────────────────
//
// PurePress Laundry operates a 17-step lifecycle. Each status has defined
// visibility rules (customer / staff / dispatcher) so that the UI surfaces
// only relevant steps to each role.
//
// LEGACY_STATUS_MAP provides backward compatibility with existing Supabase
// rows that were created using the original 9-status schema.

export type ProductionOrderStatus = Extract<
  OrderStatus,
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
  | "CANCELLED"
>;

export interface OrderStatusConfig {
  key: ProductionOrderStatus;
  label: string;
  sortOrder: number;
  visibleToCustomer: boolean;
  visibleToStaff: boolean;
  visibleToDispatcher: boolean;
  isTerminal: boolean;
  trackTimestamp: boolean;
  description: string;
}

export const ORDER_STATUS_CONFIG: Record<ProductionOrderStatus, OrderStatusConfig> = {
  DRAFT: {
    key: "DRAFT",
    label: "Draft",
    sortOrder: 1,
    visibleToCustomer: true,
    visibleToStaff: true,
    visibleToDispatcher: false,
    isTerminal: false,
    trackTimestamp: true,
    description: "Order created — awaiting deposit payment",
  },
  DEPOSIT_PAID: {
    key: "DEPOSIT_PAID",
    label: "Deposit Paid",
    sortOrder: 2,
    visibleToCustomer: true,
    visibleToStaff: true,
    visibleToDispatcher: false,
    isTerminal: false,
    trackTimestamp: true,
    description: "Deposit received — pickup can be scheduled",
  },
  PICKUP_ASSIGNED: {
    key: "PICKUP_ASSIGNED",
    label: "Pickup Assigned",
    sortOrder: 3,
    visibleToCustomer: true,
    visibleToStaff: true,
    visibleToDispatcher: true,
    isTerminal: false,
    trackTimestamp: true,
    description: "Dispatcher assigned for pickup",
  },
  PICKUP_COMPLETED: {
    key: "PICKUP_COMPLETED",
    label: "Pickup Completed",
    sortOrder: 4,
    visibleToCustomer: true,
    visibleToStaff: true,
    visibleToDispatcher: true,
    isTerminal: false,
    trackTimestamp: true,
    description: "Items collected from customer",
  },
  RECEIVED_AT_LAUNDRY: {
    key: "RECEIVED_AT_LAUNDRY",
    label: "Received at Laundry",
    sortOrder: 5,
    visibleToCustomer: true,
    visibleToStaff: true,
    visibleToDispatcher: false,
    isTerminal: false,
    trackTimestamp: true,
    description: "Items logged into laundry facility",
  },
  SORTING: {
    key: "SORTING",
    label: "Sorting",
    sortOrder: 6,
    visibleToCustomer: false,
    visibleToStaff: true,
    visibleToDispatcher: false,
    isTerminal: false,
    trackTimestamp: true,
    description: "Items sorted by type and colour",
  },
  WASHING: {
    key: "WASHING",
    label: "Washing",
    sortOrder: 7,
    visibleToCustomer: true,
    visibleToStaff: true,
    visibleToDispatcher: false,
    isTerminal: false,
    trackTimestamp: true,
    description: "Items in washing cycle",
  },
  DRYING: {
    key: "DRYING",
    label: "Drying",
    sortOrder: 8,
    visibleToCustomer: false,
    visibleToStaff: true,
    visibleToDispatcher: false,
    isTerminal: false,
    trackTimestamp: true,
    description: "Items in drying cycle",
  },
  IRONING: {
    key: "IRONING",
    label: "Ironing",
    sortOrder: 9,
    visibleToCustomer: false,
    visibleToStaff: true,
    visibleToDispatcher: false,
    isTerminal: false,
    trackTimestamp: true,
    description: "Items being pressed and ironed",
  },
  QUALITY_CHECK: {
    key: "QUALITY_CHECK",
    label: "Quality Check",
    sortOrder: 10,
    visibleToCustomer: false,
    visibleToStaff: true,
    visibleToDispatcher: false,
    isTerminal: false,
    trackTimestamp: true,
    description: "Final quality inspection before packaging",
  },
  PACKAGING: {
    key: "PACKAGING",
    label: "Packaging",
    sortOrder: 11,
    visibleToCustomer: false,
    visibleToStaff: true,
    visibleToDispatcher: false,
    isTerminal: false,
    trackTimestamp: true,
    description: "Items packaged for collection or delivery",
  },
  SHELF_LOCATION: {
    key: "SHELF_LOCATION",
    label: "Shelf Location",
    sortOrder: 12,
    visibleToCustomer: false,
    visibleToStaff: true,
    visibleToDispatcher: false,
    isTerminal: false,
    trackTimestamp: true,
    description: "Items stored on shelf — awaiting balance payment or delivery dispatch",
  },
  READY_FOR_DELIVERY: {
    key: "READY_FOR_DELIVERY",
    label: "Ready for Delivery",
    sortOrder: 13,
    visibleToCustomer: true,
    visibleToStaff: true,
    visibleToDispatcher: true,
    isTerminal: false,
    trackTimestamp: true,
    description: "Items ready — customer notified to arrange balance and delivery",
  },
  BALANCE_PAID: {
    key: "BALANCE_PAID",
    label: "Balance Paid",
    sortOrder: 14,
    visibleToCustomer: true,
    visibleToStaff: true,
    visibleToDispatcher: false,
    isTerminal: false,
    trackTimestamp: true,
    description: "Remaining balance confirmed — delivery dispatcher can be assigned",
  },
  DELIVERY_ASSIGNED: {
    key: "DELIVERY_ASSIGNED",
    label: "Delivery Assigned",
    sortOrder: 15,
    visibleToCustomer: true,
    visibleToStaff: true,
    visibleToDispatcher: true,
    isTerminal: false,
    trackTimestamp: true,
    description: "Dispatcher assigned for delivery",
  },
  DELIVERED: {
    key: "DELIVERED",
    label: "Delivered",
    sortOrder: 16,
    visibleToCustomer: true,
    visibleToStaff: true,
    visibleToDispatcher: true,
    isTerminal: false,
    trackTimestamp: true,
    description: "Items delivered to customer — awaiting completion confirmation",
  },
  COMPLETED: {
    key: "COMPLETED",
    label: "Completed",
    sortOrder: 17,
    visibleToCustomer: true,
    visibleToStaff: true,
    visibleToDispatcher: false,
    isTerminal: true,
    trackTimestamp: true,
    description: "Order fully completed and confirmed",
  },
  CANCELLED: {
    key: "CANCELLED",
    label: "Cancelled",
    sortOrder: 18,
    visibleToCustomer: true,
    visibleToStaff: true,
    visibleToDispatcher: false,
    isTerminal: true,
    trackTimestamp: true,
    description: "Order cancelled",
  },
};

/** Ordered sequence of non-terminal production statuses (excluding CANCELLED). */
export const PRODUCTION_STATUS_FLOW: ProductionOrderStatus[] = [
  "DRAFT",
  "DEPOSIT_PAID",
  "PICKUP_ASSIGNED",
  "PICKUP_COMPLETED",
  "RECEIVED_AT_LAUNDRY",
  "SORTING",
  "WASHING",
  "DRYING",
  "IRONING",
  "QUALITY_CHECK",
  "PACKAGING",
  "SHELF_LOCATION",
  "READY_FOR_DELIVERY",
  "BALANCE_PAID",
  "DELIVERY_ASSIGNED",
  "DELIVERED",
  "COMPLETED",
];

/**
 * Maps legacy statuses (original 9-status schema) to the nearest
 * equivalent production status. Used when reading old Supabase rows.
 */
export const LEGACY_STATUS_MAP: Partial<Record<string, ProductionOrderStatus>> = {
  PENDING: "DRAFT",
  ACCEPTED: "DEPOSIT_PAID",
  PICKED_UP: "PICKUP_COMPLETED",
  IN_PROGRESS: "WASHING",
  READY: "READY_FOR_DELIVERY",
  PAID: "BALANCE_PAID",
  OUT_FOR_DELIVERY: "DELIVERY_ASSIGNED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
};

// ── Helpers ────────────────────────────────────────────────────────────────

export function getStatusConfig(status: string): OrderStatusConfig | undefined {
  const resolved = LEGACY_STATUS_MAP[status] ?? status;
  return ORDER_STATUS_CONFIG[resolved as ProductionOrderStatus];
}

export function getStatusLabel(status: string): string {
  return getStatusConfig(status)?.label ?? status.replace(/_/g, " ");
}

export function getNextStatus(
  current: ProductionOrderStatus,
): ProductionOrderStatus | null {
  const idx = PRODUCTION_STATUS_FLOW.indexOf(current);
  if (idx < 0 || idx >= PRODUCTION_STATUS_FLOW.length - 1) return null;
  return PRODUCTION_STATUS_FLOW[idx + 1];
}

export function getVisibleStatuses(
  role: "customer" | "staff" | "dispatcher",
): OrderStatusConfig[] {
  return Object.values(ORDER_STATUS_CONFIG)
    .filter((s) => {
      if (role === "customer") return s.visibleToCustomer;
      if (role === "dispatcher") return s.visibleToDispatcher;
      return s.visibleToStaff;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function resolveStatus(raw: string): ProductionOrderStatus {
  return (LEGACY_STATUS_MAP[raw] ?? raw) as ProductionOrderStatus;
}
