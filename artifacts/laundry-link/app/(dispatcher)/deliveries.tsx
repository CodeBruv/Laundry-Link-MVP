import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { useOrders } from "@/contexts/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { Order, OrderStatus } from "@/types";

type Action = { status: OrderStatus; label: string; icon: keyof typeof Feather.glyphMap };

const QUICK_ACTIONS: Action[] = [
  { status: "PICKED_UP", label: "Picked Up", icon: "shopping-bag" },
  { status: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: "truck" },
  { status: "DELIVERED", label: "Delivered", icon: "check-circle" },
];

function nextActions(currentStatus: OrderStatus): Action[] {
  const idx = QUICK_ACTIONS.findIndex((a) => a.status === currentStatus);
  // All actions after the current status (or all if PENDING/ACCEPTED/IN_PROGRESS)
  if (idx === -1) return QUICK_ACTIONS.slice(0, 1); // first action available
  return QUICK_ACTIONS.slice(idx + 1);
}

export default function DispatcherDeliveries() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { orders, isLoading, refreshOrders, updateOrderStatus } = useOrders();
  const assigned = orders.filter((o) => !!o.assignedDriverName);

  const handleAction = async (order: Order, action: Action) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateOrderStatus(order.id, action.status, `${action.label} — dispatcher update`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {assigned.length === 0 ? (
        <EmptyState
          icon="truck"
          title="No Deliveries"
          message="Assigned pickup and delivery jobs will appear here after a business selects a dispatcher."
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 90) }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshOrders} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>My Deliveries</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Tap a card to open full details or use the quick actions below.
          </Text>

          {assigned.map((order) => {
            const actions = nextActions(order.status);
            const isCompleted = order.status === "DELIVERED" || order.status === "CANCELLED";
            return (
              <Pressable
                key={order.id}
                onPress={() => router.push({ pathname: "/order/[id]", params: { id: order.id } } as any)}
                style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}
              >
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={[styles.orderNum, { color: colors.foreground }]}>#{order.orderNumber}</Text>
                    <Text style={[styles.amount, { color: colors.mutedForeground }]}>
                      ₦{order.totalAmount.toLocaleString()}
                    </Text>
                  </View>
                  <StatusBadge status={order.status} />
                </View>

                {/* Addresses */}
                <View style={styles.infoRow}>
                  <Feather name="map-pin" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.infoText, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {order.pickupAddress}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Feather name="navigation" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.infoText, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {order.deliveryAddress}
                  </Text>
                </View>
                {order.urgent && (
                  <View style={styles.urgentRow}>
                    <Feather name="zap" size={13} color="#ef4444" />
                    <Text style={styles.urgentText}>Urgent order</Text>
                  </View>
                )}

                {/* Quick actions */}
                {!isCompleted && actions.length > 0 && (
                  <View style={styles.actionsRow}>
                    {actions.map((action) => (
                      <Pressable
                        key={action.status}
                        onPress={(e) => { e.stopPropagation?.(); handleAction(order, action); }}
                        style={[styles.actionBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
                      >
                        <Feather name={action.icon} size={14} color={colors.primaryForeground} />
                        <Text style={[styles.actionText, { color: colors.primaryForeground }]}>{action.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                {isCompleted && (
                  <View style={[styles.completedBadge, { backgroundColor: "#10b98116", borderRadius: colors.radius }]}>
                    <Feather name="check" size={13} color="#10b981" />
                    <Text style={styles.completedText}>Delivery complete</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 4 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 16 },
  card: { padding: 16, marginBottom: 12, gap: 10 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  orderNum: { fontSize: 16, fontFamily: "Inter_700Bold" },
  amount: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 2 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  urgentRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  urgentText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#ef4444" },
  actionsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 14 },
  actionText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  completedBadge: { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 9, paddingHorizontal: 12, marginTop: 4 },
  completedText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#10b981" },
});
