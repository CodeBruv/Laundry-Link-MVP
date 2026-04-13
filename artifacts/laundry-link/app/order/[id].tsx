import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { OrderTimeline } from "@/components/OrderTimeline";
import { StatusBadge } from "@/components/StatusBadge";
import { DISPATCHERS } from "@/constants/services";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/contexts/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { OrderStatus } from "@/types";

const BUSINESS_NEXT: OrderStatus[] = ["ACCEPTED", "PICKED_UP", "IN_PROGRESS", "READY", "OUT_FOR_DELIVERY", "DELIVERED"];

export default function OrderDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { role } = useAuth();
  const { getOrderById, getHistoryForOrder, updateOrderStatus, assignDispatcher, isLoading } = useOrders();
  const order = getOrderById(String(id));

  if (!order) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}> 
        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <Text style={[styles.title, { color: colors.foreground }]}>Order not found</Text>
            <Pressable onPress={() => router.back()} style={[styles.primaryButton, { backgroundColor: colors.primary, borderRadius: colors.radius }]}> 
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Go Back</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  const canBusinessUpdate = role === "BUSINESS" && order.status !== "DELIVERED" && order.status !== "CANCELLED";

  const handleStatus = async (status: OrderStatus) => {
    await updateOrderStatus(order.id, status, `Status updated to ${status.replaceAll("_", " ").toLowerCase()}`);
  };

  const rejectOrder = () => {
    if (Platform.OS === "web") {
      handleStatus("CANCELLED");
      return;
    }
    Alert.alert("Reject order", "This will mark the order as cancelled.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reject", style: "destructive", onPress: () => handleStatus("CANCELLED") },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30 }}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={() => router.back()} style={styles.backRow}>
        <Feather name="chevron-left" size={22} color={colors.primary} />
        <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
      </Pressable>

      <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}> 
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>#{order.orderNumber}</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{order.businessName}</Text>
          </View>
          <StatusBadge status={order.status} />
        </View>
        <Text style={[styles.total, { color: colors.primary }]}>₦{order.totalAmount.toLocaleString()}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}> 
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Customer & addresses</Text>
        <InfoRow icon="user" label={order.customerName} />
        <InfoRow icon="map-pin" label={`Pickup: ${order.pickupAddress}`} />
        <InfoRow icon="navigation" label={`Delivery: ${order.deliveryAddress}`} />
        {!!order.specialRequests && <InfoRow icon="file-text" label={`Notes: ${order.specialRequests}`} />}
        {order.urgent && <InfoRow icon="zap" label="Urgent order" accent />}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}> 
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Items</Text>
        {order.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={[styles.itemText, { color: colors.foreground }]}>{item.quantity}x {item.serviceName}</Text>
            <Text style={[styles.itemText, { color: colors.foreground }]}>₦{item.total.toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {role === "BUSINESS" && (
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}> 
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Dispatcher assignment</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Assigned: {order.assignedDriverName || "None yet"}</Text>
          <View style={styles.dispatcherGrid}>
            {DISPATCHERS.map((driver) => (
              <Pressable key={driver.id} onPress={() => assignDispatcher(order.id, driver.id, driver.name)} style={[styles.chip, { borderColor: order.dispatcherId === driver.id ? colors.primary : colors.border, backgroundColor: order.dispatcherId === driver.id ? colors.primary : colors.card, borderRadius: colors.radius }]}>
                <Text style={[styles.chipText, { color: order.dispatcherId === driver.id ? colors.primaryForeground : colors.foreground }]}>{driver.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}> 
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Timeline</Text>
        <OrderTimeline history={getHistoryForOrder(order.id)} />
      </View>

      {canBusinessUpdate && (
        <View style={styles.actions}>
          {order.status === "PENDING" && (
            <Pressable onPress={rejectOrder} style={[styles.rejectButton, { backgroundColor: colors.destructive + "16", borderRadius: colors.radius }]}> 
              <Text style={[styles.rejectText, { color: colors.destructive }]}>Reject</Text>
            </Pressable>
          )}
          {BUSINESS_NEXT.filter((status) => status !== order.status).slice(0, 3).map((status) => (
            <Pressable key={status} onPress={() => handleStatus(status)} style={[styles.primaryButton, { backgroundColor: colors.primary, borderRadius: colors.radius }]}> 
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>{status.replaceAll("_", " ")}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function InfoRow({ icon, label, accent }: { icon: keyof typeof Feather.glyphMap; label: string; accent?: boolean }) {
  const colors = useColors();
  return (
    <View style={styles.infoRow}>
      <Feather name={icon} size={15} color={accent ? colors.accent : colors.mutedForeground} />
      <Text style={[styles.infoText, { color: accent ? colors.accent : colors.foreground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: 14 },
  backText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  card: { padding: 16, marginBottom: 12, gap: 12 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  title: { fontSize: 21, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  total: { fontSize: 24, fontFamily: "Inter_700Bold" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 9 },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  itemRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  itemText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  dispatcherGrid: { gap: 8 },
  chip: { borderWidth: 1, paddingVertical: 10, paddingHorizontal: 12, alignItems: "center" },
  chipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  actions: { gap: 10 },
  primaryButton: { paddingVertical: 14, alignItems: "center", paddingHorizontal: 14 },
  primaryButtonText: { fontSize: 14, fontFamily: "Inter_700Bold", textTransform: "capitalize" },
  rejectButton: { paddingVertical: 14, alignItems: "center" },
  rejectText: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
