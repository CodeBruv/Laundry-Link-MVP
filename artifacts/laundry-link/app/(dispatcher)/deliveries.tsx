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

/**
 * Strict dispatcher flow:
 * ACCEPTED/PENDING → can mark PICKED_UP (pickup from customer)
 * PICKED_UP / IN_PROGRESS → laundromat processing — dispatcher waits
 * READY → customer must pay first — dispatcher CANNOT act
 * PAID → dispatcher can mark OUT_FOR_DELIVERY
 * OUT_FOR_DELIVERY → dispatcher can mark DELIVERED
 *
 * Dispatcher CANNOT skip the payment gate (READY → PAID).
 */
type Action = { status: OrderStatus; label: string; icon: keyof typeof Feather.glyphMap; color?: string };

function getNextAction(currentStatus: OrderStatus): Action | null {
  if (currentStatus === "ACCEPTED" || currentStatus === "PENDING") {
    return { status: "PICKED_UP", label: "Mark Picked Up", icon: "shopping-bag" };
  }
  if (currentStatus === "PAID") {
    return { status: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: "truck", color: "#059669" };
  }
  if (currentStatus === "OUT_FOR_DELIVERY") {
    return { status: "DELIVERED", label: "Mark Delivered", icon: "check-circle", color: "#059669" };
  }
  return null;
}

function PaymentGateNotice({ order, colors }: {
  order: Order;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  if (order.status === "READY") {
    return (
      <View style={[gateStyles.card, { backgroundColor: "#d9770608", borderColor: "#d9770630", borderRadius: colors.radius }]}>
        <Feather name="clock" size={15} color="#d97706" />
        <View style={{ flex: 1 }}>
          <Text style={gateStyles.title}>Waiting for customer payment</Text>
          <Text style={gateStyles.body}>
            Order is ready. The customer needs to pay ₦{order.totalAmount.toLocaleString()} before you can proceed to delivery.
          </Text>
        </View>
      </View>
    );
  }
  if (order.status === "IN_PROGRESS" || order.status === "PICKED_UP") {
    return (
      <View style={[gateStyles.card, { backgroundColor: "#1d4ed808", borderColor: "#1d4ed820", borderRadius: colors.radius }]}>
        <Feather name="loader" size={14} color="#1d4ed8" />
        <Text style={[gateStyles.body, { color: "#1d4ed8" }]}>Laundromat is processing — standby for delivery assignment.</Text>
      </View>
    );
  }
  return null;
}

const gateStyles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderWidth: 1, marginTop: 4 },
  title: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#d97706", marginBottom: 2 },
  body: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#d97706", lineHeight: 16 },
});

export default function DispatcherDeliveries() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { orders, isLoading, refreshOrders, updateOrderStatus } = useOrders();

  // Show all orders assigned to this dispatcher
  const assigned = orders.filter((o) => !!o.assignedDriverName);

  // Separate active from completed
  const active = assigned.filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED");
  const completed = assigned.filter((o) => o.status === "DELIVERED" || o.status === "CANCELLED");

  const handleAction = async (order: Order, action: Action) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateOrderStatus(order.id, action.status, `${action.label} — dispatcher update`);
  };

  const renderCard = (order: Order) => {
    const nextAction = getNextAction(order.status);
    const isCompleted = order.status === "DELIVERED" || order.status === "CANCELLED";
    const isPaid = order.status === "PAID";

    return (
      <Pressable
        key={order.id}
        onPress={() => router.push({ pathname: "/order/[id]", params: { id: order.id } } as any)}
        style={[styles.card, {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderLeftColor: isPaid ? "#059669" : order.status === "READY" ? "#d97706" : colors.primary,
          borderLeftWidth: 3,
        }]}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.orderNum, { color: colors.foreground }]}>#{order.orderNumber}</Text>
            <Text style={[styles.customerName, { color: colors.mutedForeground }]}>{order.customerName}</Text>
          </View>
          <StatusBadge status={order.status} />
        </View>

        {/* Amount */}
        <View style={styles.amountRow}>
          <Text style={[styles.amount, { color: isPaid ? "#059669" : colors.primary }]}>
            ₦{order.totalAmount.toLocaleString()}
          </Text>
          {isPaid && (
            <View style={[styles.paidBadge, { backgroundColor: "#05966916" }]}>
              <Feather name="check-circle" size={11} color="#059669" />
              <Text style={styles.paidBadgeText}>Paid</Text>
            </View>
          )}
        </View>

        {/* Addresses */}
        <View style={styles.infoRow}>
          <Feather name="map-pin" size={13} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]} numberOfLines={1}>
            Pickup: {order.pickupAddress}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="navigation" size={13} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]} numberOfLines={1}>
            Deliver: {order.deliveryAddress}
          </Text>
        </View>

        {order.urgent && (
          <View style={styles.urgentRow}>
            <Feather name="zap" size={13} color="#ef4444" />
            <Text style={styles.urgentText}>Urgent order</Text>
          </View>
        )}

        {/* Payment gate notice */}
        <PaymentGateNotice order={order} colors={colors} />

        {/* Next action button — only shown when available */}
        {!isCompleted && nextAction && (
          <Pressable
            onPress={(e) => { e.stopPropagation?.(); handleAction(order, nextAction); }}
            style={[styles.actionBtn, {
              backgroundColor: nextAction.color ?? colors.primary,
              borderRadius: colors.radius,
            }]}
          >
            <Feather name={nextAction.icon} size={15} color="#ffffff" />
            <Text style={styles.actionText}>{nextAction.label}</Text>
          </Pressable>
        )}

        {isCompleted && (
          <View style={[styles.completedBadge, {
            backgroundColor: order.status === "DELIVERED" ? "#05966910" : "#ef444410",
            borderRadius: colors.radius,
          }]}>
            <Feather name={order.status === "DELIVERED" ? "check-circle" : "x-circle"} size={13}
              color={order.status === "DELIVERED" ? "#059669" : "#ef4444"} />
            <Text style={[styles.completedText, { color: order.status === "DELIVERED" ? "#059669" : "#ef4444" }]}>
              {order.status === "DELIVERED" ? "Delivery complete" : "Cancelled"}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {assigned.length === 0 ? (
        <EmptyState
          icon="truck"
          title="No Deliveries"
          message="A business will assign you to a pickup once they accept an order. Complete your KYC and set your service area first."
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 90) }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshOrders} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {active.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Active ({active.length})</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                Payment must be confirmed before proceeding to delivery.
              </Text>
              {active.map(renderCard)}
            </>
          )}

          {completed.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 20 }]}>
                Completed ({completed.length})
              </Text>
              {completed.map(renderCard)}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 4 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 14 },
  card: { padding: 16, marginBottom: 12, gap: 10 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  orderNum: { fontSize: 16, fontFamily: "Inter_700Bold" },
  customerName: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  amountRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  amount: { fontSize: 18, fontFamily: "Inter_700Bold" },
  paidBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  paidBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#059669" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  urgentRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  urgentText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#ef4444" },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, marginTop: 4 },
  actionText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#ffffff" },
  completedBadge: { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 9, paddingHorizontal: 12 },
  completedText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
