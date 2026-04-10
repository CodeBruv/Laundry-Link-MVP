import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const STATS = [
  { label: "Total Users", value: "0", icon: "users" as const },
  { label: "Businesses", value: "0", icon: "briefcase" as const },
  { label: "Dispatchers", value: "0", icon: "truck" as const },
  { label: "Active Orders", value: "0", icon: "package" as const },
  { label: "Subscriptions", value: "0", icon: "credit-card" as const },
  { label: "Revenue (MRR)", value: "$0", icon: "trending-up" as const },
];

export default function AdminDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        padding: 20,
        paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80),
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>
        Platform Overview
      </Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        LaundryLink Admin Panel
      </Text>

      <View style={styles.statsGrid}>
        {STATS.map((stat) => (
          <View
            key={stat.label}
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderRadius: colors.radius },
            ]}
          >
            <View
              style={[
                styles.statIcon,
                {
                  backgroundColor: colors.primary + "14",
                  borderRadius: colors.radius - 4,
                },
              ]}
            >
              <Feather name={stat.icon} size={18} color={colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {stat.value}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    width: "48%",
    flexGrow: 1,
    padding: 16,
    gap: 8,
  },
  statIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
