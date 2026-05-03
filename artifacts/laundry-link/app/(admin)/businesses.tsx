import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useOrders } from "@/contexts/OrdersContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SUBSCRIPTION_PLANS, getPlanName } from "@/lib/subscription";
import { useColors } from "@/hooks/useColors";

const TIER_COLORS: Record<string, string> = {
  STARTER: "#6366f1",
  PRO: "#f59e0b",
  ENTERPRISE: "#10b981",
};

export default function AdminBusinesses() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders } = useOrders();
  const { subscription } = useSubscription();

  const businesses = useMemo(() => {
    const map = new Map<string, { id: string; name: string; orderCount: number; revenue: number }>();
    for (const o of orders) {
      if (!map.has(o.businessId)) {
        map.set(o.businessId, { id: o.businessId, name: o.businessName, orderCount: 0, revenue: 0 });
      }
      const b = map.get(o.businessId)!;
      b.orderCount++;
      if (o.paidAt) b.revenue += o.totalAmount + o.deliveryFee;
    }
    return Array.from(map.values());
  }, [orders]);

  const currentTier = subscription.tier;
  const currentPlan = SUBSCRIPTION_PLANS.find((p) => p.id === currentTier);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        padding: 20,
        gap: 16,
        paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 90),
      }}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text style={[styles.title, { color: colors.foreground }]}>Businesses</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {businesses.length} registered laundromat{businesses.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* Current subscription status */}
      <View style={[styles.subCard, {
        backgroundColor: subscription.active ? colors.primary + "10" : "#ef444410",
        borderRadius: colors.radius,
        borderWidth: 1,
        borderColor: subscription.active ? colors.primary + "30" : "#ef444430",
      }]}>
        <View style={styles.subCardHeader}>
          <Feather
            name={subscription.active ? "check-circle" : "alert-circle"}
            size={20}
            color={subscription.active ? colors.primary : "#ef4444"}
          />
          <Text style={[styles.subCardTitle, {
            color: subscription.active ? colors.primary : "#ef4444",
          }]}>
            {subscription.active
              ? `${subscription.isTrial ? "Trial" : "Active"} — ${getPlanName(currentTier)} Plan`
              : "No Active Subscription"}
          </Text>
        </View>
        {currentPlan && (
          <View style={styles.subFeatures}>
            {currentPlan.features.slice(0, 3).map((f) => (
              <View key={f} style={styles.featureRow}>
                <Feather name="check" size={12} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.mutedForeground }]}>{f}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Business cards */}
      {businesses.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <Feather name="briefcase" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Businesses</Text>
          <Text style={[styles.emptyMsg, { color: colors.mutedForeground }]}>
            Registered laundromats will appear here once orders are placed.
          </Text>
        </View>
      ) : (
        businesses.map((biz) => (
          <View key={biz.id} style={[styles.bizCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            <View style={styles.bizTop}>
              <View style={[styles.bizIcon, { backgroundColor: colors.primary + "14" }]}>
                <Feather name="briefcase" size={22} color={colors.primary} />
              </View>
              <View style={styles.bizInfo}>
                <Text style={[styles.bizName, { color: colors.foreground }]}>{biz.name}</Text>
                <Text style={[styles.bizId, { color: colors.mutedForeground }]}>ID: {biz.id}</Text>
              </View>
              <View style={[styles.verifiedBadge, { backgroundColor: "#10b98118" }]}>
                <Feather name="check-circle" size={12} color="#10b981" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>

            <View style={[styles.bizFooter, { borderTopColor: colors.border }]}>
              <View style={styles.metaItem}>
                <Feather name="package" size={13} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                  {biz.orderCount} orders
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Feather name="trending-up" size={13} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                  ₦{biz.revenue.toLocaleString()} revenue
                </Text>
              </View>
            </View>

            {/* Subscription tier chip */}
            {currentTier && (
              <View style={[styles.tierRow, { borderTopColor: colors.border }]}>
                <View style={[styles.tierChip, { backgroundColor: (TIER_COLORS[currentTier] ?? colors.primary) + "18" }]}>
                  <Text style={[styles.tierText, { color: TIER_COLORS[currentTier] ?? colors.primary }]}>
                    {getPlanName(currentTier)} Plan
                  </Text>
                </View>
                <Text style={[styles.tierExpiry, { color: colors.mutedForeground }]}>
                  {subscription.active ? (subscription.isTrial ? "Trial" : "Active") : "Expired"}
                </Text>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular" },
  subCard: { padding: 16, gap: 12 },
  subCardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  subCardTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  subFeatures: { gap: 6 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  emptyCard: { alignItems: "center", padding: 48, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyMsg: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  bizCard: { overflow: "hidden" },
  bizTop: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  bizIcon: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  bizInfo: { flex: 1 },
  bizName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  bizId: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  verifiedText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#10b981" },
  bizFooter: { flexDirection: "row", gap: 16, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  tierRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  tierChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tierText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  tierExpiry: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
