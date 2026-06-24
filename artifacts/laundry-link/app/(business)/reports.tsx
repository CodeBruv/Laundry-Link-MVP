import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useOrders } from "@/contexts/OrdersContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useColors } from "@/hooks/useColors";
import { OrderItem } from "@/types";

type Range = "today" | "7d" | "30d" | "all";

const RANGES: { id: Range; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "all", label: "All Time" },
];

function startOf(range: Range): Date {
  const d = new Date();
  if (range === "today") { d.setHours(0, 0, 0, 0); return d; }
  if (range === "7d") { d.setDate(d.getDate() - 7); return d; }
  if (range === "30d") { d.setDate(d.getDate() - 30); return d; }
  return new Date(0);
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={barStyles.track}>
      <View style={[barStyles.fill, { width: `${Math.max(pct, 2)}%` as any, backgroundColor: color }]} />
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: { height: 8, backgroundColor: "rgba(0,0,0,0.06)", borderRadius: 4, overflow: "hidden", flex: 1 },
  fill: { height: "100%", borderRadius: 4 },
});

export default function BusinessReports() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders, isLoading, refreshOrders } = useOrders();
  const { isSubscribed } = useSubscription();
  const [range, setRange] = useState<Range>("30d");

  const filtered = useMemo(() => {
    const since = startOf(range);
    return orders.filter((o) => new Date(o.createdAt) >= since);
  }, [orders, range]);

  const completed = filtered.filter((o) => ["PAID", "DELIVERED", "OUT_FOR_DELIVERY"].includes(o.status));
  const revenue = completed.reduce((s, o) => s + o.totalAmount, 0);
  const serviceRevenue = completed.reduce((s, o) => s + (o.totalAmount - o.deliveryFee), 0);
  const deliveryRevenue = completed.reduce((s, o) => s + o.deliveryFee, 0);

  const byService = useMemo(() => {
    const map: Record<string, { qty: number; revenue: number }> = {};
    completed.forEach((o) => {
      o.items.forEach((item: OrderItem) => {
        if (!map[item.serviceName]) map[item.serviceName] = { qty: 0, revenue: 0 };
        map[item.serviceName].qty += item.quantity;
        map[item.serviceName].revenue += item.total;
      });
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [completed]);

  const maxServiceRev = byService[0]?.revenue ?? 1;

  const statusCounts = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((o) => { map[o.status] = (map[o.status] ?? 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  if (!isSubscribed) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.gateCard, { backgroundColor: colors.card, borderRadius: colors.radius, margin: 20 }]}>
          <Feather name="lock" size={28} color={colors.primary} />
          <Text style={[styles.gateTitle, { color: colors.foreground }]}>Reports locked</Text>
          <Text style={[styles.gateSub, { color: colors.mutedForeground }]}>
            Subscribe to access revenue analytics and order breakdowns.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + (Platform.OS === "web" ? 100 : 90) }}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshOrders} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Analytics</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {filtered.length} orders in period
          </Text>
        </View>
        <View style={[styles.liveChip, { backgroundColor: "#05966914" }]}>
          <View style={[styles.liveDot, { backgroundColor: "#059669" }]} />
          <Text style={[styles.liveText, { color: "#059669" }]}>Live</Text>
        </View>
      </View>

      {/* Date range filter */}
      <View style={[styles.rangeRow, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
        {RANGES.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => setRange(r.id)}
            style={[
              styles.rangeBtn,
              range === r.id && { backgroundColor: colors.card, borderRadius: colors.radius - 2 },
            ]}
          >
            <Text style={[styles.rangeBtnText, { color: range === r.id ? colors.primary : colors.mutedForeground }]}>
              {r.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Summary cards */}
      <View style={styles.statsGrid}>
        <StatCard icon="trending-up" label="Total Revenue" value={`₦${revenue.toLocaleString()}`} color="#059669" colors={colors} />
        <StatCard icon="package" label="Orders" value={String(filtered.length)} color={colors.primary} colors={colors} />
        <StatCard icon="check-circle" label="Completed" value={String(completed.length)} color="#22c55e" colors={colors} />
        <StatCard icon="truck" label="Delivery Fees" value={`₦${deliveryRevenue.toLocaleString()}`} color={colors.accent} colors={colors} />
      </View>

      {/* Revenue split */}
      <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Revenue split</Text>
        <View style={styles.splitRow}>
          <View style={styles.splitItem}>
            <Text style={[styles.splitLabel, { color: colors.mutedForeground }]}>Services</Text>
            <Text style={[styles.splitValue, { color: colors.foreground }]}>₦{serviceRevenue.toLocaleString()}</Text>
          </View>
          <View style={[styles.splitDivider, { backgroundColor: colors.border }]} />
          <View style={styles.splitItem}>
            <Text style={[styles.splitLabel, { color: colors.mutedForeground }]}>Delivery</Text>
            <Text style={[styles.splitValue, { color: colors.foreground }]}>₦{deliveryRevenue.toLocaleString()}</Text>
          </View>
          <View style={[styles.splitDivider, { backgroundColor: colors.border }]} />
          <View style={styles.splitItem}>
            <Text style={[styles.splitLabel, { color: colors.mutedForeground }]}>Avg order</Text>
            <Text style={[styles.splitValue, { color: colors.foreground }]}>
              ₦{completed.length > 0 ? Math.round(revenue / completed.length).toLocaleString() : "—"}
            </Text>
          </View>
        </View>
      </View>

      {/* Top services */}
      {byService.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Revenue by service</Text>
          {byService.map((svc) => (
            <View key={svc.name} style={styles.serviceRow}>
              <View style={styles.serviceLeft}>
                <Text style={[styles.serviceName, { color: colors.foreground }]}>{svc.name}</Text>
                <Text style={[styles.serviceQty, { color: colors.mutedForeground }]}>{svc.qty} units</Text>
              </View>
              <View style={styles.serviceRight}>
                <Bar pct={(svc.revenue / maxServiceRev) * 100} color={colors.primary} />
                <Text style={[styles.serviceRevenue, { color: colors.primary }]}>
                  ₦{svc.revenue.toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Status breakdown */}
      {statusCounts.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Orders by status</Text>
          {statusCounts.map(([status, count]) => (
            <View key={status} style={styles.statusRow}>
              <View style={styles.statusLeft}>
                <Text style={[styles.statusLabel, { color: colors.foreground }]}>
                  {status.replaceAll("_", " ")}
                </Text>
              </View>
              <View style={styles.serviceRight}>
                <Bar pct={(count / filtered.length) * 100} color={colors.accent} />
                <Text style={[styles.statusCount, { color: colors.accent }]}>{count}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {filtered.length === 0 && (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <Feather name="bar-chart-2" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No orders in this period. Try a longer date range.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function StatCard({
  icon, label, value, color, colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  color: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
      <Feather name={icon} size={16} color={color} />
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

import { Platform } from "react-native";

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 2 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular" },
  liveChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  rangeRow: { flexDirection: "row", padding: 4, gap: 4, marginBottom: 16 },
  rangeBtn: { flex: 1, paddingVertical: 9, alignItems: "center" },
  rangeBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  statCard: { width: "47%", flexGrow: 1, padding: 14, gap: 6 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  card: { padding: 16, marginBottom: 12, gap: 12 },
  cardTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  splitRow: { flexDirection: "row", alignItems: "center" },
  splitItem: { flex: 1, alignItems: "center", gap: 4 },
  splitLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  splitValue: { fontSize: 15, fontFamily: "Inter_700Bold" },
  splitDivider: { width: 1, height: 36 },
  serviceRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  serviceLeft: { width: 110, gap: 2 },
  serviceName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  serviceQty: { fontSize: 11, fontFamily: "Inter_400Regular" },
  serviceRight: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  serviceRevenue: { fontSize: 12, fontFamily: "Inter_700Bold", minWidth: 70, textAlign: "right" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  statusLeft: { width: 110 },
  statusLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "capitalize" },
  statusCount: { fontSize: 13, fontFamily: "Inter_700Bold", minWidth: 30, textAlign: "right" },
  emptyCard: { alignItems: "center", padding: 32, gap: 12 },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  gateCard: { alignItems: "center", padding: 32, gap: 12 },
  gateTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  gateSub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
});
