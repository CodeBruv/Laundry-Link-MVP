import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const SAMPLE_SERVICES = [
  { name: "Wash & Fold", price: 5, unit: "per kg", active: true },
  { name: "Dry Cleaning", price: 10, unit: "per item", active: true },
  { name: "Iron & Press", price: 3, unit: "per item", active: true },
  { name: "Express Service", price: 8, unit: "per kg", active: false },
];

export default function BusinessServices() {
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
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Your Services
        </Text>
        <Pressable
          style={[
            styles.addBtn,
            { backgroundColor: colors.primary, borderRadius: colors.radius },
          ]}
        >
          <Feather name="plus" size={16} color={colors.primaryForeground} />
          <Text style={[styles.addBtnText, { color: colors.primaryForeground }]}>
            Add
          </Text>
        </Pressable>
      </View>

      {SAMPLE_SERVICES.map((service, i) => (
        <View
          key={i}
          style={[
            styles.serviceCard,
            {
              backgroundColor: colors.card,
              borderRadius: colors.radius,
              opacity: service.active ? 1 : 0.6,
            },
          ]}
        >
          <View style={styles.serviceInfo}>
            <Text style={[styles.serviceName, { color: colors.foreground }]}>
              {service.name}
            </Text>
            <Text style={[styles.servicePrice, { color: colors.accent }]}>
              ${service.price} {service.unit}
            </Text>
          </View>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: service.active
                  ? (colors as any).success || "#10b981"
                  : colors.mutedForeground,
              },
            ]}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 10,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
