import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StatCardSkeleton } from "@/components/SkeletonLoader";
import { useOrders } from "@/contexts/OrdersContext";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription";
import { useColors } from "@/hooks/useColors";

export default function AdminDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders, isLoading } = useOrders();

  const stats = useMemo(() => {
    const active = orders.filter((o) =>
      !["DELIVERED", "CANCELLED"].includes(o.status),
    ).length;
    const paid = orders.filter((o) => o.status === "PAID" || o.paidAt).length;
    const totalRevenue = orders
      .filter((o) => o.paidAt)
      .reduce((s, o) => s + o.totalAmount + o.deliveryFee, 0);
    const dispatchers = new Set(orders.map((o) => o.dispatcherId).filter(Boolean)).size;
    const customers = new Set(orders.map((o) => o.customerId)).size;
    const avgOrder = paid > 0 ? Math.round(totalRevenue / paid) : 0;

    return { active, paid, totalRevenue, dispatchers, customers, totalOrders: orders.length, avgOrder };
  }, [orders]);

  const STAT_CARDS = [
    { label: "Total Orders",   value: String(stats.totalOrders),                      icon: "package"      as const, color: colors.primary },
    { label: "Active Orders",  value: String(stats.active),                            icon: "activity"     as const, color: "#f59e0b" },
    { label: "Customers",      value: String(stats.customers),                         icon: "users"        as const, color: "#6366f1" },
    { label: "Dispatchers",    value: String(stats.dispatchers),                       icon: "truck"        as const, color: "#10b981" },
    { label: "Paid Orders",    value: String(stats.paid),                              icon: "check-circle" as const, color: colors.accent },
    { label: "Total Revenue",  value: `₦${(stats.totalRevenue / 1000).toFixed(1)}k`,  icon: "trending-up"  as const, color: "#10b981" },
  ];

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of orders) {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [orders]);

  const STATUS_COLORS: Record<string, string> = {
    PENDING:          "#f59e0b",
    ACCEPTED:         "#6366f1",
    PICKED_UP:        "#3b82f6",
    IN_PROGRESS:      "#8b5cf6",
    READY:            "#10b981",
    PAID:             "#059669",
    OUT_FOR_DELIVERY: "#0ea5e9",
    DELIVERED:        "#10b981",
    CANCELLED:        "#ef4444",
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        gap: 20,
        paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100),
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero strip */}
      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <View style={styles.heroIcon}>
          <Feather name="shield" size={24} color={colors.accent} />
        </View>
        <View>
          <Text style={styles.heroTitle}>Admin Dashboard</Text>
          <Text style={styles.heroSub}>LaundryLink · Real-time platform overview</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, gap: 20 }}>
        {/* Stat grid */}
        <View style={styles.statsGrid}>
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
            : STAT_CARDS.map((stat) => (
              <View
                key={stat.label}
                style={[styles.statCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}
              >
                <View style={[styles.statIcon, { backgroundColor: stat.color + "16", borderRadius: colors.radius - 4 }]}>
                  <Feather name={stat.icon} size={18} color={stat.color} />
                </View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
              </View>
            ))}
        </View>

        {/* Revenue highlight */}
        {stats.totalRevenue > 0 && (
          <View style={[styles.revenueCard, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
            <View>
              <Text style={styles.revenueLabel}>Gross Revenue (Paid Orders)</Text>
              <Text style={styles.revenueValue}>₦{stats.totalRevenue.toLocaleString()}</Text>
            </View>
            <View style={styles.revenueRight}>
              <Text style={styles.avgLabel}>Avg. Order</Text>
              <Text style={styles.avgValue}>₦{stats.avgOrder.toLocaleString()}</Text>
            </View>
          </View>
        )}

        {/* Order status breakdown */}
        {statusBreakdown.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Orders by Status</Text>
            {statusBreakdown.map(([status, count]) => {
              const pct = orders.length > 0 ? (count / orders.length) * 100 : 0;
              const color = STATUS_COLORS[status] ?? colors.primary;
              return (
                <View key={status} style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: color }]} />
                  <Text style={[styles.statusLabel, { color: colors.foreground }]}>
                    {status.replace(/_/g, " ")}
                  </Text>
                  <View style={styles.barWrap}>
                    <View style={[styles.barFill, { backgroundColor: color, width: `${pct}%` as any }]} />
                  </View>
                  <Text style={[styles.statusCount, { color: colors.mutedForeground }]}>{count}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* SaaS Plans reference */}
        <View style={[styles.section, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>SaaS Subscription Tiers</Text>
          {SUBSCRIPTION_PLANS.map((plan, i) => (
            <View
              key={plan.id}
              style={[
                styles.planRow,
                {
                  borderBottomColor: colors.border,
                  borderBottomWidth: i < SUBSCRIPTION_PLANS.length - 1 ? 1 : 0,
                },
              ]}
            >
              <View style={[styles.planBadge, { backgroundColor: colors.accent + "18" }]}>
                <Text style={[styles.planBadgeText, { color: colors.accent }]}>{plan.name}</Text>
              </View>
              <Text style={[styles.planPrice, { color: colors.foreground }]}>
                ₦{plan.monthlyPrice.toLocaleString()}/mo
              </Text>
              <Text style={[styles.planOrders, { color: colors.mutedForeground }]}>
                {plan.maxOrders === Infinity ? "Unlimited" : `≤${plan.maxOrders}`} orders
              </Text>
            </View>
          ))}
          <Text style={[styles.mrrNote, { color: colors.mutedForeground }]}>
            Revenue figures reflect P2P payments confirmed through orders, not subscription fees.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#ffffff" },
  heroSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.65)", marginTop: 2 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "47%", flexGrow: 1, padding: 16, gap: 8 },
  statIcon: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 24, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  revenueCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  revenueLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.65)", marginBottom: 4 },
  revenueValue: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#ffffff" },
  revenueRight: { alignItems: "flex-end" },
  avgLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)", marginBottom: 2 },
  avgValue: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#ffffff" },
  section: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 4 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { width: 118, fontSize: 12, fontFamily: "Inter_500Medium" },
  barWrap: { flex: 1, height: 6, backgroundColor: "rgba(0,0,0,0.06)", borderRadius: 3, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },
  statusCount: { width: 26, fontSize: 12, fontFamily: "Inter_700Bold", textAlign: "right" },
  planRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11 },
  planBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  planBadgeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  planPrice: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  planOrders: { fontSize: 12, fontFamily: "Inter_400Regular" },
  mrrNote: { fontSize: 11, fontFamily: "Inter_400Regular", fontStyle: "italic", marginTop: 4, lineHeight: 16 },
});
