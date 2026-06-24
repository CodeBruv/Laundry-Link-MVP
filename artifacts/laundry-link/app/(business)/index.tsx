import { Feather } from "@expo/vector-icons";
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

import { SubscriptionPaywall } from "@/components/SubscriptionPaywall";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/contexts/OrdersContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useColors } from "@/hooks/useColors";
import { daysLeft } from "@/lib/subscription";

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

export default function BusinessDashboard() {
  const colors = useColors();
  const { user } = useAuth();
  const { orders, isLoading, refreshOrders } = useOrders();
  const { subscription, isSubscribed, isLoading: subLoading } = useSubscription();
  const insets = useSafeAreaInsets();
  const [showPaywall, setShowPaywall] = useState(false);

  const businessName = user?.user_metadata?.full_name || "Your Business";
  const firstName = businessName.split(" ")[0];

  const completed = orders.filter((o) => o.status === "DELIVERED").length;
  const pending = orders.filter((o) => o.status === "PENDING").length;
  const activeCount = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status)).length;
  const revenue = orders
    .filter((o) => ["PAID", "DELIVERED", "OUT_FOR_DELIVERY"].includes(o.status))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const days = daysLeft(subscription);

  const recentOrders = orders
    .filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status))
    .slice(0, 3);

  const shadow = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  };

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 100 : 90) }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshOrders} tintColor={colors.accent} />}
      >
        {/* ── Bright hero ───────────────────────────────────────── */}
        <View style={[styles.hero, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroGreet, { color: colors.mutedForeground }]}>
                Welcome back, {firstName} 👋
              </Text>
              <Text style={[styles.heroTitle, { color: colors.foreground }]}>{businessName}</Text>
              <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>Business Dashboard</Text>
            </View>
            <View style={[styles.heroIcon, { backgroundColor: colors.primary + "10" }]}>
              <Feather name="briefcase" size={22} color={colors.primary} />
            </View>
          </View>

          {/* Subscription pill */}
          {!subLoading && (
            <Pressable
              onPress={() => setShowPaywall(true)}
              style={[
                styles.subPill,
                {
                  backgroundColor: isSubscribed ? "#05966912" : colors.accent + "10",
                  borderColor: isSubscribed ? "#05966930" : colors.accent + "30",
                },
              ]}
            >
              <View style={[styles.subDot, { backgroundColor: isSubscribed ? "#059669" : "#f59e0b" }]} />
              <Text style={[styles.subPillText, { color: isSubscribed ? "#059669" : colors.accent }]}>
                {isSubscribed
                  ? `${subscription.isTrial ? "Trial" : subscription.tier} · ${days}d left`
                  : "No plan · Tap to subscribe"}
              </Text>
              <Feather name="chevron-right" size={13} color={isSubscribed ? "#059669" : colors.accent} />
            </Pressable>
          )}
        </View>

        {/* ── Stats grid ────────────────────────────────────────── */}
        {isSubscribed ? (
          <View style={styles.statsGrid}>
            {[
              { label: "Revenue", value: `₦${revenue.toLocaleString()}`, icon: "trending-up" as const, color: "#059669" },
              { label: "Active Orders", value: String(activeCount), icon: "package" as const, color: colors.accent },
              { label: "Pending", value: String(pending), icon: "clock" as const, color: "#f59e0b" },
              { label: "Completed", value: String(completed), icon: "check-circle" as const, color: "#10b981" },
            ].map((stat) => (
              <View
                key={stat.label}
                style={[styles.statCard, { backgroundColor: colors.card, borderRadius: colors.radius }, shadow]}
              >
                <View style={[styles.statIconWrap, { backgroundColor: stat.color + "14" }]}>
                  <Feather name={stat.icon} size={16} color={stat.color} />
                </View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        ) : (
          /* Paywall gate */
          <View style={styles.padded}>
            <Pressable
              onPress={() => setShowPaywall(true)}
              style={[styles.gateCard, { backgroundColor: colors.card, borderRadius: colors.radius }, shadow]}
            >
              <View style={[styles.gateIconWrap, { backgroundColor: colors.accent + "12" }]}>
                <Feather name="zap" size={28} color={colors.accent} />
              </View>
              <Text style={[styles.gateTitle, { color: colors.foreground }]}>Activate your business</Text>
              <Text style={[styles.gateText, { color: colors.mutedForeground }]}>
                Start a 7-day free trial to accept orders, manage dispatchers, and grow your laundry business.
              </Text>
              <View style={[styles.gateBtn, { backgroundColor: colors.accent, borderRadius: colors.radius }]}>
                <Feather name="zap" size={16} color="#ffffff" />
                <Text style={styles.gateBtnText}>Start Free Trial</Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* ── Recent active orders ──────────────────────────────── */}
        {isSubscribed && recentOrders.length > 0 && (
          <View style={styles.padded}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Active Orders</Text>
            {recentOrders.map((order) => {
              const statusColor = STATUS_COLOR[order.status] ?? colors.accent;
              return (
                <View
                  key={order.id}
                  style={[styles.orderRow, { backgroundColor: colors.card, borderRadius: colors.radius, borderLeftColor: statusColor }, shadow]}
                >
                  <View style={styles.orderRowLeft}>
                    <Text style={[styles.orderNum, { color: colors.foreground }]}>#{order.orderNumber}</Text>
                    <Text style={[styles.orderCustomer, { color: colors.mutedForeground }]}>{order.customerName}</Text>
                  </View>
                  <View style={styles.orderRowRight}>
                    <Text style={[styles.orderAmt, { color: colors.accent }]}>₦{order.totalAmount.toLocaleString()}</Text>
                    <View style={[styles.statusBubble, { backgroundColor: statusColor + "16" }]}>
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {order.status.replaceAll("_", " ")}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Quick actions ─────────────────────────────────────── */}
        {isSubscribed && (
          <View style={styles.padded}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
            <View style={[styles.quickCard, { backgroundColor: colors.card, borderRadius: colors.radius }, shadow]}>
              {[
                { icon: "clipboard" as const, label: "Manage Orders", sub: "Accept, update status, assign riders" },
                { icon: "trending-up" as const, label: "Analytics", sub: "Revenue breakdown and service stats" },
                { icon: "tag" as const, label: "Services & Pricing", sub: "Set your service menu and rates" },
              ].map((item, i, arr) => (
                <View
                  key={item.label}
                  style={[styles.quickRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                >
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
        )}
      </ScrollView>

      {/* Subscription modal */}
      <Modal
        visible={showPaywall}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPaywall(false)}
      >
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Subscription</Text>
            <Pressable onPress={() => setShowPaywall(false)} hitSlop={12}>
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
  padded: { paddingHorizontal: 20, marginBottom: 8 },

  /* Hero */
  hero: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 14,
    borderBottomWidth: 1,
  },
  heroRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  heroGreet: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 3 },
  heroTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 2 },
  heroSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  heroIcon: { width: 50, height: 50, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  subPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    alignSelf: "flex-start",
    borderWidth: 1,
  },
  subDot: { width: 8, height: 8, borderRadius: 4 },
  subPillText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  /* Stats */
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, padding: 20 },
  statCard: { width: "47%", flexGrow: 1, padding: 16, gap: 8 },
  statIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 24, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },

  /* Gate */
  gateCard: { padding: 28, alignItems: "center", gap: 12 },
  gateIconWrap: { width: 60, height: 60, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  gateTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  gateText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  gateBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 28, paddingVertical: 14, marginTop: 4 },
  gateBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#ffffff" },

  /* Orders */
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 12, marginTop: 4 },
  orderRow: { flexDirection: "row", alignItems: "center", padding: 14, marginBottom: 8, borderLeftWidth: 3, gap: 10 },
  orderRowLeft: { flex: 1, gap: 3 },
  orderNum: { fontSize: 14, fontFamily: "Inter_700Bold" },
  orderCustomer: { fontSize: 12, fontFamily: "Inter_400Regular" },
  orderRowRight: { alignItems: "flex-end", gap: 5 },
  orderAmt: { fontSize: 15, fontFamily: "Inter_700Bold" },
  statusBubble: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 10, fontFamily: "Inter_700Bold" },

  /* Quick actions */
  quickCard: { overflow: "hidden" },
  quickRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  quickIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  quickSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },

  /* Modal */
  sheet: { flex: 1 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1 },
  sheetTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
});
