import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useOrders } from "@/contexts/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { useAdminAccess } from "@/hooks/useAdminAccess";

function getLastNDays(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().split("T")[0];
  });
}

export default function AdminAnalytics() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders } = useOrders();
  const { isSuperAdmin } = useAdminAccess();

  const last7 = useMemo(() => getLastNDays(7), []);

  // Revenue per day (last 7 days)
  const dailyRevenue = useMemo(() => {
    const map = Object.fromEntries(last7.map((d) => [d, { revenue: 0, count: 0 }]));
    for (const o of orders) {
      const day = o.createdAt.split("T")[0];
      if (map[day]) {
        map[day].count++;
        if (o.paidAt) map[day].revenue += o.totalAmount + o.deliveryFee;
      }
    }
    return last7.map((d) => ({ day: d, ...map[d] }));
  }, [orders, last7]);

  const maxRevenue = Math.max(...dailyRevenue.map((d) => d.revenue), 1);
  const maxCount   = Math.max(...dailyRevenue.map((d) => d.count), 1);

  // Business performance
  const bizPerf = useMemo(() => {
    const map = new Map<string, { name: string; orders: number; revenue: number; dispatchers: Set<string> }>();
    for (const o of orders) {
      if (!map.has(o.businessId)) map.set(o.businessId, { name: o.businessName, orders: 0, revenue: 0, dispatchers: new Set() });
      const b = map.get(o.businessId)!;
      b.orders++;
      if (o.paidAt) b.revenue += o.totalAmount + o.deliveryFee;
      if (o.dispatcherId) b.dispatchers.add(o.dispatcherId);
    }
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((b) => ({ ...b, dispatchers: b.dispatchers.size }));
  }, [orders]);

  // Dispatcher performance
  const dispPerf = useMemo(() => {
    const map = new Map<string, { name: string; trips: number; revenue: number }>();
    for (const o of orders) {
      if (!o.dispatcherId || !o.assignedDriverName) continue;
      if (!map.has(o.dispatcherId)) map.set(o.dispatcherId, { name: o.assignedDriverName, trips: 0, revenue: 0 });
      const d = map.get(o.dispatcherId)!;
      d.trips++;
      if (o.status === "DELIVERED") d.revenue += o.deliveryFee;
    }
    return Array.from(map.values()).sort((a, b) => b.trips - a.trips).slice(0, 5);
  }, [orders]);

  // System health indicators
  const health = useMemo(() => {
    const total = orders.length;
    const delivered = orders.filter((o) => o.status === "DELIVERED").length;
    const cancelled = orders.filter((o) => o.status === "CANCELLED").length;
    const successRate = total > 0 ? Math.round((delivered / total) * 100) : 0;
    const cancelRate  = total > 0 ? Math.round((cancelled / total) * 100) : 0;
    const avgValue    = total > 0 ? Math.round(orders.reduce((s, o) => s + o.totalAmount, 0) / total) : 0;
    const urgent      = orders.filter((o) => o.urgent).length;
    return { successRate, cancelRate, avgValue, urgent };
  }, [orders]);

  const shadow = { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 };

  const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const fmtDay = (iso: string) => DAY_LABELS[new Date(iso).getDay()];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100), gap: 20, paddingTop: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Revenue chart (7 days) ────────────────────────── */}
      <View style={{ paddingHorizontal: 16 }}>
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }, shadow]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Revenue — Last 7 Days</Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                ₦{dailyRevenue.reduce((s, d) => s + d.revenue, 0).toLocaleString()} this week
              </Text>
            </View>
            <Feather name="trending-up" size={20} color={colors.accent} />
          </View>
          {/* Bar chart */}
          <View style={styles.chartWrap}>
            {dailyRevenue.map((d) => {
              const barH = maxRevenue > 0 ? Math.max(4, (d.revenue / maxRevenue) * 80) : 4;
              return (
                <View key={d.day} style={styles.barGroup}>
                  {d.revenue > 0 && (
                    <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>
                      {d.revenue >= 1000 ? `${(d.revenue / 1000).toFixed(0)}k` : d.revenue}
                    </Text>
                  )}
                  <View style={[styles.barOuter, { backgroundColor: colors.muted }]}>
                    <View style={[styles.barInner, { height: barH, backgroundColor: d.revenue > 0 ? colors.accent : colors.muted }]} />
                  </View>
                  <Text style={[styles.barDay, { color: colors.mutedForeground }]}>{fmtDay(d.day)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* ── Order volume chart (7 days) ────────────────────── */}
      <View style={{ paddingHorizontal: 16 }}>
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }, shadow]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Order Volume — Last 7 Days</Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                {dailyRevenue.reduce((s, d) => s + d.count, 0)} orders this week
              </Text>
            </View>
            <Feather name="package" size={20} color="#8b5cf6" />
          </View>
          <View style={styles.chartWrap}>
            {dailyRevenue.map((d) => {
              const barH = maxCount > 0 ? Math.max(4, (d.count / maxCount) * 80) : 4;
              return (
                <View key={d.day} style={styles.barGroup}>
                  {d.count > 0 && (
                    <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>{d.count}</Text>
                  )}
                  <View style={[styles.barOuter, { backgroundColor: colors.muted }]}>
                    <View style={[styles.barInner, { height: barH, backgroundColor: d.count > 0 ? "#8b5cf6" : colors.muted }]} />
                  </View>
                  <Text style={[styles.barDay, { color: colors.mutedForeground }]}>{fmtDay(d.day)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* ── System health ─────────────────────────────────── */}
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>System Health</Text>
        <View style={styles.healthGrid}>
          {[
            { label: "Success Rate",  value: `${health.successRate}%`,              icon: "check-circle" as const, color: "#10b981" },
            { label: "Cancel Rate",   value: `${health.cancelRate}%`,               icon: "x-circle"     as const, color: health.cancelRate > 15 ? "#ef4444" : "#f59e0b" },
            { label: "Avg. Order",    value: `₦${health.avgValue.toLocaleString()}`, icon: "tag"          as const, color: colors.accent },
            { label: "Urgent Orders", value: String(health.urgent),                  icon: "alert-circle" as const, color: "#f59e0b" },
          ].map((h) => (
            <View key={h.label} style={[styles.healthCard, { backgroundColor: colors.card, borderRadius: colors.radius }, shadow]}>
              <View style={[styles.healthIcon, { backgroundColor: h.color + "14" }]}>
                <Feather name={h.icon} size={18} color={h.color} />
              </View>
              <Text style={[styles.healthValue, { color: colors.foreground }]}>{h.value}</Text>
              <Text style={[styles.healthLabel, { color: colors.mutedForeground }]}>{h.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Business performance ─────────────────────────── */}
      {bizPerf.length > 0 && (
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Top Businesses</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }, shadow]}>
            {bizPerf.map((biz, i) => (
              <View
                key={biz.name}
                style={[styles.tableRow, i < bizPerf.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              >
                <View style={[styles.rankBadge, { backgroundColor: i === 0 ? "#f59e0b14" : colors.muted }]}>
                  <Text style={[styles.rankText, { color: i === 0 ? "#f59e0b" : colors.mutedForeground }]}>#{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bizName, { color: colors.foreground }]} numberOfLines={1}>{biz.name}</Text>
                  <Text style={[styles.bizMeta, { color: colors.mutedForeground }]}>
                    {biz.orders} orders · {biz.dispatchers} dispatcher{biz.dispatchers !== 1 ? "s" : ""}
                  </Text>
                </View>
                <Text style={[styles.bizRev, { color: colors.accent }]}>₦{(biz.revenue / 1000).toFixed(1)}k</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── Dispatcher performance (super admin only) ──────── */}
      {isSuperAdmin && dispPerf.length > 0 && (
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Dispatcher Performance</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }, shadow]}>
            {dispPerf.map((d, i) => (
              <View
                key={d.name}
                style={[styles.tableRow, i < dispPerf.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              >
                <View style={[styles.dispAvatar, { backgroundColor: "#10b98114" }]}>
                  <Feather name="truck" size={14} color="#10b981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bizName, { color: colors.foreground }]}>{d.name}</Text>
                  <Text style={[styles.bizMeta, { color: colors.mutedForeground }]}>{d.trips} trip{d.trips !== 1 ? "s" : ""}</Text>
                </View>
                <Text style={[styles.bizRev, { color: "#10b981" }]}>₦{d.revenue.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {!isSuperAdmin && (
        <View style={{ paddingHorizontal: 16 }}>
          <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius, alignItems: "center", gap: 8, padding: 24 }, shadow]}>
            <Feather name="lock" size={28} color={colors.mutedForeground} />
            <Text style={[styles.bizName, { color: colors.foreground, textAlign: "center" }]}>Dispatcher data is Super Admin only</Text>
            <Text style={[styles.bizMeta, { color: colors.mutedForeground, textAlign: "center" }]}>
              Unlock Super Admin access in Settings to view full analytics.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 12 },
  card: { padding: 16, gap: 16 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  cardTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 2 },
  cardSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  chartWrap: { flexDirection: "row", alignItems: "flex-end", gap: 8, height: 110 },
  barGroup: { flex: 1, alignItems: "center", gap: 4 },
  barLabel: { fontSize: 9, fontFamily: "Inter_600SemiBold" },
  barOuter: { width: "100%", borderRadius: 4, overflow: "hidden", height: 80, justifyContent: "flex-end" },
  barInner: { width: "100%", borderRadius: 4 },
  barDay: { fontSize: 10, fontFamily: "Inter_500Medium" },
  healthGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  healthCard: { width: "47%", flexGrow: 1, padding: 14, gap: 8 },
  healthIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  healthValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  healthLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  tableRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  rankBadge: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rankText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  dispAvatar: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  bizName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  bizMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  bizRev: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
