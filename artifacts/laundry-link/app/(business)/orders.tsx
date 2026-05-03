import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { OrderCard } from "@/components/OrderCard";
import { StatusBadge } from "@/components/StatusBadge";
import { SubscriptionPaywall } from "@/components/SubscriptionPaywall";
import { useOrders } from "@/contexts/OrdersContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useColors } from "@/hooks/useColors";
import { Order, OrderStatus } from "@/types";

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "ACCEPTED",
  ACCEPTED: "PICKED_UP",
  PICKED_UP: "IN_PROGRESS",
  IN_PROGRESS: "READY",
  PAID: "OUT_FOR_DELIVERY",
  READY: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  PENDING: "Accept Order",
  ACCEPTED: "Mark Picked Up",
  PICKED_UP: "Mark In Progress",
  IN_PROGRESS: "Mark Ready",
  PAID: "Out for Delivery",
  READY: "Out for Delivery",
  OUT_FOR_DELIVERY: "Mark Delivered",
};

export default function BusinessOrders() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { orders, isLoading, refreshOrders, updateOrderStatus } = useOrders();
  const { isSubscribed } = useSubscription();

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
          title="No Orders"
          message="Customer orders for CleanPro Laundry Abuja will appear here."
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 90) }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshOrders} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>Business Orders</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Accept, assign dispatchers, and move orders through fulfilment.
          </Text>

          {orders.map((order) => {
            const next = NEXT_STATUS[order.status];
            const nextLabel = NEXT_LABEL[order.status];
            const isPaid = order.status === "PAID";
            const isTerminal = order.status === "DELIVERED" || order.status === "CANCELLED";

            return (
              <Pressable
                key={order.id}
                onPress={() =>
                  router.push({ pathname: "/order/[id]", params: { id: order.id } } as any)
                }
              >
                <View style={[styles.orderCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
                  {/* Header */}
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.orderNum, { color: colors.foreground }]}>
                        #{order.orderNumber}
                      </Text>
                      <Text style={[styles.customerName, { color: colors.mutedForeground }]}>
                        {order.customerName}
                      </Text>
                    </View>
                    <StatusBadge status={order.status} />
                  </View>

                  {/* Payment info */}
                  {isPaid && (
                    <View style={[styles.paidRow, { backgroundColor: "#05966918", borderRadius: colors.radius }]}>
                      <Feather name="dollar-sign" size={14} color="#059669" />
                      <Text style={styles.paidText}>Payment received — ₦{order.totalAmount.toLocaleString()}</Text>
                    </View>
                  )}

                  {/* Amounts */}
                  <View style={styles.amountRow}>
                    <Text style={[styles.amount, { color: colors.primary }]}>
                      ₦{order.totalAmount.toLocaleString()}
                    </Text>
                    <Text style={[styles.amountSub, { color: colors.mutedForeground }]}>
                      incl. ₦{order.deliveryFee.toLocaleString()} delivery
                    </Text>
                  </View>

                  {/* Addresses */}
                  <View style={styles.addressRow}>
                    <Feather name="map-pin" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.addressText, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {order.pickupAddress}
                    </Text>
                  </View>

                  {order.urgent && (
                    <View style={styles.urgentRow}>
                      <Feather name="zap" size={12} color="#ef4444" />
                      <Text style={styles.urgentText}>Urgent order</Text>
                    </View>
                  )}

                  {/* Action buttons */}
                  {!isTerminal && (
                    <View style={styles.actions}>
                      {order.status === "PENDING" && (
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation?.();
                            updateOrderStatus(order.id, "CANCELLED", "Business rejected order");
                          }}
                          style={[styles.rejectButton, { borderRadius: colors.radius }]}
                        >
                          <Text style={styles.rejectText}>Reject</Text>
                        </Pressable>
                      )}
                      {next && nextLabel && (
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation?.();
                            updateOrderStatus(order.id, next, `Business: ${nextLabel}`);
                          }}
                          style={[styles.nextButton, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
                        >
                          <Text style={[styles.nextButtonText, { color: colors.primaryForeground }]}>
                            {nextLabel}
                          </Text>
                        </Pressable>
                      )}
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
  paidRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  paidText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#059669" },
  amountRow: { gap: 2 },
  amount: { fontSize: 20, fontFamily: "Inter_700Bold" },
  amountSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  addressText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular" },
  urgentRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  urgentText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#ef4444" },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  rejectButton: { flex: 0.35, paddingVertical: 12, alignItems: "center", backgroundColor: "#ef444416" },
  rejectText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#ef4444" },
  nextButton: { flex: 1, paddingVertical: 12, alignItems: "center" },
  nextButtonText: { fontSize: 13, fontFamily: "Inter_700Bold" },
});
