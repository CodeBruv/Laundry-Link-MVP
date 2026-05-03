import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/contexts/OrdersContext";
import { useColors } from "@/hooks/useColors";

export default function DispatcherDashboard() {
  const colors = useColors();
  const { user } = useAuth();
  const { orders, isLoading, refreshOrders } = useOrders();
  const insets = useSafeAreaInsets();

  const name = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] || "Rider";
  const assigned = orders.filter((o) => !!o.assignedDriverName);
  const completed = assigned.filter((o) => o.status === "DELIVERED").length;
  const awaitingPickup = assigned.filter((o) => ["ACCEPTED", "PENDING"].includes(o.status)).length;
  const awaitingPayment = assigned.filter((o) => o.status === "READY").length;
  const inDelivery = assigned.filter((o) => o.status === "OUT_FOR_DELIVERY").length;

  const totalEarningsProxy = completed * 1500; // placeholder until real rider fee tracking

  const shadow = {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: 8,
    elevation: 3,
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 90) }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshOrders} tintColor={colors.accent} />}
    >
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <Text style={styles.heroGreet}>Hello, {name} 👋</Text>
        <Text style={styles.heroTitle}>Dispatcher Hub</Text>
        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Available for delivery</Text>
        </View>
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        {[
          { label: "Assigned", value: String(assigned.length), icon: "package" as const, color: colors.accent },
          { label: "Pickup Ready", value: String(awaitingPickup), icon: "shopping-bag" as const, color: "#f59e0b" },
          { label: "Awaiting Pay", value: String(awaitingPayment), icon: "clock" as const, color: "#d97706" },
          { label: "Delivering", value: String(inDelivery), icon: "truck" as const, color: "#059669" },
        ].map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderRadius: colors.radius }, shadow]}>
            <View style={[styles.statIcon, { backgroundColor: s.color + "14" }]}>
              <Feather name={s.icon} size={15} color={s.color} />
            </View>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Earnings card */}
      <View style={styles.padded}>
        <View style={[styles.earningsCard, { backgroundColor: colors.card, borderRadius: colors.radius }, shadow]}>
          <View style={styles.earningsLeft}>
            <Text style={[styles.earningsLabel, { color: colors.mutedForeground }]}>Estimated Earnings</Text>
            <Text style={[styles.earningsValue, { color: colors.foreground }]}>₦{totalEarningsProxy.toLocaleString()}</Text>
            <Text style={[styles.earningsSub, { color: colors.mutedForeground }]}>Paid directly by customers/laundromats</Text>
          </View>
          <View style={[styles.earningsIcon, { backgroundColor: "#05966910" }]}>
            <Feather name="dollar-sign" size={24} color="#059669" />
          </View>
        </View>
      </View>

      {/* Payment gate explainer */}
      <View style={styles.padded}>
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderRadius: colors.radius, borderLeftColor: colors.accent }, shadow]}>
          <Feather name="info" size={15} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>Strict delivery gate</Text>
            <Text style={[styles.infoBody, { color: colors.mutedForeground }]}>
              You can only mark "Out for Delivery" after the customer has confirmed payment. Orders in READY status are waiting for customer payment.
            </Text>
          </View>
        </View>
      </View>

      {/* Active deliveries */}
      <View style={styles.padded}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {assigned.length === 0 ? "No deliveries yet" : `Active (${assigned.filter((o) => o.status !== "DELIVERED").length})`}
        </Text>
        {assigned.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderRadius: colors.radius }, shadow]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
              <Feather name="truck" size={26} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No assignments yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Complete your KYC and set your service area. A business will assign you once orders come in.
            </Text>
          </View>
        ) : (
          assigned
            .filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED")
            .slice(0, 3)
            .map((order) => {
              const isPaid = order.status === "PAID";
              const isReady = order.status === "READY";
              const dotColor = isPaid ? "#059669" : isReady ? "#d97706" : colors.accent;
              return (
                <View key={order.id} style={[styles.deliveryRow, { backgroundColor: colors.card, borderRadius: colors.radius, borderLeftColor: dotColor }, shadow]}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[styles.deliveryNum, { color: colors.foreground }]}>#{order.orderNumber}</Text>
                    <Text style={[styles.deliveryAddr, { color: colors.mutedForeground }]} numberOfLines={1}>
                      📍 {order.pickupAddress}
                    </Text>
                  </View>
                  <View style={styles.deliveryRight}>
                    <Text style={[styles.deliveryAmt, { color: dotColor }]}>₦{order.totalAmount.toLocaleString()}</Text>
                    <View style={[styles.statusChip, { backgroundColor: dotColor + "16" }]}>
                      <Text style={[styles.statusChipText, { color: dotColor }]}>
                        {order.status.replaceAll("_", " ")}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
        )}
        {assigned.filter((o) => o.status !== "DELIVERED").length > 3 && (
          <Text style={[styles.seeMore, { color: colors.accent }]}>
            See all in Deliveries tab
          </Text>
        )}
      </View>

      {/* Checklist */}
      <View style={styles.padded}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Getting started</Text>
        <View style={[styles.checkCard, { backgroundColor: colors.card, borderRadius: colors.radius }, shadow]}>
          {[
            { label: "Complete KYC verification", done: false },
            { label: "Set your service area zones", done: false },
            { label: "Add vehicle details", done: false },
          ].map((item, i, arr) => (
            <View key={item.label} style={[styles.checkRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={[styles.checkDot, { backgroundColor: item.done ? "#05966920" : colors.muted, borderColor: item.done ? "#059669" : colors.border }]}>
                {item.done && <Feather name="check" size={12} color="#059669" />}
              </View>
              <Text style={[styles.checkLabel, { color: item.done ? colors.mutedForeground : colors.foreground }]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  padded: { paddingHorizontal: 20, marginBottom: 12 },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 28,
    gap: 4,
  },
  heroGreet: { fontSize: 14, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.7)" },
  heroTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#ffffff", marginBottom: 10 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "rgba(255,255,255,0.12)", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10b981" },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.9)" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, padding: 20 },
  statCard: { width: "47%", flexGrow: 1, padding: 14, gap: 6 },
  statIcon: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  earningsCard: { flexDirection: "row", alignItems: "center", padding: 20, gap: 16 },
  earningsLeft: { flex: 1, gap: 4 },
  earningsLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  earningsValue: { fontSize: 28, fontFamily: "Inter_700Bold" },
  earningsSub: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  earningsIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  infoCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, borderLeftWidth: 3 },
  infoTitle: { fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 3 },
  infoBody: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 12 },
  emptyCard: { alignItems: "center", padding: 28, gap: 12 },
  emptyIcon: { width: 58, height: 58, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  deliveryRow: { flexDirection: "row", alignItems: "center", padding: 14, marginBottom: 8, borderLeftWidth: 3, gap: 10 },
  deliveryNum: { fontSize: 14, fontFamily: "Inter_700Bold" },
  deliveryAddr: { fontSize: 12, fontFamily: "Inter_400Regular" },
  deliveryRight: { alignItems: "flex-end", gap: 5 },
  deliveryAmt: { fontSize: 15, fontFamily: "Inter_700Bold" },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusChipText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  seeMore: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center", paddingVertical: 8 },
  checkCard: { overflow: "hidden" },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  checkDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  checkLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
});
