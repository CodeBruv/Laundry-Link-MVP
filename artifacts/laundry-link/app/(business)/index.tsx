import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/contexts/OrdersContext";
import { useColors } from "@/hooks/useColors";

export default function BusinessDashboard() {
  const colors = useColors();
  const { user } = useAuth();
  const { orders } = useOrders();
  const insets = useSafeAreaInsets();
  const businessName = user?.user_metadata?.full_name || "Your Business";
  const completed = orders.filter((order) => order.status === "DELIVERED").length;
  const pending = orders.filter((order) => order.status === "PENDING").length;
  const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const stats = [
    { label: "Today's Orders", value: String(orders.length), icon: "package" as const },
    { label: "Pending", value: String(pending), icon: "clock" as const },
    { label: "Completed", value: String(completed), icon: "check-circle" as const },
    { label: "Order Value", value: `₦${revenue.toLocaleString()}`, icon: "trending-up" as const },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80) }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Welcome back</Text>
      <Text style={[styles.businessName, { color: colors.foreground }]}>{businessName}</Text>
      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}> 
            <Feather name={stat.icon} size={16} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
          </View>
        ))}
      </View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Operations</Text>
      <View style={[styles.emptyActivity, { backgroundColor: colors.card, borderRadius: colors.radius }]}> 
        <Feather name="inbox" size={28} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          {orders.length === 0 ? "No orders yet. New customer orders will appear in the Orders tab." : "Open the Orders tab to accept, assign, and update customer orders."}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  greeting: { fontSize: 14, fontFamily: "Inter_500Medium", marginBottom: 4 },
  businessName: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 20 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  statCard: { width: "48%", flexGrow: 1, padding: 16, gap: 8 },
  statValue: { fontSize: 24, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  emptyActivity: { alignItems: "center", padding: 32, gap: 12 },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
});
