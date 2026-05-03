import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SubscriptionPaywall } from "@/components/SubscriptionPaywall";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/contexts/OrdersContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useColors } from "@/hooks/useColors";
import { daysLeft } from "@/lib/subscription";

export default function BusinessDashboard() {
  const colors = useColors();
  const { user } = useAuth();
  const { orders } = useOrders();
  const { subscription, isSubscribed, isLoading } = useSubscription();
  const insets = useSafeAreaInsets();
  const [showPaywall, setShowPaywall] = useState(false);

  const businessName = user?.user_metadata?.full_name || "Your Business";
  const completed = orders.filter((o) => o.status === "DELIVERED").length;
  const pending = orders.filter((o) => o.status === "PENDING").length;
  const paid = orders.filter((o) => o.status === "PAID").length;
  const revenue = orders
    .filter((o) => o.status === "PAID" || o.status === "DELIVERED")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const stats = [
    { label: "Total Orders", value: String(orders.length), icon: "package" as const, color: colors.primary },
    { label: "Pending", value: String(pending), icon: "clock" as const, color: "#f59e0b" },
    { label: "Completed", value: String(completed), icon: "check-circle" as const, color: "#22c55e" },
    { label: "Paid Orders", value: String(paid), icon: "dollar-sign" as const, color: "#059669" },
    { label: "Revenue", value: `₦${revenue.toLocaleString()}`, icon: "trending-up" as const, color: colors.accent },
  ];

  const days = daysLeft(subscription);

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Subscription status banner */}
        {!isLoading && (
          <Pressable
            onPress={() => setShowPaywall(true)}
            style={[
              styles.subBanner,
              {
                backgroundColor: isSubscribed ? "#10b98112" : colors.primary + "12",
                borderColor: isSubscribed ? "#10b98140" : colors.primary + "40",
                borderRadius: colors.radius,
              },
            ]}
          >
            <Feather
              name={isSubscribed ? "check-circle" : "zap"}
              size={16}
              color={isSubscribed ? "#10b981" : colors.primary}
            />
            <Text style={[styles.subBannerText, { color: isSubscribed ? "#10b981" : colors.primary }]}>
              {isSubscribed
                ? `${subscription.isTrial ? "Trial" : subscription.tier} plan · ${days}d remaining`
                : "No active subscription — tap to subscribe"}
            </Text>
            <Feather name="chevron-right" size={14} color={isSubscribed ? "#10b981" : colors.primary} />
          </Pressable>
        )}

        {/* Greeting */}
        <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Welcome back</Text>
        <Text style={[styles.businessName, { color: colors.foreground }]}>{businessName}</Text>

        {/* Subscription gate */}
        {!isLoading && !isSubscribed ? (
          <View style={[styles.gateCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            <Feather name="lock" size={32} color={colors.primary} />
            <Text style={[styles.gateTitle, { color: colors.foreground }]}>Dashboard locked</Text>
            <Text style={[styles.gateText, { color: colors.mutedForeground }]}>
              Subscribe to unlock your business dashboard, accept orders, assign dispatchers, and grow your laundry business.
            </Text>
            <Pressable
              onPress={() => setShowPaywall(true)}
              style={[styles.gateBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
            >
              <Feather name="zap" size={16} color={colors.primaryForeground} />
              <Text style={[styles.gateBtnText, { color: colors.primaryForeground }]}>
                Start 7-Day Free Trial
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Stats grid */}
            <View style={styles.statsGrid}>
              {stats.map((stat) => (
                <View
                  key={stat.label}
                  style={[styles.statCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}
                >
                  <Feather name={stat.icon} size={16} color={stat.color} />
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {/* Activity hint */}
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Operations</Text>
            <View style={[styles.activityCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
              <Feather name="inbox" size={28} color={colors.mutedForeground} />
              <Text style={[styles.activityText, { color: colors.mutedForeground }]}>
                {orders.length === 0
                  ? "No orders yet. Customer orders will appear in the Orders tab."
                  : "Open the Orders tab to accept, assign dispatchers, and update order status."}
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Paywall modal */}
      <Modal visible={showPaywall} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPaywall(false)}>
        <View style={[styles.paywallSheet, { backgroundColor: colors.background }]}>
          <View style={[styles.paywallHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.paywallHeaderTitle, { color: colors.foreground }]}>Subscription</Text>
            <Pressable onPress={() => setShowPaywall(false)} style={styles.paywallClose}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <SubscriptionPaywall onClose={() => setShowPaywall(false)} onSuccess={() => setShowPaywall(false)} />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  subBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    marginBottom: 20,
  },
  subBannerText: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  greeting: { fontSize: 14, fontFamily: "Inter_500Medium", marginBottom: 4 },
  businessName: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 20 },
  gateCard: { alignItems: "center", padding: 32, gap: 14 },
  gateTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  gateText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  gateBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 14, marginTop: 4 },
  gateBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  statCard: { width: "47%", flexGrow: 1, padding: 16, gap: 8 },
  statValue: { fontSize: 24, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  activityCard: { alignItems: "center", padding: 32, gap: 12 },
  activityText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  paywallSheet: { flex: 1 },
  paywallHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1 },
  paywallHeaderTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  paywallClose: { padding: 4 },
});
