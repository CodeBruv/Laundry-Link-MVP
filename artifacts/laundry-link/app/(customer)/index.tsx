import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

const QUICK_SERVICES = [
  { icon: "shopping-bag" as const, label: "Wash & Fold" },
  { icon: "wind" as const, label: "Dry Clean" },
  { icon: "maximize" as const, label: "Iron & Press" },
  { icon: "zap" as const, label: "Express" },
];

export default function CustomerHome() {
  const colors = useColors();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80) },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.greeting}>
        <Text style={[styles.hello, { color: colors.mutedForeground }]}>
          Hello, {firstName}
        </Text>
        <Text style={[styles.heroText, { color: colors.foreground }]}>
          Fresh laundry, delivered.
        </Text>
      </View>

      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        <Feather name="search" size={18} color={colors.mutedForeground} />
        <Text style={[styles.searchText, { color: colors.mutedForeground }]}>
          Search laundromats near you...
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Quick Services
      </Text>
      <View style={styles.servicesGrid}>
        {QUICK_SERVICES.map((s) => (
          <Pressable
            key={s.label}
            style={[
              styles.serviceCard,
              {
                backgroundColor: colors.card,
                borderRadius: colors.radius,
              },
            ]}
          >
            <View
              style={[
                styles.serviceIcon,
                {
                  backgroundColor: colors.primary + "14",
                  borderRadius: colors.radius - 2,
                },
              ]}
            >
              <Feather name={s.icon} size={22} color={colors.primary} />
            </View>
            <Text
              style={[styles.serviceLabel, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Nearby Laundromats
      </Text>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            styles.laundryCard,
            {
              backgroundColor: colors.card,
              borderRadius: colors.radius,
            },
          ]}
        >
          <View
            style={[
              styles.laundryAvatar,
              {
                backgroundColor: colors.muted,
                borderRadius: colors.radius - 2,
              },
            ]}
          >
            <Feather name="home" size={22} color={colors.mutedForeground} />
          </View>
          <View style={styles.laundryInfo}>
            <Text style={[styles.laundryName, { color: colors.foreground }]}>
              CleanPro Laundry #{i}
            </Text>
            <Text
              style={[styles.laundryAddress, { color: colors.mutedForeground }]}
            >
              {i * 0.5 + 0.3} km away
            </Text>
            <View style={styles.ratingRow}>
              <Feather name="star" size={12} color="#f59e0b" />
              <Text style={[styles.ratingText, { color: colors.foreground }]}>
                4.{8 - i}
              </Text>
              <Text
                style={[styles.reviewCount, { color: colors.mutedForeground }]}
              >
                ({120 - i * 20} reviews)
              </Text>
            </View>
          </View>
          <Feather
            name="chevron-right"
            size={18}
            color={colors.mutedForeground}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  greeting: {
    marginBottom: 20,
  },
  hello: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
  },
  heroText: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 24,
  },
  searchText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  servicesGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  serviceCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 8,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  laundryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  laundryAvatar: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  laundryInfo: {
    flex: 1,
  },
  laundryName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  laundryAddress: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  reviewCount: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
