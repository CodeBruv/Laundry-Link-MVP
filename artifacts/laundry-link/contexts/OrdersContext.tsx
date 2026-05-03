import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/contexts/AuthContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { sendLocalNotification } from "@/lib/notifications";
import { DEFAULT_BUSINESS_ID, DEFAULT_BUSINESS_NAME } from "@/constants/services";
import {
  CreateOrderInput,
  Order,
  OrderStatus,
  OrderStatusHistory,
  UserRole,
} from "@/types";

const STORAGE_KEY = "laundry_link_orders_v4";
const HISTORY_KEY = "laundry_link_order_history_v4";
const DELIVERY_FEE = 1500;

interface OrdersContextType {
  orders: Order[];
  history: OrderStatusHistory[];
  isLoading: boolean;
  refreshOrders: () => Promise<void>;
  createOrder: (input: CreateOrderInput) => Promise<{ error: string | null; orderId?: string }>;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => Promise<{ error: string | null }>;
  assignDispatcher: (orderId: string, dispatcherId: string, dispatcherName: string) => Promise<{ error: string | null }>;
  updateDriverLocation: (orderId: string, lat: number, lng: number, sharing: boolean) => Promise<void>;
  markOrderPaid: (orderId: string, reference: string) => Promise<{ error: string | null }>;
  getOrderById: (orderId: string) => Order | undefined;
  getHistoryForOrder: (orderId: string) => OrderStatusHistory[];
}

const OrdersContext = createContext<OrdersContextType>({
  orders: [],
  history: [],
  isLoading: false,
  refreshOrders: async () => {},
  createOrder: async () => ({ error: null }),
  updateOrderStatus: async () => ({ error: null }),
  assignDispatcher: async () => ({ error: null }),
  updateDriverLocation: async () => {},
  markOrderPaid: async () => ({ error: null }),
  getOrderById: () => undefined,
  getHistoryForOrder: () => [],
});

export function useOrders() {
  return useContext(OrdersContext);
}

function makeId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function mapOrder(row: any): Order {
  return {
    id: row.id,
    orderNumber: row.order_number ?? row.orderNumber,
    customerId: row.customer_id ?? row.customerId,
    customerName: row.customer_name ?? row.customerName,
    customerEmail: row.customer_email ?? row.customerEmail,
    businessId: row.business_id ?? row.businessId ?? DEFAULT_BUSINESS_ID,
    businessName: row.business_name ?? row.businessName ?? DEFAULT_BUSINESS_NAME,
    dispatcherId: row.assigned_driver_id ?? row.dispatcherId,
    assignedDriverName: row.assigned_driver_name ?? row.assignedDriverName,
    status: row.status,
    items: row.items ?? [],
    totalAmount: Number(row.total_amount ?? row.totalAmount ?? 0),
    deliveryFee: Number(row.delivery_fee ?? row.deliveryFee ?? DELIVERY_FEE),
    pickupAddress: row.pickup_address ?? row.pickupAddress,
    deliveryAddress: row.delivery_address ?? row.deliveryAddress,
    specialRequests: row.special_requests ?? row.specialRequests,
    urgent: Boolean(row.urgent),
    driverLatitude: row.driver_lat ?? row.driverLatitude,
    driverLongitude: row.driver_lng ?? row.driverLongitude,
    isDriverLocationShared: Boolean(row.is_driver_location_shared ?? row.isDriverLocationShared),
    paystackRef: row.paystack_ref ?? row.paystackRef,
    paidAt: row.paid_at ?? row.paidAt,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  };
}

function mapHistory(row: any): OrderStatusHistory {
  return {
    id: row.id,
    orderId: row.order_id ?? row.orderId,
    status: row.status,
    changedBy: row.changed_by ?? row.changedBy,
    note: row.note,
    createdAt: row.created_at ?? row.createdAt,
  };
}

async function readLocalOrders(): Promise<Order[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Order[]) : [];
}

async function writeLocalOrders(orders: Order[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

async function readLocalHistory(): Promise<OrderStatusHistory[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  return raw ? (JSON.parse(raw) as OrderStatusHistory[]) : [];
}

async function writeLocalHistory(history: OrderStatusHistory[]) {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function filterOrdersForRole(allOrders: Order[], role: UserRole | null, userId?: string) {
  if (role === "CUSTOMER") return allOrders.filter((o) => o.customerId === userId);
  if (role === "BUSINESS") return allOrders.filter((o) => o.businessId === DEFAULT_BUSINESS_ID);
  if (role === "DISPATCHER") return allOrders.filter((o) => !!o.assignedDriverName);
  return allOrders;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  PICKED_UP: "Picked Up",
  IN_PROGRESS: "In Progress",
  READY: "Ready for Delivery",
  PAID: "Payment Received",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const { user, role, isDemo } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [history, setHistory] = useState<OrderStatusHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshOrders = useCallback(async () => {
    if (!user) { setOrders([]); setHistory([]); return; }
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && !isDemo) {
        let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
        if (role === "CUSTOMER") query = query.eq("customer_id", user.id);
        if (role === "BUSINESS") query = query.eq("business_id", DEFAULT_BUSINESS_ID);
        if (role === "DISPATCHER") query = query.not("assigned_driver_id", "is", null);

        const { data, error } = await query;
        if (!error && data) {
          const mapped = data.map(mapOrder);
          setOrders(mapped);
          const ids = mapped.map((o) => o.id);
          if (ids.length > 0) {
            const { data: historyRows } = await supabase
              .from("order_status_history")
              .select("*")
              .in("order_id", ids)
              .order("created_at", { ascending: true });
            setHistory((historyRows ?? []).map(mapHistory));
          } else {
            setHistory([]);
          }
          setIsLoading(false);
          return;
        }
      }
      // Local fallback
      const local = await readLocalOrders();
      const localH = await readLocalHistory();
      setOrders(filterOrdersForRole(local, role, user.id));
      setHistory(localH);
    } finally {
      setIsLoading(false);
    }
  }, [user, role, isDemo]);

  useEffect(() => { refreshOrders(); }, [refreshOrders]);

  // Supabase realtime
  useEffect(() => {
    if (!isSupabaseConfigured || isDemo || !user) return;
    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => { refreshOrders(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, isDemo, refreshOrders]);

  const createOrder = useCallback(
    async (input: CreateOrderInput) => {
      if (!user) return { error: "You must be signed in to place an order." };

      const now = new Date().toISOString();
      const orderNumber = `LL-${Date.now().toString().slice(-6)}`;
      const order: Order = {
        id: makeId(),
        orderNumber,
        customerId: user.id,
        customerName: user.user_metadata?.full_name || user.email || "Customer",
        customerEmail: user.email ?? "",
        businessId: DEFAULT_BUSINESS_ID,
        businessName: DEFAULT_BUSINESS_NAME,
        status: "PENDING",
        items: input.items,
        totalAmount: input.totalAmount,
        deliveryFee: input.deliveryFee ?? DELIVERY_FEE,
        pickupAddress: input.pickupAddress,
        deliveryAddress: input.deliveryAddress,
        specialRequests: input.specialRequests,
        urgent: input.urgent,
        createdAt: now,
        updatedAt: now,
      };
      const firstHistory: OrderStatusHistory = {
        id: makeId(),
        orderId: order.id,
        status: "PENDING",
        changedBy: user.id,
        note: "Order placed by customer",
        createdAt: now,
      };

      if (isSupabaseConfigured && !isDemo) {
        const { data, error } = await supabase
          .from("orders")
          .insert({
            order_number: order.orderNumber,
            customer_id: order.customerId,
            customer_name: order.customerName,
            customer_email: order.customerEmail,
            business_id: order.businessId,
            business_name: order.businessName,
            pickup_address: order.pickupAddress,
            delivery_address: order.deliveryAddress,
            items: order.items,
            total_amount: order.totalAmount,
            delivery_fee: order.deliveryFee,
            status: order.status,
            special_requests: order.specialRequests,
            urgent: order.urgent,
          })
          .select("*")
          .single();

        if (!error && data) {
          const created = mapOrder(data);
          await supabase.from("order_status_history").insert({
            order_id: created.id,
            status: "PENDING",
            changed_by: user.id,
            note: "Order placed by customer",
          });
          await refreshOrders();
          sendLocalNotification("Order Placed!", `Order #${created.orderNumber} placed successfully.`);
          return { error: null, orderId: created.id };
        }
      }

      // Local fallback
      const local = await readLocalOrders();
      const localH = await readLocalHistory();
      await writeLocalOrders([order, ...local]);
      await writeLocalHistory([...localH, firstHistory]);
      await refreshOrders();
      sendLocalNotification("Order Placed!", `Your order #${order.orderNumber} has been placed.`);
      return { error: null, orderId: order.id };
    },
    [user, isDemo, refreshOrders],
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus, note?: string) => {
      if (!user) return { error: "You must be signed in." };
      const now = new Date().toISOString();
      const nextHistory: OrderStatusHistory = {
        id: makeId(),
        orderId,
        status,
        changedBy: user.id,
        note: note ?? `Status updated to ${STATUS_LABELS[status]}`,
        createdAt: now,
      };

      if (isSupabaseConfigured && !isDemo) {
        const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
        if (!error) {
          await supabase.from("order_status_history").insert({
            order_id: orderId,
            status,
            changed_by: user.id,
            note: nextHistory.note,
          });
          await refreshOrders();
          sendLocalNotification("Order Updated", `Order is now: ${STATUS_LABELS[status]}`);
          return { error: null };
        }
      }

      const local = await readLocalOrders();
      const updated = local.map((o) => o.id === orderId ? { ...o, status, updatedAt: now } : o);
      const localH = await readLocalHistory();
      await writeLocalOrders(updated);
      await writeLocalHistory([...localH, nextHistory]);
      await refreshOrders();
      sendLocalNotification("Order Updated", `Order is now: ${STATUS_LABELS[status]}`);
      return { error: null };
    },
    [user, isDemo, refreshOrders],
  );

  const markOrderPaid = useCallback(
    async (orderId: string, reference: string) => {
      if (!user) return { error: "You must be signed in." };
      const now = new Date().toISOString();
      const historyEntry: OrderStatusHistory = {
        id: makeId(),
        orderId,
        status: "PAID",
        changedBy: user.id,
        note: `Payment confirmed — ref: ${reference}`,
        createdAt: now,
      };

      if (isSupabaseConfigured && !isDemo) {
        const { error } = await supabase
          .from("orders")
          .update({ status: "PAID", paystack_ref: reference, paid_at: now })
          .eq("id", orderId);
        if (!error) {
          await supabase.from("order_status_history").insert({
            order_id: orderId,
            status: "PAID",
            changed_by: user.id,
            note: historyEntry.note,
          });
          await refreshOrders();
          sendLocalNotification("Payment Received!", "Your payment was successful. The laundromat has been notified.");
          return { error: null };
        }
      }

      const local = await readLocalOrders();
      const updated = local.map((o) =>
        o.id === orderId
          ? { ...o, status: "PAID" as OrderStatus, paystackRef: reference, paidAt: now, updatedAt: now }
          : o,
      );
      const localH = await readLocalHistory();
      await writeLocalOrders(updated);
      await writeLocalHistory([...localH, historyEntry]);
      await refreshOrders();
      sendLocalNotification("Payment Received!", "Your payment was successful.");
      return { error: null };
    },
    [user, isDemo, refreshOrders],
  );

  const assignDispatcher = useCallback(
    async (orderId: string, dispatcherId: string, dispatcherName: string) => {
      if (!user) return { error: "You must be signed in." };

      if (isSupabaseConfigured && !isDemo) {
        const { error } = await supabase
          .from("orders")
          .update({ assigned_driver_id: dispatcherId, assigned_driver_name: dispatcherName })
          .eq("id", orderId);
        if (!error) {
          await refreshOrders();
          sendLocalNotification("Dispatcher Assigned", `${dispatcherName} has been assigned.`);
          return { error: null };
        }
      }

      const local = await readLocalOrders();
      const source = local.length > 0 ? local : orders;
      const updated = source.map((o) =>
        o.id === orderId
          ? { ...o, dispatcherId, assignedDriverName: dispatcherName, updatedAt: new Date().toISOString() }
          : o,
      );
      await writeLocalOrders(updated);
      await refreshOrders();
      sendLocalNotification("Dispatcher Assigned", `${dispatcherName} has been assigned.`);
      return { error: null };
    },
    [user, isDemo, refreshOrders, orders],
  );

  const updateDriverLocation = useCallback(
    async (orderId: string, lat: number, lng: number, sharing: boolean) => {
      if (isSupabaseConfigured && !isDemo) {
        await supabase
          .from("orders")
          .update({ driver_lat: lat, driver_lng: lng, is_driver_location_shared: sharing })
          .eq("id", orderId);
        await refreshOrders();
        return;
      }
      const local = await readLocalOrders();
      const updated = local.map((o) =>
        o.id === orderId
          ? { ...o, driverLatitude: lat, driverLongitude: lng, isDriverLocationShared: sharing, updatedAt: new Date().toISOString() }
          : o,
      );
      await writeLocalOrders(updated);
      await refreshOrders();
    },
    [isDemo, refreshOrders],
  );

  const getOrderById = useCallback((orderId: string) => orders.find((o) => o.id === orderId), [orders]);
  const getHistoryForOrder = useCallback((orderId: string) => history.filter((h) => h.orderId === orderId), [history]);

  const value = useMemo(
    () => ({
      orders, history, isLoading, refreshOrders, createOrder, updateOrderStatus,
      assignDispatcher, updateDriverLocation, markOrderPaid, getOrderById, getHistoryForOrder,
    }),
    [orders, history, isLoading, refreshOrders, createOrder, updateOrderStatus,
      assignDispatcher, updateDriverLocation, markOrderPaid, getOrderById, getHistoryForOrder],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}
