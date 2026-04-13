import React from "react";
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { OrderCard } from "@/components/OrderCard";
import { useOrders } from "@/contexts/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { OrderStatus } from "@/types";

const NEXT_STATUS: Record<string, OrderStatus> = {
  PENDING: "ACCEPTED",
  ACCEPTED: "PICKED_UP",
  PICKED_UP: "IN_PROGRESS",
  IN_PROGRESS: "READY",
  READY: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};

export default function BusinessOrders() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders, isLoading, refreshOrders, updateOrderStatus } = useOrders();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      {orders.length === 0 ? (
        <EmptyState icon="clipboard" title="No Orders" message="Customer orders for CleanPro Laundry Abuja will appear here for acceptance and processing." />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 90) }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshOrders} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>Business Orders</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Accept, reject, assign dispatchers, and move orders through fulfillment.</Text>
          {orders.map((order) => {
            const next = NEXT_STATUS[order.status];
            return (
              <View key={order.id} style={styles.orderWrap}>
                <OrderCard order={order} showCustomer showDriver />
                <View style={styles.actions}>
                  {order.status === "PENDING" && (
                    <Pressable onPress={() => updateOrderStatus(order.id, "CANCELLED", "Business rejected order")} style={[styles.rejectButton, { backgroundColor: colors.destructive + "16", borderRadius: colors.radius }]}> 
                      <Text style={[styles.rejectText, { color: colors.destructive }]}>Reject</Text>
                    </Pressable>
                  )}
                  {!!next && (
                    <Pressable onPress={() => updateOrderStatus(order.id, next, `Business moved order to ${next}`)} style={[styles.nextButton, { backgroundColor: colors.primary, borderRadius: colors.radius }]}> 
                      <Text style={[styles.nextButtonText, { color: colors.primaryForeground }]}>{order.status === "PENDING" ? "Accept" : next.replaceAll("_", " ")}</Text>
                    </Pressable>
                  )}
                </View>
              </View>
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
  orderWrap: { marginBottom: 4 },
  actions: { flexDirection: "row", gap: 10, marginBottom: 12 },
  rejectButton: { flex: 0.35, paddingVertical: 12, alignItems: "center" },
  rejectText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  nextButton: { flex: 1, paddingVertical: 12, alignItems: "center" },
  nextButtonText: { fontSize: 13, fontFamily: "Inter_700Bold", textTransform: "capitalize" },
});
