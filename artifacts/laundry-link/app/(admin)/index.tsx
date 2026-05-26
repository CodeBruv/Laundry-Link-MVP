import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/contexts/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b", ACCEPTED: "#6366f1", PICKED_UP: "#3b82f6",
  IN_PROGRESS: "#8b5cf6", READY: "#10b981", PAID: "#059669",
  OUT_FOR_DELIVERY: "#0ea5e9", DELIVERED: "#10b981", CANCELLED: "#ef4444",
};

export default function AdminDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { orders, isLoading } = useOrders();
  const { isSuperAdmin, adminTier } = useAdminAccess();

  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] || "Admin";

  const handleSignOut = () => {
    if (Platform.OS === "web") { signOut(); return; }
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  const stats = useMemo(() => {
    const active   = orders.filter((o) => !["DELIVERED","CANCELLED"].includes(o.status)).length;
    const paid     = orders.filter((o) => o.status === "PAID" || o.paidAt).length;
    const revenue  = orders.filter((o) => o.paidAt).reduce((s, o) => s + o.totalAmount + o.deliveryFee, 0);
    const dispatchers = new Set(orders.map((o) => o.dispatcherId).filter(Boolean)).size;
    const customers   = new Set(orders.map((o) => o.customerId)).size;
    const businesses  = new Set(orders.map((o) => o.businessId)).size;
    const avgOrder    = paid > 0 ? Math.round(revenue / paid) : 0;
    return { active, paid, revenue, dispatchers, customers, businesses, total: orders.length, avgOrder };
  }, [orders]);

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of orders) counts[o.status] = (counts[o.status] ?? 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 7);
  }, [orders]);

  const shadow = { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 };

  const STAT_CARDS = [
    { label: "Total Orders",    value: String(stats.total),       icon: "package"      as const, color: colors.primary },
    { label: "Active Orders",   value: String(stats.active),      icon: "activity"     as const, color: "#f59e0b" },
    { label: "Customers",       value: String(stats.customers),   icon: "users"        as const, color: "#6366f1" },
    { label: "Businesses",      value: String(stats.businesses),  icon: "briefcase"    as const, color: "#8b5cf6" },
    { label: "Dispatchers",     value: String(stats.dispatchers), icon: "truck"        as const, color: "#10b981" },
    { label: "Paid Orders",     value: String(stats.paid),        icon: "check-circle" as const, color: colors.accent },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100) }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Bright hero ───────────────────────────────────────── */}
      <View style={[styles.hero, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.heroRow}>
          <View>
            <Text style={[styles.heroGreet, { color: colors.mutedForeground }]}>Welcome back, {firstName}</Text>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>Admin Dashboard</Text>
            <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>LaundryLink · Real-time platform overview</Text>
          </View>
            <View style={{ alignItems: "center", gap: 8 }}>
            <View style={[styles.heroIcon, { backgroundColor: colors.primary + "12" }]}>
              <Feather name="shield" size={24} color={colors.primary} />
            </View>
            <Pressable
              onPress={handleSignOut}
              style={[styles.signOutBtn, { borderColor: "#ef444430" }]}
            >
              <Feather name="log-out" size={13} color="#ef4444" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
          </View>
        </View>

        {/* Admin tier badge */}
        <View style={styles.badgeRow}>
          <View style={[
            styles.tierBadge,
            { backgroundColor: isSuperAdmin ? "#f59e0b14" : colors.accent + "12",
              borderColor: isSuperAdmin ? "#f59e0b40" : colors.accent + "30" },
          ]}>
            <Feather name={isSuperAdmin ? "star" : "user-check"} size={12} color={isSuperAdmin ? "#f59e0b" : colors.accent} />
            <Text style={[styles.tierText, { color: isSuperAdmin ? "#f59e0b" : colors.accent }]}>
              {isSuperAdmin ? "Super Admin — Full Access" : "Staff Admin — Limited Access"}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, gap: 20, paddingTop: 20 }}>
        {/* ── Stats grid ─────────────────────────────────────── */}
        {isLoading ? (
          <View style={styles.statsGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={[styles.statCard, { backgroundColor: colors.card, borderRadius: colors.radius }, shadow]}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.muted }} />
                <View style={{ width: 48, height: 24, borderRadius: 6, backgroundColor: colors.muted, marginTop: 8 }} />
                <View style={{ width: 72, height: 12, borderRadius: 4, backgroundColor: colors.muted, marginTop: 6 }} />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.statsGrid}>
            {STAT_CARDS.map((s) => (
              <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderRadius: colors.radius }, shadow]}>
                <View style={[styles.statIcon, { backgroundColor: s.color + "16" }]}>
                  <Feather name={s.icon} size={18} color={s.color} />
                </View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Revenue highlight card ─────────────────────────── */}
        {stats.revenue > 0 && (
          <View style={[styles.revenueCard, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
            <View>
              <Text style={styles.revLabel}>Gross Revenue (Paid Orders)</Text>
              <Text style={styles.revValue}>₦{stats.revenue.toLocaleString()}</Text>
            </View>
            <View style={styles.revRight}>
              <Text style={styles.avgLabel}>Avg. Order</Text>
              <Text style={styles.avgValue}>₦{stats.avgOrder.toLocaleString()}</Text>
            </View>
          </View>
        )}

        {/* ── Order status breakdown ─────────────────────────── */}
        {statusBreakdown.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card, borderRadius: colors.radius }, shadow]}>
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
                  <View style={[styles.barWrap, { backgroundColor: colors.muted }]}>
                    <View style={[styles.barFill, { backgroundColor: color, width: `${pct}%` as any }]} />
                  </View>
                  <Text style={[styles.statusCount, { color: colors.mutedForeground }]}>{count}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── SaaS plans (super admin only) ─────────────────── */}
        {isSuperAdmin && (
          <View style={[styles.section, { backgroundColor: colors.card, borderRadius: colors.radius }, shadow]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>SaaS Subscription Tiers</Text>
            {SUBSCRIPTION_PLANS.map((plan, i) => (
              <View
                key={plan.id}
                style={[styles.planRow, { borderBottomColor: colors.border, borderBottomWidth: i < SUBSCRIPTION_PLANS.length - 1 ? 1 : 0 }]}
              >
                <View style={[styles.planBadge, { backgroundColor: colors.accent + "14" }]}>
                  <Text style={[styles.planBadgeText, { color: colors.accent }]}>{plan.name}</Text>
                </View>
                <Text style={[styles.planPrice, { color: colors.foreground }]}>₦{plan.monthlyPrice.toLocaleString()}/mo</Text>
                <Text style={[styles.planOrders, { color: colors.mutedForeground }]}>
                  {plan.maxOrders === Infinity ? "Unlimited" : `≤${plan.maxOrders}`} orders
                </Text>
              </View>
            ))}
            <Text style={[styles.mrrNote, { color: colors.mutedForeground }]}>
              Revenue figures reflect P2P payments confirmed through orders, not subscription fees.
            </Text>
          </View>
        )}

        {/* Quick links */}
        <View style={[styles.section, { backgroundColor: colors.card, borderRadius: colors.radius }, shadow]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
          {[
            { icon: "users" as const, label: "Manage Users", sub: "View, add, suspend or delete users" },
            { icon: "package" as const, label: "All Orders", sub: "Monitor and filter platform-wide orders" },
            { icon: "trending-up" as const, label: "Analytics", sub: "Revenue charts & system performance" },
          ].map((item, i, arr) => (
            <View key={item.label} style={[styles.quickRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={[styles.quickIcon, { backgroundColor: colors.accent + "10" }]}>
                <Feather name={item.icon} size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.quickLabel, { color: colors.foreground }]}>{item.label}</Text>
                <Text style={[styles.quickSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, gap: 14, borderBottomWidth: 1 },
  heroRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  heroGreet: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 3 },
  heroTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 2 },
  heroSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  heroIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  signOutBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  signOutText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#ef4444" },
  badgeRow: { flexDirection: "row" },
  tierBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  tierText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "47%", flexGrow: 1, padding: 16, gap: 8 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 24, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  revenueCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 20 },
  revLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.65)", marginBottom: 4 },
  revValue: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#ffffff" },
  revRight: { alignItems: "flex-end" },
  avgLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)", marginBottom: 2 },
  avgValue: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#ffffff" },
  section: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 4 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { width: 120, fontSize: 12, fontFamily: "Inter_500Medium" },
  barWrap: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },
  statusCount: { width: 26, fontSize: 12, fontFamily: "Inter_700Bold", textAlign: "right" },
  planRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11 },
  planBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  planBadgeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  planPrice: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  planOrders: { fontSize: 12, fontFamily: "Inter_400Regular" },
  mrrNote: { fontSize: 11, fontFamily: "Inter_400Regular", fontStyle: "italic", lineHeight: 16 },
  quickRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  quickIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  quickSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});
