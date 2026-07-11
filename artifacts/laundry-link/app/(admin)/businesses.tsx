import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useOrders } from "@/contexts/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { SUBSCRIPTION_PLANS, getPlanName } from "@/lib/subscription";
import { SubscriptionTier } from "@/types";

const TIER_COLORS: Record<SubscriptionTier, string> = {
  STARTER:    "#6366f1",
  PRO:        "#f59e0b",
  ENTERPRISE: "#10b981",
};

const TIER_ICON: Record<SubscriptionTier, keyof typeof import("@expo/vector-icons").Feather.glyphMap> = {
  STARTER:    "star",
  PRO:        "zap",
  ENTERPRISE: "award",
};

/** Simulate a subscription tier from order volume (demo — no real billing data in admin view). */
function deriveTier(orderCount: number, revenue: number): SubscriptionTier {
  if (orderCount >= 30 || revenue >= 500000) return "ENTERPRISE";
  if (orderCount >= 8  || revenue >= 100000) return "PRO";
  return "STARTER";
}

interface BizSummary {
  id: string;
  name: string;
  orderCount: number;
  revenue: number;
  activeOrders: number;
  lastActivityAt: string | null;
  tier: SubscriptionTier;
}

export default function AdminBusinesses() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const { orders } = useOrders();
  const { isSuperAdmin } = useAdminAccess();

  const businesses = useMemo<BizSummary[]>(() => {
    const map = new Map<string, BizSummary>();
    for (const o of orders) {
      if (!map.has(o.businessId)) {
        map.set(o.businessId, {
          id: o.businessId,
          name: o.businessName,
          orderCount: 0,
          revenue: 0,
          activeOrders: 0,
          lastActivityAt: null,
          tier: "STARTER",
        });
      }
      const b = map.get(o.businessId)!;
      b.orderCount++;
      if (o.paidAt) b.revenue += o.totalAmount + o.deliveryFee;
      if (!["DELIVERED", "CANCELLED"].includes(o.status)) b.activeOrders++;
      if (!b.lastActivityAt || o.updatedAt > b.lastActivityAt) b.lastActivityAt = o.updatedAt;
    }
    const list = Array.from(map.values());
    for (const b of list) b.tier = deriveTier(b.orderCount, b.revenue);
    return list.sort((a, b) => b.orderCount - a.orderCount);
  }, [orders]);

  const tierCounts = useMemo(() => {
    const counts: Record<SubscriptionTier, number> = { STARTER: 0, PRO: 0, ENTERPRISE: 0 };
    for (const b of businesses) counts[b.tier]++;
    return counts;
  }, [businesses]);

  const totalRevenue = useMemo(() =>
    businesses.reduce((s, b) => s + b.revenue, 0), [businesses]);

  const shadow = {
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingBottom: insets.bottom + (Platform.OS === "web" ? 100 : 100),
        gap: 20,
        paddingTop: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Platform revenue summary ─────────────────────── */}
      <View style={{ paddingHorizontal: 16 }}>
        <View style={[styles.revenueCard, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
          <View>
            <Text style={styles.revLabel}>Platform Revenue (All Businesses)</Text>
            <Text style={styles.revValue}>₦{totalRevenue.toLocaleString()}</Text>
          </View>
          <View style={styles.revRight}>
            <Text style={styles.revSubLabel}>{businesses.length} Businesses</Text>
            <Text style={styles.revSubValue}>{businesses.reduce((s, b) => s + b.orderCount, 0)} Orders</Text>
          </View>
        </View>
      </View>

      {/* ── Subscription tier distribution ──────────────── */}
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Subscription Tier Distribution</Text>
        <View style={[styles.tierGrid, { backgroundColor: colors.card, borderRadius: colors.radius }, shadow]}>
          {SUBSCRIPTION_PLANS.map((plan, i) => {
            const count = tierCounts[plan.id];
            const color = TIER_COLORS[plan.id];
            const pct   = businesses.length > 0 ? Math.round((count / businesses.length) * 100) : 0;
            return (
              <View
                key={plan.id}
                style={[
                  styles.tierCell,
                  i < SUBSCRIPTION_PLANS.length - 1 && { borderRightWidth: 1, borderRightColor: colors.border },
                ]}
              >
                <View style={[styles.tierIcon, { backgroundColor: color + "18" }]}>
                  <Feather name={TIER_ICON[plan.id]} size={16} color={color} />
                </View>
                <Text style={[styles.tierCount, { color: colors.foreground }]}>{count}</Text>
                <Text style={[styles.tierName,  { color: color }]}>{plan.name}</Text>
                <Text style={[styles.tierPct,   { color: colors.mutedForeground }]}>{pct}%</Text>
              </View>
            );
          })}
        </View>

        {/* SaaS plan pricing reference (super admin only) */}
        {isSuperAdmin && (
          <View style={[styles.plansRef, { backgroundColor: colors.card, borderRadius: colors.radius, marginTop: 10 }, shadow]}>
            <Text style={[styles.plansRefTitle, { color: colors.mutedForeground }]}>
              SaaS Plan Pricing Reference
            </Text>
            {SUBSCRIPTION_PLANS.map((plan, i) => (
              <View
                key={plan.id}
                style={[
                  styles.planRow,
                  i < SUBSCRIPTION_PLANS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
              >
                <View style={[styles.planDot, { backgroundColor: TIER_COLORS[plan.id] }]} />
                <Text style={[styles.planName,  { color: colors.foreground }]}>{plan.name}</Text>
                <Text style={[styles.planPrice, { color: colors.mutedForeground }]}>
                  ₦{plan.monthlyPrice.toLocaleString()}/mo
                </Text>
                <Text style={[styles.planMeta, { color: colors.mutedForeground }]}>
                  {plan.maxOrders === Infinity ? "∞" : `≤${plan.maxOrders}`} orders
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ── Business list ────────────────────────────────── */}
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Registered Businesses ({businesses.length})
        </Text>

        {businesses.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderRadius: colors.radius }, shadow]}>
            <Feather name="briefcase" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Businesses Yet</Text>
            <Text style={[styles.emptyMsg, { color: colors.mutedForeground }]}>
              Businesses appear here once orders are placed through the platform.
            </Text>
          </View>
        ) : (
          businesses.map((biz) => {
            const tierColor = TIER_COLORS[biz.tier];
            const plan      = SUBSCRIPTION_PLANS.find((p) => p.id === biz.tier);
            return (
              <View
                key={biz.id}
                style={[styles.bizCard, { backgroundColor: colors.card, borderRadius: colors.radius }, shadow]}
              >
                {/* Top */}
                <View style={styles.bizTop}>
                  <View style={[styles.bizIcon, { backgroundColor: colors.primary + "14" }]}>
                    <Feather name="briefcase" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.bizInfo}>
                    <Text style={[styles.bizName, { color: colors.foreground }]} numberOfLines={1}>
                      {biz.name}
                    </Text>
                    <Text style={[styles.bizId, { color: colors.mutedForeground }]}>
                      ID: {biz.id}
                    </Text>
                  </View>
                  <View style={[styles.verifiedBadge, { backgroundColor: "#10b98114" }]}>
                    <Feather name="check-circle" size={11} color="#10b981" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                </View>

                {/* Stats row */}
                <View style={[styles.bizStats, { borderTopColor: colors.border }]}>
                  <View style={styles.statItem}>
                    <Feather name="package" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.statText, { color: colors.mutedForeground }]}>
                      {biz.orderCount} orders
                    </Text>
                  </View>
                  {biz.activeOrders > 0 && (
                    <View style={styles.statItem}>
                      <Feather name="activity" size={13} color="#f59e0b" />
                      <Text style={[styles.statText, { color: "#f59e0b" }]}>
                        {biz.activeOrders} active
                      </Text>
                    </View>
                  )}
                  <View style={styles.statItem}>
                    <Feather name="trending-up" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.statText, { color: colors.mutedForeground }]}>
                      ₦{biz.revenue.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Subscription tier */}
                <View style={[styles.tierRow, { borderTopColor: colors.border }]}>
                  <View style={[styles.tierChip, { backgroundColor: tierColor + "18" }]}>
                    <Feather name={TIER_ICON[biz.tier]} size={12} color={tierColor} />
                    <Text style={[styles.tierChipText, { color: tierColor }]}>
                      {getPlanName(biz.tier)} Plan
                    </Text>
                  </View>
                  <Text style={[styles.tierPrice, { color: colors.mutedForeground }]}>
                    ₦{plan?.monthlyPrice.toLocaleString()}/mo
                  </Text>
                  {biz.lastActivityAt && (
                    <Text style={[styles.lastSeen, { color: colors.mutedForeground }]}>
                      Last: {new Date(biz.lastActivityAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>

                {/* Super admin actions */}
                {isSuperAdmin && (
                  <View style={[styles.adminActions, { borderTopColor: colors.border }]}>
                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: colors.accent + "10" }]}
                    >
                      <Feather name="edit-2" size={12} color={colors.accent} />
                      <Text style={[styles.actionText, { color: colors.accent }]}>Edit Plan</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: "#ef444410" }]}
                    >
                      <Feather name="slash" size={12} color="#ef4444" />
                      <Text style={[styles.actionText, { color: "#ef4444" }]}>Suspend</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      <Text style={[styles.footNote, { color: colors.mutedForeground }]}>
        Subscription tiers are simulated from order volume. Live billing is via Paystack webhooks.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 12 },

  revenueCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 20 },
  revLabel:    { fontSize: 11, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.65)", marginBottom: 4 },
  revValue:    { fontSize: 26, fontFamily: "Inter_700Bold", color: "#ffffff" },
  revRight:    { alignItems: "flex-end", gap: 4 },
  revSubLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)" },
  revSubValue: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#ffffff" },

  tierGrid: { flexDirection: "row", padding: 16 },
  tierCell: { flex: 1, alignItems: "center", gap: 6, paddingHorizontal: 8 },
  tierIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  tierCount: { fontSize: 22, fontFamily: "Inter_700Bold" },
  tierName:  { fontSize: 11, fontFamily: "Inter_700Bold" },
  tierPct:   { fontSize: 11, fontFamily: "Inter_400Regular" },

  plansRef:      { padding: 14 },
  plansRefTitle: { fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  planRow:       { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9 },
  planDot:       { width: 8, height: 8, borderRadius: 4 },
  planName:      { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1 },
  planPrice:     { fontSize: 12, fontFamily: "Inter_500Medium" },
  planMeta:      { fontSize: 11, fontFamily: "Inter_400Regular", width: 72, textAlign: "right" },

  emptyCard:  { alignItems: "center", padding: 48, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyMsg:   { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },

  bizCard: { marginBottom: 10, overflow: "hidden" },
  bizTop:  { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  bizIcon: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  bizInfo: { flex: 1 },
  bizName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  bizId:   { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },

  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  verifiedText:  { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#10b981" },

  bizStats: { flexDirection: "row", gap: 16, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  statText: { fontSize: 12, fontFamily: "Inter_400Regular" },

  tierRow:     { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  tierChip:    { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tierChipText:{ fontSize: 12, fontFamily: "Inter_700Bold" },
  tierPrice:   { fontSize: 12, fontFamily: "Inter_400Regular" },
  lastSeen:    { fontSize: 11, fontFamily: "Inter_400Regular", marginLeft: "auto" as any },

  adminActions: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  actionBtn:    { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  actionText:   { fontSize: 11, fontFamily: "Inter_700Bold" },

  footNote: { textAlign: "center", fontSize: 11, fontFamily: "Inter_400Regular", fontStyle: "italic", paddingHorizontal: 24, lineHeight: 16, paddingBottom: 8 },
});
