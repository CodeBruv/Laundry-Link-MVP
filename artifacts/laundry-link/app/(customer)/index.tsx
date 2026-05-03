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

import { LAUNDROMATS, sortLaundromats } from "@/constants/laundromats";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/contexts/OrdersContext";
import { useColors } from "@/hooks/useColors";

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#d97706",
  ACCEPTED: "#1d4ed8",
  PICKED_UP: "#1d4ed8",
  IN_PROGRESS: "#7c3aed",
  AT_LAUNDROMAT: "#7c3aed",
  READY: "#059669",
  PAID: "#059669",
  OUT_FOR_DELIVERY: "#059669",
  DELIVERED: "#6b7280",
  CANCELLED: "#dc2626",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending pickup",
  ACCEPTED: "Accepted by laundromat",
  PICKED_UP: "Picked up",
  IN_PROGRESS: "Being cleaned",
  AT_LAUNDROMAT: "At laundromat",
  READY: "Ready — awaiting payment",
  PAID: "Paid — dispatching rider",
  OUT_FOR_DELIVERY: "On the way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function CustomerHome() {
  const colors = useColors();
  const { user } = useAuth();
  const { orders, isLoading, refreshOrders } = useOrders();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] || "there";

  const activeOrders = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status));
  const nearbyLaundromats = sortLaundromats(LAUNDROMATS.filter((l) => l.isOpen), "distance").slice(0, 3);

  const handleNewOrder = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(customer)/create-order" as any);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80) }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshOrders} tintColor={colors.primary} />}
    >
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={[styles.hello, { color: colors.mutedForeground }]}>Hello, {firstName} 👋</Text>
        <Text style={[styles.heroText, { color: colors.foreground }]}>Fresh laundry, delivered.</Text>
      </View>

      {/* Active orders */}
      {activeOrders.length > 0 && (
        <View style={styles.activeSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Active Orders</Text>
          {activeOrders.slice(0, 2).map((order) => {
            const color = STATUS_COLOR[order.status] ?? colors.primary;
            const isReadyToPay = order.status === "READY";
            return (
              <Pressable
                key={order.id}
                onPress={() => router.push(`/order/${order.id}` as any)}
                style={[styles.activeCard, {
                  backgroundColor: colors.card,
                  borderRadius: colors.radius,
                  borderLeftColor: color,
                }]}
              >
                <View style={styles.activeTop}>
                  <Text style={[styles.activeOrderNum, { color: colors.foreground }]}>#{order.orderNumber}</Text>
                  <View style={[styles.statusChip, { backgroundColor: color + "18" }]}>
                    <View style={[styles.statusDot, { backgroundColor: color }]} />
                    <Text style={[styles.statusChipText, { color }]}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.activeAddr, { color: colors.mutedForeground }]} numberOfLines={1}>
                  📍 {order.pickupAddress}
                </Text>
                <View style={styles.activeBottom}>
                  <Text style={[styles.activeAmt, { color: colors.primary }]}>₦{order.totalAmount.toLocaleString()}</Text>
                  {isReadyToPay && (
                    <View style={[styles.payNowChip, { backgroundColor: "#059669" }]}>
                      <Feather name="credit-card" size={11} color="#ffffff" />
                      <Text style={styles.payNowText}>Pay Now</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
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
            Choose a laundromat · select services · pay directly
          </Text>
        </View>
        <View style={[styles.ctaArrow, { backgroundColor: colors.primaryForeground + "20" }]}>
          <Feather name="arrow-right" size={20} color={colors.primaryForeground} />
        </View>
      </Pressable>

      {/* Nearby laundromats — real data */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Nearby Laundromats</Text>
      {nearbyLaundromats.map((biz) => {
        const minPrice = Math.min(...biz.services.map((s) => s.pricePerUnit));
        return (
          <Pressable
            key={biz.id}
            onPress={handleNewOrder}
            style={[styles.laundryCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}
          >
            <View style={[styles.laundryAvatar, { backgroundColor: colors.primary + "14", borderRadius: colors.radius - 2 }]}>
              <Feather name="home" size={20} color={colors.primary} />
            </View>
            <View style={styles.laundryInfo}>
              <Text style={[styles.laundryName, { color: colors.foreground }]}>{biz.name}</Text>
              <Text style={[styles.laundryAddr, { color: colors.mutedForeground }]}>
                {biz.location} · {biz.distanceKm} km
              </Text>
              <View style={styles.laundryMeta}>
                <Feather name="star" size={12} color="#d97706" />
                <Text style={[styles.ratingText, { color: colors.foreground }]}>{biz.rating}</Text>
                <Text style={[styles.reviewCount, { color: colors.mutedForeground }]}>({biz.reviewCount})</Text>
                <Text style={[styles.priceFrom, { color: colors.mutedForeground }]}>
                  · from ₦{minPrice.toLocaleString()}/item
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>
        );
      })}

      {/* How it works */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>How it works</Text>
      <View style={[styles.howCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
        {[
          { step: "1", text: "Choose a laundromat and select services", icon: "home" as const },
          { step: "2", text: "Pay pickup fee to rider on arrival", icon: "dollar-sign" as const },
          { step: "3", text: "Laundromat cleans and presses your items", icon: "wind" as const },
          { step: "4", text: "Pay service + delivery fee when ready", icon: "credit-card" as const },
          { step: "5", text: "Rider delivers to your door", icon: "truck" as const },
        ].map((item, i, arr) => (
          <View key={item.step} style={[styles.howRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.stepText, { color: colors.primaryForeground }]}>{item.step}</Text>
            </View>
            <Feather name={item.icon} size={15} color={colors.mutedForeground} />
            <Text style={[styles.howText, { color: colors.foreground }]}>{item.text}</Text>
          </View>
        ))}
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
  activeSection: { marginBottom: 20 },
  activeCard: { padding: 14, marginTop: 8, marginBottom: 4, borderLeftWidth: 3, gap: 6 },
  activeTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  activeOrderNum: { fontSize: 14, fontFamily: "Inter_700Bold" },
  statusChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  activeAddr: { fontSize: 12, fontFamily: "Inter_400Regular" },
  activeBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  activeAmt: { fontSize: 15, fontFamily: "Inter_700Bold" },
  payNowChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12 },
  payNowText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#ffffff" },
  seeAllRow: { flexDirection: "row", alignItems: "center", gap: 4, paddingTop: 6 },
  seeAll: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  ctaCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, marginBottom: 24 },
  ctaTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 4 },
  ctaSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  ctaArrow: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  laundryCard: { flexDirection: "row", alignItems: "center", padding: 14, marginBottom: 10, gap: 12 },
  laundryAvatar: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  laundryInfo: { flex: 1, gap: 3 },
  laundryName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  laundryAddr: { fontSize: 12, fontFamily: "Inter_400Regular" },
  laundryMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  reviewCount: { fontSize: 11, fontFamily: "Inter_400Regular" },
  priceFrom: { fontSize: 11, fontFamily: "Inter_400Regular" },
  howCard: { padding: 4, marginBottom: 20 },
  howRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  stepBadge: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  stepText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  howText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
