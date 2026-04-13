import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { DEFAULT_BUSINESS_ID, DEFAULT_BUSINESS_NAME } from "@/constants/services";
import { CreateOrderInput, Order, OrderStatus, OrderStatusHistory, UserRole } from "@/types";

const STORAGE_KEY = "laundry_link_orders";
const HISTORY_KEY = "laundry_link_order_history";

interface OrdersContextType {
  orders: Order[];
  history: OrderStatusHistory[];
  isLoading: boolean;
  refreshOrders: () => Promise<void>;
  createOrder: (input: CreateOrderInput) => Promise<{ error: string | null; orderId?: string }>;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => Promise<{ error: string | null }>;
  assignDispatcher: (orderId: string, dispatcherId: string, dispatcherName: string) => Promise<{ error: string | null }>;
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
    pickupAddress: row.pickup_address ?? row.pickupAddress,
    deliveryAddress: row.delivery_address ?? row.deliveryAddress,
    specialRequests: row.special_requests ?? row.specialRequests,
    urgent: Boolean(row.urgent),
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

async function readLocalOrders() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Order[]) : [];
}

async function writeLocalOrders(orders: Order[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

async function readLocalHistory() {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  return raw ? (JSON.parse(raw) as OrderStatusHistory[]) : [];
}

async function writeLocalHistory(history: OrderStatusHistory[]) {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function filterOrdersForRole(allOrders: Order[], role: UserRole | null, userId?: string) {
  if (role === "CUSTOMER") return allOrders.filter((order) => order.customerId === userId);
  if (role === "BUSINESS") return allOrders.filter((order) => order.businessId === DEFAULT_BUSINESS_ID);
  if (role === "DISPATCHER") return allOrders.filter((order) => !!order.dispatcherId || !!order.assignedDriverName || order.dispatcherId === userId);
  return allOrders;
}

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const { user, role, isDemo } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [history, setHistory] = useState<OrderStatusHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setHistory([]);
      return;
    }

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
          const ids = mapped.map((order) => order.id);
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

      const localOrders = await readLocalOrders();
      const localHistory = await readLocalHistory();
      setOrders(filterOrdersForRole(localOrders, role, user.id));
      setHistory(localHistory);
    } finally {
      setIsLoading(false);
    }
  }, [user, role, isDemo]);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  useEffect(() => {
    if (!isSupabaseConfigured || isDemo || !user) return;
    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        refreshOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
            status: order.status,
            special_requests: order.specialRequests,
            urgent: order.urgent,
          })
          .select("*")
          .single();

        if (!error && data) {
          const created = mapOrder(data);
          await supabase.from("order_items").insert(
            created.items.map((item) => ({
              order_id: created.id,
              service_name: item.serviceName,
              quantity: item.quantity,
              price_per_unit: item.pricePerUnit,
              total: item.total,
            })),
          );
          await supabase.from("order_status_history").insert({
            order_id: created.id,
            status: "PENDING",
            changed_by: user.id,
            note: "Order placed by customer",
          });
          await refreshOrders();
          return { error: null, orderId: created.id };
        }
      }

      const localOrders = await readLocalOrders();
      const localHistory = await readLocalHistory();
      await writeLocalOrders([order, ...localOrders]);
      await writeLocalHistory([...localHistory, firstHistory]);
      await refreshOrders();
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
        note,
        createdAt: now,
      };

      if (isSupabaseConfigured && !isDemo) {
        const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
        if (!error) {
          await supabase.from("order_status_history").insert({
            order_id: orderId,
            status,
            changed_by: user.id,
            note,
          });
          await refreshOrders();
          return { error: null };
        }
      }

      const localOrders = await readLocalOrders();
      const updated = localOrders.map((order) =>
        order.id === orderId ? { ...order, status, updatedAt: now } : order,
      );
      const localHistory = await readLocalHistory();
      await writeLocalOrders(updated);
      await writeLocalHistory([...localHistory, nextHistory]);
      await refreshOrders();
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
          return { error: null };
        }
      }

      const localOrders = await readLocalOrders();
      const source = localOrders.length > 0 ? localOrders : orders;
      const updated = source.map((order) =>
        order.id === orderId
          ? { ...order, dispatcherId, assignedDriverName: dispatcherName, updatedAt: new Date().toISOString() }
          : order,
      );
      await writeLocalOrders(updated);
      await refreshOrders();
      return { error: null };
    },
    [user, isDemo, refreshOrders, orders],
  );

  const getOrderById = useCallback(
    (orderId: string) => orders.find((order) => order.id === orderId),
    [orders],
  );

  const getHistoryForOrder = useCallback(
    (orderId: string) => history.filter((item) => item.orderId === orderId),
    [history],
  );

  const value = useMemo(
    () => ({ orders, history, isLoading, refreshOrders, createOrder, updateOrderStatus, assignDispatcher, getOrderById, getHistoryForOrder }),
    [orders, history, isLoading, refreshOrders, createOrder, updateOrderStatus, assignDispatcher, getOrderById, getHistoryForOrder],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}
