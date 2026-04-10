import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function DispatcherDashboard() {
  const colors = useColors();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const name = user?.user_metadata?.full_name?.split(" ")[0] || "Driver";

  const STATS = [
    { label: "Active Deliveries", value: "0", icon: "truck" as const },
    { label: "Completed Today", value: "0", icon: "check" as const },
    { label: "Pending Pickup", value: "0", icon: "clock" as const },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        padding: 20,
        paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80),
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
        Hello, {name}
      </Text>
      <Text style={[styles.title, { color: colors.foreground }]}>
        Ready to deliver?
      </Text>

      <View
        style={[
          styles.statusCard,
          { backgroundColor: colors.primary, borderRadius: colors.radius },
        ]}
      >
        <View style={styles.statusContent}>
          <Text
            style={[styles.statusLabel, { color: colors.primaryForeground }]}
          >
            Status
          </Text>
          <Text
            style={[styles.statusValue, { color: colors.primaryForeground }]}
          >
            Available
          </Text>
        </View>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: "#10b981", borderRadius: 8 },
          ]}
        />
      </View>

      <View style={styles.statsRow}>
        {STATS.map((stat) => (
          <View
            key={stat.label}
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderRadius: colors.radius },
            ]}
          >
            <Feather name={stat.icon} size={18} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {stat.value}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Upcoming Deliveries
      </Text>
      <View
        style={[
          styles.emptyCard,
          { backgroundColor: colors.card, borderRadius: colors.radius },
        ]}
      >
        <Feather name="map" size={28} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          No deliveries assigned yet. New delivery requests will appear here.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  greeting: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginBottom: 20,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    marginBottom: 20,
  },
  statusContent: { flex: 1 },
  statusLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    opacity: 0.8,
    marginBottom: 2,
  },
  statusValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  statusDot: { width: 16, height: 16 },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    gap: 6,
  },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  emptyCard: {
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
  },
});
