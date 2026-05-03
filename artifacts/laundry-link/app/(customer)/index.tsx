import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/contexts/OrdersContext";
import { useColors } from "@/hooks/useColors";

const QUICK_SERVICES = [
  { icon: "shopping-bag" as const, label: "Wash & Fold" },
  { icon: "wind" as const, label: "Dry Clean" },
  { icon: "maximize" as const, label: "Iron & Press" },
  { icon: "zap" as const, label: "Express" },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending pickup",
  ACCEPTED: "Accepted",
  PICKED_UP: "Picked up",
  AT_LAUNDROMAT: "Being cleaned",
  READY: "Ready for delivery",
  PAID: "Paid — out for delivery",
  OUT_FOR_DELIVERY: "On the way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#d97706",
  ACCEPTED: "#1d4ed8",
  PICKED_UP: "#1d4ed8",
  AT_LAUNDROMAT: "#7c3aed",
  READY: "#059669",
  PAID: "#059669",
  OUT_FOR_DELIVERY: "#059669",
  DELIVERED: "#6b7280",
  CANCELLED: "#dc2626",
};

export default function CustomerHome() {
  const colors = useColors();
  const { user } = useAuth();
  const { orders, isLoading, refreshOrders } = useOrders();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] || "there";

  const activeOrders = orders.filter(
    (o) => !["DELIVERED", "CANCELLED"].includes(o.status),
  );

  const handleNewOrder = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(customer)/create-order" as any);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80) }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refreshOrders} tintColor={colors.primary} />
      }
    >
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={[styles.hello, { color: colors.mutedForeground }]}>Hello, {firstName} 👋</Text>
        <Text style={[styles.heroText, { color: colors.foreground }]}>Fresh laundry, delivered.</Text>
      </View>

      {/* Active orders */}
      {activeOrders.length > 0 && (
        <View style={styles.activeOrdersSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Active Orders</Text>
          {activeOrders.slice(0, 2).map((order) => (
            <Pressable
              key={order.id}
              onPress={() => router.push(`/order/${order.id}` as any)}
              style={[styles.activeOrderCard, { backgroundColor: colors.card, borderRadius: colors.radius, borderLeftColor: STATUS_COLOR[order.status] ?? colors.primary }]}
            >
              <View style={styles.activeOrderTop}>
                <Text style={[styles.activeOrderNum, { color: colors.foreground }]}>#{order.orderNumber}</Text>
                <View style={[styles.statusChip, { backgroundColor: (STATUS_COLOR[order.status] ?? colors.primary) + "18" }]}>
                  <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[order.status] ?? colors.primary }]} />
                  <Text style={[styles.statusChipText, { color: STATUS_COLOR[order.status] ?? colors.primary }]}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </Text>
                </View>
              </View>
              <Text style={[styles.activeOrderAddr, { color: colors.mutedForeground }]} numberOfLines={1}>
                📍 {order.pickupAddress}
              </Text>
              <Text style={[styles.activeOrderAmt, { color: colors.primary }]}>
                ₦{order.totalAmount.toLocaleString()}
              </Text>
            </Pressable>
          ))}
          {activeOrders.length > 2 && (
            <Pressable onPress={() => router.push("/(customer)/orders" as any)} style={styles.seeAllRow}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all {activeOrders.length} active orders</Text>
              <Feather name="chevron-right" size={14} color={colors.primary} />
            </Pressable>
          )}
        </View>
      )}

      {/* CTA */}
      <Pressable
        onPress={handleNewOrder}
        style={[styles.ctaCard, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
      >
        <View>
          <Text style={[styles.ctaTitle, { color: colors.primaryForeground }]}>Place a new order</Text>
          <Text style={[styles.ctaSub, { color: colors.primaryForeground + "cc" }]}>
            Pickup · Wash · Deliver — pay laundromat directly
          </Text>
        </View>
        <View style={[styles.ctaArrow, { backgroundColor: colors.primaryForeground + "20" }]}>
          <Feather name="arrow-right" size={20} color={colors.primaryForeground} />
        </View>
      </Pressable>

      {/* Quick services */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Services</Text>
      <View style={styles.servicesGrid}>
        {QUICK_SERVICES.map((s) => (
          <Pressable
            key={s.label}
            onPress={handleNewOrder}
            style={[styles.serviceCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}
          >
            <View style={[styles.serviceIcon, { backgroundColor: colors.primary + "14", borderRadius: colors.radius - 2 }]}>
              <Feather name={s.icon} size={22} color={colors.primary} />
            </View>
            <Text style={[styles.serviceLabel, { color: colors.foreground }]} numberOfLines={1}>
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* How it works */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>How it works</Text>
      <View style={[styles.howCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
        {[
          { step: "1", text: "Place your order — choose services & address", icon: "clipboard" as const },
          { step: "2", text: "Pay pickup fee to rider on arrival", icon: "dollar-sign" as const },
          { step: "3", text: "Laundromat cleans & presses your items", icon: "wind" as const },
          { step: "4", text: "Pay service + delivery fee → order delivered", icon: "truck" as const },
        ].map((item, i, arr) => (
          <View key={item.step} style={[styles.howRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.stepText, { color: colors.primaryForeground }]}>{item.step}</Text>
            </View>
            <Feather name={item.icon} size={16} color={colors.mutedForeground} />
            <Text style={[styles.howText, { color: colors.foreground }]}>{item.text}</Text>
          </View>
        ))}
      </View>

      {/* P2P payment note */}
      <View style={[styles.p2pNote, { backgroundColor: colors.card, borderRadius: colors.radius, borderLeftColor: colors.accent }]}>
        <Feather name="info" size={15} color={colors.accent} />
        <Text style={[styles.p2pText, { color: colors.mutedForeground }]}>
          <Text style={{ fontFamily: "Inter_700Bold", color: colors.foreground }}>No hidden fees. </Text>
          You pay laundromats and riders directly. LaundryLink earns from business subscriptions only.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  greeting: { marginBottom: 16 },
  hello: { fontSize: 14, fontFamily: "Inter_500Medium", marginBottom: 4 },
  heroText: { fontSize: 26, fontFamily: "Inter_700Bold" },
  activeOrdersSection: { marginBottom: 20 },
  activeOrderCard: { padding: 14, marginBottom: 8, borderLeftWidth: 3 },
  activeOrderTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  activeOrderNum: { fontSize: 14, fontFamily: "Inter_700Bold" },
  statusChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  activeOrderAddr: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 6 },
  activeOrderAmt: { fontSize: 15, fontFamily: "Inter_700Bold" },
  seeAllRow: { flexDirection: "row", alignItems: "center", gap: 4, paddingTop: 4 },
  seeAll: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  ctaCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, marginBottom: 24 },
  ctaTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 4 },
  ctaSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  ctaArrow: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  servicesGrid: { flexDirection: "row", gap: 10, marginBottom: 24 },
  serviceCard: { flex: 1, alignItems: "center", paddingVertical: 16, paddingHorizontal: 8, gap: 8 },
  serviceIcon: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  serviceLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textAlign: "center" },
  howCard: { padding: 4, marginBottom: 20 },
  howRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  stepBadge: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  stepText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  howText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  p2pNote: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderLeftWidth: 3 },
  p2pText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
