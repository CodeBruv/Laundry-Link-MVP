import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useOrders } from "@/contexts/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { OrderStatus } from "@/types";

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#f59e0b", ACCEPTED: "#6366f1", PICKED_UP: "#3b82f6",
  IN_PROGRESS: "#8b5cf6", READY: "#10b981", PAID: "#059669",
  OUT_FOR_DELIVERY: "#0ea5e9", DELIVERED: "#10b981", CANCELLED: "#ef4444",
};

const STATUSES: OrderStatus[] = [
  "PENDING","ACCEPTED","PICKED_UP","IN_PROGRESS","READY","PAID","OUT_FOR_DELIVERY","DELIVERED","CANCELLED",
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending", ACCEPTED: "Accepted", PICKED_UP: "Picked Up",
  IN_PROGRESS: "In Progress", READY: "Ready", PAID: "Paid",
  OUT_FOR_DELIVERY: "Delivering", DELIVERED: "Delivered", CANCELLED: "Cancelled",
};

export default function AdminOrders() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders, isLoading, refreshOrders } = useOrders();
  const { isSuperAdmin } = useAdminAccess();

  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");

  const filtered = useMemo(() => {
    let list = [...orders];
    if (statusFilter !== "ALL") list = list.filter((o) => o.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.businessName.toLowerCase().includes(q) ||
          (isSuperAdmin && (o.customerEmail ?? "").toLowerCase().includes(q)),
      );
    }
    if (sortBy === "amount") list.sort((a, b) => b.totalAmount - a.totalAmount);
    else list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return list;
  }, [orders, statusFilter, search, sortBy, isSuperAdmin]);

  const totals = useMemo(() => ({
    count: filtered.length,
    revenue: filtered.filter((o) => o.paidAt).reduce((s, o) => s + o.totalAmount + o.deliveryFee, 0),
    active: filtered.filter((o) => !["DELIVERED","CANCELLED"].includes(o.status)).length,
  }), [filtered]);

  const shadow = { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100) }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshOrders} tintColor={colors.accent} />}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.pageTitle, { color: colors.foreground }]}>All Orders</Text>
            <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
              {totals.count} orders · {totals.active} active · ₦{totals.revenue.toLocaleString()} revenue
            </Text>
          </View>
          {/* Sort toggle */}
          <Pressable
            onPress={() => setSortBy((s) => s === "date" ? "amount" : "date")}
            style={[styles.sortBtn, { borderColor: colors.border }]}
          >
            <Feather name="sliders" size={14} color={colors.mutedForeground} />
            <Text style={[styles.sortText, { color: colors.mutedForeground }]}>
              {sortBy === "date" ? "Newest" : "Amount"}
            </Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={[styles.searchWrap, { borderColor: colors.input, borderRadius: colors.radius }]}>
          <Feather name="search" size={15} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={isSuperAdmin ? "Order #, customer, business, email…" : "Order #, customer, business…"}
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={15} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        {/* Status filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          <Pressable
            onPress={() => setStatusFilter("ALL")}
            style={[styles.chip, statusFilter === "ALL"
              ? { backgroundColor: colors.primary, borderColor: colors.primary }
              : { borderColor: colors.border }]}
          >
            <Text style={[styles.chipText, { color: statusFilter === "ALL" ? "#ffffff" : colors.mutedForeground }]}>
              All ({orders.length})
            </Text>
          </Pressable>
          {STATUSES.map((s) => {
            const count = orders.filter((o) => o.status === s).length;
            if (count === 0) return null;
            const active = statusFilter === s;
            return (
              <Pressable
                key={s}
                onPress={() => setStatusFilter(s)}
                style={[styles.chip, { borderColor: active ? STATUS_COLOR[s] : colors.border, backgroundColor: active ? STATUS_COLOR[s] + "14" : "transparent" }]}
              >
                <View style={[styles.chipDot, { backgroundColor: STATUS_COLOR[s] }]} />
                <Text style={[styles.chipText, { color: active ? STATUS_COLOR[s] : colors.mutedForeground }]}>
                  {STATUS_LABELS[s]} ({count})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Order list ──────────────────────────────────────── */}
      <View style={{ padding: 16, gap: 10 }}>
        {isLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            <Feather name="package" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Orders Found</Text>
            <Text style={[styles.emptyMsg, { color: colors.mutedForeground }]}>
              {search || statusFilter !== "ALL" ? "Try adjusting your filters." : "No orders on the platform yet."}
            </Text>
          </View>
        ) : (
          filtered.map((order) => {
            const statusColor = STATUS_COLOR[order.status] ?? colors.primary;
            return (
              <View
                key={order.id}
                style={[styles.orderCard, { backgroundColor: colors.card, borderRadius: colors.radius, borderLeftColor: statusColor }, shadow]}
              >
                {/* Top row */}
                <View style={styles.orderTop}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.orderNumRow}>
                      <Text style={[styles.orderNum, { color: colors.foreground }]}>#{order.orderNumber}</Text>
                      {order.urgent && (
                        <View style={styles.urgentBadge}>
                          <Text style={styles.urgentText}>URGENT</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.orderBiz, { color: colors.mutedForeground }]}>{order.businessName}</Text>
                  </View>
                  <View>
                    <Text style={[styles.orderAmt, { color: colors.accent }]}>₦{order.totalAmount.toLocaleString()}</Text>
                    <Text style={[styles.orderDate, { color: colors.mutedForeground }]}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {/* Status + customer */}
                <View style={[styles.orderMid, { borderTopColor: colors.border }]}>
                  <View style={styles.metaItem}>
                    <Feather name="user" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                      {order.customerName}
                      {isSuperAdmin && order.customerEmail ? ` · ${order.customerEmail}` : ""}
                    </Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: statusColor + "14" }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </Text>
                  </View>
                </View>

                {/* Address */}
                <View style={[styles.orderAddr, { borderTopColor: colors.border }]}>
                  <Feather name="map-pin" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.addrText, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {order.pickupAddress}
                  </Text>
                  {order.assignedDriverName && (
                    <View style={styles.driverChip}>
                      <Feather name="truck" size={11} color={colors.accent} />
                      <Text style={[styles.driverText, { color: colors.accent }]}>{order.assignedDriverName}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  pageTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 2 },
  pageSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  sortText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  chips: { flexGrow: 0 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8 },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  emptyCard: { alignItems: "center", padding: 48, gap: 12, margin: 4 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyMsg: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  orderCard: { borderLeftWidth: 3, overflow: "hidden" },
  orderTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 14, gap: 8 },
  orderNumRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  orderNum: { fontSize: 15, fontFamily: "Inter_700Bold" },
  urgentBadge: { backgroundColor: "#ef444414", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  urgentText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#ef4444" },
  orderBiz: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3 },
  orderAmt: { fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "right" },
  orderDate: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 2 },
  orderMid: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, gap: 8 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  statusChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  orderAddr: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  addrText: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular" },
  driverChip: { flexDirection: "row", alignItems: "center", gap: 4 },
  driverText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});
