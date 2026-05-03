import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
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

export default function CustomerHome() {
  const colors = useColors();
  const { user } = useAuth();
  const { orders } = useOrders();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

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
    >
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={[styles.hello, { color: colors.mutedForeground }]}>Hello, {firstName} 👋</Text>
        <Text style={[styles.heroText, { color: colors.foreground }]}>Fresh laundry, delivered.</Text>
      </View>

      {/* Active order indicator */}
      {activeOrders.length > 0 && (
        <Pressable
          onPress={() => router.push("/(customer)/orders" as any)}
          style={[styles.activeBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30", borderRadius: colors.radius }]}
        >
          <View style={[styles.activeDot, { backgroundColor: "#10b981" }]} />
          <Text style={[styles.activeBannerText, { color: colors.primary }]}>
            {activeOrders.length} active order{activeOrders.length > 1 ? "s" : ""} — tap to track
          </Text>
          <Feather name="chevron-right" size={14} color={colors.primary} />
        </Pressable>
      )}

      {/* CTA */}
      <Pressable
        onPress={handleNewOrder}
        style={[styles.ctaCard, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
      >
        <View>
          <Text style={[styles.ctaTitle, { color: colors.primaryForeground }]}>Place a new order</Text>
          <Text style={[styles.ctaSub, { color: colors.primaryForeground + "cc" }]}>
            Pickup + wash + delivery · flat ₦1,500 fee
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
          { step: "2", text: "We pick up your laundry at your door", icon: "shopping-bag" as const },
          { step: "3", text: "Cleaned and pressed at the laundromat", icon: "wind" as const },
          { step: "4", text: "Pay & we deliver back to your address", icon: "truck" as const },
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

      {/* Nearby laundromats */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Nearby Laundromats</Text>
      {[
        { name: "CleanPro Laundry Abuja", dist: "0.3 km", rating: "4.8", reviews: 120 },
        { name: "FreshWash Express", dist: "0.8 km", rating: "4.6", reviews: 84 },
        { name: "SparkleClean Maitama", dist: "1.4 km", rating: "4.7", reviews: 61 },
      ].map((biz) => (
        <Pressable
          key={biz.name}
          onPress={handleNewOrder}
          style={[styles.laundryCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}
        >
          <View style={[styles.laundryAvatar, { backgroundColor: colors.primary + "14", borderRadius: colors.radius - 2 }]}>
            <Feather name="home" size={20} color={colors.primary} />
          </View>
          <View style={styles.laundryInfo}>
            <Text style={[styles.laundryName, { color: colors.foreground }]}>{biz.name}</Text>
            <Text style={[styles.laundryAddress, { color: colors.mutedForeground }]}>{biz.dist} away</Text>
            <View style={styles.ratingRow}>
              <Feather name="star" size={12} color="#f59e0b" />
              <Text style={[styles.ratingText, { color: colors.foreground }]}>{biz.rating}</Text>
              <Text style={[styles.reviewCount, { color: colors.mutedForeground }]}>({biz.reviews} reviews)</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  greeting: { marginBottom: 16 },
  hello: { fontSize: 14, fontFamily: "Inter_500Medium", marginBottom: 4 },
  heroText: { fontSize: 26, fontFamily: "Inter_700Bold" },
  activeBanner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderWidth: 1, marginBottom: 14 },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  activeBannerText: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  ctaCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, marginBottom: 24 },
  ctaTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 4 },
  ctaSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  ctaArrow: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  servicesGrid: { flexDirection: "row", gap: 10, marginBottom: 24 },
  serviceCard: { flex: 1, alignItems: "center", paddingVertical: 16, paddingHorizontal: 8, gap: 8 },
  serviceIcon: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  serviceLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textAlign: "center" },
  howCard: { padding: 4, marginBottom: 24 },
  howRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  stepBadge: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  stepText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  howText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  laundryCard: { flexDirection: "row", alignItems: "center", padding: 14, marginBottom: 10, gap: 12 },
  laundryAvatar: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  laundryInfo: { flex: 1 },
  laundryName: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  laundryAddress: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 4 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  reviewCount: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
