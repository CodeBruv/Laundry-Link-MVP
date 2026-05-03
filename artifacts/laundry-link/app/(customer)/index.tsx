import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  CITIES,
  City,
  DEFAULT_CITY,
  getLaundromatsForCity,
  sortLaundromats,
} from "@/constants/laundromats";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/contexts/OrdersContext";
import { useColors } from "@/hooks/useColors";

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#f59e0b",
  ACCEPTED: "#1a7ff9",
  PICKED_UP: "#1a7ff9",
  IN_PROGRESS: "#7c3aed",
  READY: "#059669",
  PAID: "#059669",
  OUT_FOR_DELIVERY: "#10b981",
  DELIVERED: "#64748b",
  CANCELLED: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending pickup",
  ACCEPTED: "Accepted",
  PICKED_UP: "Picked up",
  IN_PROGRESS: "Being cleaned",
  READY: "Ready — pay now",
  PAID: "Paid · dispatching",
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

  const [city, setCity] = useState<City>(DEFAULT_CITY);
  const [showCityPicker, setShowCityPicker] = useState(false);

  const activeOrders = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status));
  const nearbyLaundromats = sortLaundromats(getLaundromatsForCity(city).filter((l) => l.isOpen), "distance").slice(0, 3);

  const shadow = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  };

  const handleNewOrder = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(customer)/create-order" as any);
  };

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 90) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshOrders} tintColor={colors.accent} />}
      >
        {/* ── Bright hero ────────────────────────────────────────── */}
        <View style={[styles.hero, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          {/* Greeting row */}
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroGreet, { color: colors.mutedForeground }]}>Hello, {firstName} 👋</Text>
              <Text style={[styles.heroTitle, { color: colors.foreground }]}>Fresh laundry,{"\n"}delivered.</Text>
            </View>
            {/* City chip */}
            <Pressable
              onPress={() => setShowCityPicker(true)}
              style={[styles.cityBtn, { backgroundColor: colors.accent + "12", borderColor: colors.accent + "30" }]}
            >
              <Feather name="map-pin" size={12} color={colors.accent} />
              <Text style={[styles.cityBtnText, { color: colors.accent }]}>{city}</Text>
              <Feather name="chevron-down" size={11} color={colors.accent} />
            </Pressable>
          </View>

          {/* Accent CTA */}
          <Pressable
            onPress={handleNewOrder}
            style={[styles.heroCta, { backgroundColor: colors.accent, borderRadius: colors.radius }]}
          >
            <Feather name="plus-circle" size={18} color="#ffffff" />
            <Text style={styles.heroCtaText}>Place a new order</Text>
            <Feather name="arrow-right" size={16} color="rgba(255,255,255,0.8)" style={{ marginLeft: "auto" }} />
          </Pressable>
        </View>

        {/* ── Active orders ──────────────────────────────────────── */}
        {activeOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Active Orders</Text>
            {activeOrders.slice(0, 2).map((order) => {
              const color = STATUS_COLOR[order.status] ?? colors.accent;
              const isReadyToPay = order.status === "READY";
              return (
                <Pressable
                  key={order.id}
                  onPress={() => router.push(`/order/${order.id}` as any)}
                  style={[styles.orderCard, {
                    backgroundColor: colors.card,
                    borderRadius: colors.radius,
                    borderLeftColor: color,
                  }, shadow]}
                >
                  <View style={styles.orderTop}>
                    <Text style={[styles.orderNum, { color: colors.foreground }]}>#{order.orderNumber}</Text>
                    <View style={[styles.statusChip, { backgroundColor: color + "14" }]}>
                      <View style={[styles.statusDot, { backgroundColor: color }]} />
                      <Text style={[styles.statusChipText, { color }]}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.orderAddr, { color: colors.mutedForeground }]} numberOfLines={1}>
                    📍 {order.pickupAddress}
                  </Text>
                  <View style={styles.orderBottom}>
                    <Text style={[styles.orderAmt, { color: colors.accent }]}>₦{order.totalAmount.toLocaleString()}</Text>
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
                <Text style={[styles.seeAll, { color: colors.accent }]}>See all {activeOrders.length} orders</Text>
                <Feather name="chevron-right" size={14} color={colors.accent} />
              </Pressable>
            )}
          </View>
        )}

        {/* ── Nearby laundromats ─────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Laundromats in {city}</Text>
            <Pressable onPress={() => setShowCityPicker(true)}>
              <Text style={[styles.changeCity, { color: colors.accent }]}>Change</Text>
            </Pressable>
          </View>
          {nearbyLaundromats.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No open laundromats in {city} yet. Try another city.
              </Text>
            </View>
          ) : (
            nearbyLaundromats.map((biz) => {
              const minPrice = Math.min(...biz.services.map((s) => s.pricePerUnit));
              return (
                <Pressable
                  key={biz.id}
                  onPress={handleNewOrder}
                  style={[styles.laundryCard, { backgroundColor: colors.card, borderRadius: colors.radius }, shadow]}
                >
                  <View style={[styles.laundryAvatar, { backgroundColor: colors.accent + "14" }]}>
                    <Feather name="home" size={20} color={colors.accent} />
                  </View>
                  <View style={styles.laundryInfo}>
                    <Text style={[styles.laundryName, { color: colors.foreground }]}>{biz.name}</Text>
                    <Text style={[styles.laundryAddr, { color: colors.mutedForeground }]}>
                      {biz.location} · {biz.distanceKm} km
                    </Text>
                    <View style={styles.laundryMeta}>
                      <Feather name="star" size={11} color="#f59e0b" />
                      <Text style={[styles.ratingText, { color: colors.foreground }]}>{biz.rating}</Text>
                      <Text style={[styles.reviewCount, { color: colors.mutedForeground }]}>({biz.reviewCount})</Text>
                      <Text style={[styles.priceFrom, { color: colors.mutedForeground }]}>
                        · from ₦{minPrice.toLocaleString()}/item
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.orderNowBtn, { backgroundColor: colors.accent + "14" }]}>
                    <Feather name="arrow-right" size={15} color={colors.accent} />
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        {/* ── How it works ───────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>How it works</Text>
          <View style={[styles.howCard, { backgroundColor: colors.card, borderRadius: colors.radius }, shadow]}>
            {[
              { step: "1", text: "Choose a laundromat and their services", icon: "home" as const },
              { step: "2", text: "Rider picks up — pay pickup fee directly", icon: "shopping-bag" as const },
              { step: "3", text: "Laundromat washes, dries, and presses", icon: "wind" as const },
              { step: "4", text: "Pay service + delivery fee when ready", icon: "credit-card" as const },
              { step: "5", text: "Rider delivers fresh laundry to your door", icon: "truck" as const },
            ].map((item, i, arr) => (
              <View key={item.step} style={[styles.howRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.stepText, { color: "#ffffff" }]}>{item.step}</Text>
                </View>
                <Feather name={item.icon} size={15} color={colors.mutedForeground} />
                <Text style={[styles.howText, { color: colors.foreground }]}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ── City picker modal ──────────────────────────────────── */}
      <Modal
        visible={showCityPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCityPicker(false)}
      >
        <View style={[styles.citySheet, { backgroundColor: colors.background }]}>
          <View style={[styles.citySheetHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.citySheetTitle, { color: colors.foreground }]}>Select City</Text>
            <Pressable onPress={() => setShowCityPicker(false)} hitSlop={12}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>
          {CITIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => { setCity(c); setShowCityPicker(false); }}
              style={[styles.cityOption, { borderBottomColor: colors.border, backgroundColor: c === city ? colors.accent + "0c" : "transparent" }]}
            >
              <Feather name="map-pin" size={16} color={c === city ? colors.accent : colors.mutedForeground} />
              <Text style={[styles.cityOptionText, { color: c === city ? colors.accent : colors.foreground }]}>{c}</Text>
              {c === city && <Feather name="check" size={18} color={colors.accent} />}
            </Pressable>
          ))}
          <Text style={[styles.cityNote, { color: colors.mutedForeground }]}>
            More cities launching soon across Nigeria 🇳🇬
          </Text>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 0 },

  /* Hero */
  hero: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 16,
    borderBottomWidth: 1,
  },
  heroTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  heroGreet: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 4 },
  heroTitle: { fontSize: 24, fontFamily: "Inter_700Bold", lineHeight: 30 },
  cityBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  cityBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  heroCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  heroCtaText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#ffffff" },

  /* Sections */
  section: { paddingHorizontal: 20, paddingTop: 24, gap: 0 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 12 },
  changeCity: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  /* Order cards */
  orderCard: { padding: 14, marginBottom: 8, borderLeftWidth: 3, gap: 7 },
  orderTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderNum: { fontSize: 14, fontFamily: "Inter_700Bold" },
  statusChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  orderAddr: { fontSize: 12, fontFamily: "Inter_400Regular" },
  orderBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  orderAmt: { fontSize: 16, fontFamily: "Inter_700Bold" },
  payNowChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12 },
  payNowText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#ffffff" },
  seeAllRow: { flexDirection: "row", alignItems: "center", gap: 4, paddingTop: 4 },
  seeAll: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  /* Laundromat cards */
  laundryCard: { flexDirection: "row", alignItems: "center", padding: 14, marginBottom: 10, gap: 12 },
  laundryAvatar: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  laundryInfo: { flex: 1, gap: 3 },
  laundryName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  laundryAddr: { fontSize: 12, fontFamily: "Inter_400Regular" },
  laundryMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  reviewCount: { fontSize: 11, fontFamily: "Inter_400Regular" },
  priceFrom: { fontSize: 11, fontFamily: "Inter_400Regular" },
  orderNowBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  emptyCard: { padding: 24, alignItems: "center" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },

  /* How it works */
  howCard: { padding: 4 },
  howRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  stepBadge: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  stepText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  howText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },

  /* City modal */
  citySheet: { flex: 1 },
  citySheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1 },
  citySheetTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  cityOption: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1 },
  cityOptionText: { flex: 1, fontSize: 16, fontFamily: "Inter_500Medium" },
  cityNote: { textAlign: "center", fontSize: 12, fontFamily: "Inter_400Regular", padding: 20, lineHeight: 18 },
});
