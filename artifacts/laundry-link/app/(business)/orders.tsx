import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { SubscriptionPaywall } from "@/components/SubscriptionPaywall";
import { useOrders } from "@/contexts/OrdersContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useColors } from "@/hooks/useColors";
import { Order, OrderStatus } from "@/types";

// Strict business flow — business CANNOT jump past READY without customer payment
// READY → PAID is triggered by customer paying via Paystack. Business then sends out for delivery.
const BUSINESS_NEXT: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  PENDING: { status: "ACCEPTED", label: "Accept Order" },
  ACCEPTED: { status: "PICKED_UP", label: "Mark Picked Up" },
  PICKED_UP: { status: "IN_PROGRESS", label: "Mark In Progress" },
  IN_PROGRESS: { status: "READY", label: "Mark Ready" },
  // READY → blocked here; customer must pay → PAID
  PAID: { status: "OUT_FOR_DELIVERY", label: "Send Out for Delivery" },
  // OUT_FOR_DELIVERY → DELIVERED done by dispatcher
};

function StatusGate({ order, colors }: {
  order: Order;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  if (order.status === "READY") {
    return (
      <View style={[gateStyles.waitingCard, { backgroundColor: "#d9770608", borderColor: "#d9770630", borderRadius: colors.radius }]}>
        <Feather name="clock" size={15} color="#d97706" />
        <Text style={gateStyles.waitingText}>
          Waiting for customer payment — they will pay ₦{order.totalAmount.toLocaleString()} via Paystack or bank transfer.
        </Text>
      </View>
    );
  }
  return null;
}

const gateStyles = StyleSheet.create({
  waitingCard: { flexDirection: "row", alignItems: "flex-start", gap: 9, padding: 12, borderWidth: 1 },
  waitingText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium", color: "#d97706", lineHeight: 18 },
});

export default function BusinessOrders() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { orders, isLoading, refreshOrders, updateOrderStatus } = useOrders();
  const { isSubscribed } = useSubscription();
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [statusError, setStatusError] = React.useState<string | null>(null);

  const handleStatusUpdate = async (orderId: string, status: OrderStatus, label: string) => {
    setUpdatingId(orderId);
    setStatusError(null);
    const result = await updateOrderStatus(orderId, status, `Business: ${label}`);
    setUpdatingId(null);
    if (result.error) setStatusError(result.error);
  };

  if (!isSubscribed) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.gateWrap, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <Feather name="lock" size={28} color={colors.primary} />
          <Text style={[styles.gateTitle, { color: colors.foreground }]}>Subscription required</Text>
          <Text style={[styles.gateText, { color: colors.mutedForeground }]}>
            Subscribe to manage orders. Go to the Plan tab to start your free trial.
          </Text>
        </View>
        <SubscriptionPaywall onSuccess={() => {}} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {orders.length === 0 ? (
        <EmptyState
          icon="clipboard"
          title="No Orders Yet"
          message="Customer orders will appear here once they place an order."
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 90) }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshOrders} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>Orders</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Accept orders, track progress, and confirm payments before dispatching.
          </Text>
          {statusError && (
            <View style={[styles.errorBanner, { backgroundColor: "#ef444412", borderRadius: colors.radius }]}>
              <Feather name="alert-circle" size={14} color="#ef4444" />
              <Text style={styles.errorText}>{statusError}</Text>
            </View>
          )}

          {orders.map((order) => {
            const next = BUSINESS_NEXT[order.status];
            const isTerminal = order.status === "DELIVERED" || order.status === "CANCELLED";
            const isPaid = order.status === "PAID";
            const isReady = order.status === "READY";

            return (
              <Pressable
                key={order.id}
                onPress={() => router.push({ pathname: "/order/[id]", params: { id: order.id } } as any)}
              >
                <View style={[styles.orderCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
                  {/* Header */}
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.orderNum, { color: colors.foreground }]}>#{order.orderNumber}</Text>
                      <Text style={[styles.customerName, { color: colors.mutedForeground }]}>{order.customerName}</Text>
                    </View>
                    <StatusBadge status={order.status} />
                  </View>

                  {/* Payment received banner */}
                  {isPaid && (
                    <View style={[styles.paidRow, { backgroundColor: "#05966918", borderRadius: colors.radius }]}>
                      <Feather name="check-circle" size={14} color="#059669" />
                      <Text style={styles.paidText}>
                        Payment confirmed — ₦{order.totalAmount.toLocaleString()}. Ready to dispatch.
                      </Text>
                    </View>
                  )}

                  {/* Waiting for payment gate */}
                  <StatusGate order={order} colors={colors} />

                  {/* Amounts */}
                  <View style={styles.amountRow}>
                    <Text style={[styles.amount, { color: colors.primary }]}>₦{order.totalAmount.toLocaleString()}</Text>
                    <Text style={[styles.amountSub, { color: colors.mutedForeground }]}>
                      incl. ₦{order.deliveryFee.toLocaleString()} delivery
                    </Text>
                  </View>

                  {/* Address */}
                  <View style={styles.addressRow}>
                    <Feather name="map-pin" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.addressText, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {order.pickupAddress}
                    </Text>
                  </View>

                  {order.urgent && (
                    <View style={styles.urgentRow}>
                      <Feather name="zap" size={12} color="#ef4444" />
                      <Text style={styles.urgentText}>Urgent order — priority processing</Text>
                    </View>
                  )}

                  {/* Dispatcher assigned */}
                  {order.assignedDriverName && (
                    <View style={styles.driverRow}>
                      <Feather name="truck" size={12} color={colors.accent} />
                      <Text style={[styles.driverText, { color: colors.accent }]}>
                        Rider: {order.assignedDriverName}
                      </Text>
                    </View>
                  )}

                  {/* Action buttons — gated strictly */}
                  {!isTerminal && !isReady && (
                    <View style={styles.actions}>
                      {order.status === "PENDING" && (
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation?.();
                            handleStatusUpdate(order.id, "CANCELLED", "Reject Order");
                          }}
                          disabled={updatingId === order.id}
                          style={[styles.rejectButton, { borderRadius: colors.radius, opacity: updatingId === order.id ? 0.5 : 1 }]}
                        >
                          <Text style={styles.rejectText}>Reject</Text>
                        </Pressable>
                      )}
                      {next && (
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation?.();
                            handleStatusUpdate(order.id, next.status, next.label);
                          }}
                          disabled={updatingId === order.id}
                          style={[styles.nextButton, { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: updatingId === order.id ? 0.6 : 1 }]}
                        >
                          <Text style={[styles.nextButtonText, { color: colors.primaryForeground }]}>
                            {updatingId === order.id ? "Updating…" : next.label}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  )}

                  {isTerminal && (
                    <View style={[styles.terminalBadge, {
                      backgroundColor: order.status === "DELIVERED" ? "#05966912" : "#ef444412",
                      borderRadius: colors.radius,
                    }]}>
                      <Feather name={order.status === "DELIVERED" ? "check-circle" : "x-circle"} size={13}
                        color={order.status === "DELIVERED" ? "#059669" : "#ef4444"} />
                      <Text style={[styles.terminalText, { color: order.status === "DELIVERED" ? "#059669" : "#ef4444" }]}>
                        {order.status === "DELIVERED" ? "Delivered" : "Cancelled"}
                      </Text>
                    </View>
                  )}
                </View>
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
  gateWrap: { margin: 20, padding: 24, alignItems: "center", gap: 10 },
  gateTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  gateText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 4 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 16 },
  orderCard: { padding: 16, marginBottom: 12, gap: 10 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  orderNum: { fontSize: 16, fontFamily: "Inter_700Bold" },
  customerName: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  paidRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 9 },
  paidText: { flex: 1, fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#059669" },
  amountRow: { gap: 2 },
  amount: { fontSize: 20, fontFamily: "Inter_700Bold" },
  amountSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  addressText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular" },
  urgentRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  urgentText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#ef4444" },
  driverRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  driverText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  rejectButton: { flex: 0.35, paddingVertical: 12, alignItems: "center", backgroundColor: "#ef444416" },
  rejectText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#ef4444" },
  nextButton: { flex: 1, paddingVertical: 12, alignItems: "center" },
  nextButtonText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  terminalBadge: { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 9, paddingHorizontal: 12 },
  terminalText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, marginBottom: 12 },
  errorText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium", color: "#ef4444" },
});
