import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

const STATS = [
  { label: "Today's Orders", value: "0", icon: "package" as const, trend: "" },
  { label: "Pending", value: "0", icon: "clock" as const, trend: "" },
  { label: "Completed", value: "0", icon: "check-circle" as const, trend: "" },
  { label: "Revenue", value: "$0", icon: "dollar-sign" as const, trend: "" },
];

export default function BusinessDashboard() {
  const colors = useColors();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const businessName = user?.user_metadata?.full_name || "Your Business";

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
        Welcome back
      </Text>
      <Text style={[styles.businessName, { color: colors.foreground }]}>
        {businessName}
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
            <View style={styles.statHeader}>
              <Feather name={stat.icon} size={16} color={colors.primary} />
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

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Recent Activity
      </Text>
      <View
        style={[
          styles.emptyActivity,
          { backgroundColor: colors.card, borderRadius: colors.radius },
        ]}
      >
        <Feather name="inbox" size={28} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          No recent activity. Orders will appear here as they come in.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
  },
  businessName: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    width: "48%",
    flexGrow: 1,
    padding: 16,
  },
  statHeader: {
    marginBottom: 10,
  },
  statValue: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  emptyActivity: {
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
