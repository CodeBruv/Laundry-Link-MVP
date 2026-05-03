import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { Order } from "@/types";

export function OrderMap({ order }: { order: Order }) {
  const colors = useColors();
  const showDriver = order.isDriverLocationShared;

  return (
    <View style={[styles.map, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
      <View style={styles.routeLine} />
      <MapPin label="Business pickup" icon="home" color={colors.primary} top="22%" left="14%" />
      <MapPin label="Delivery" icon="map-pin" color={colors.accent} top="58%" left="66%" />
      {showDriver && (
        <MapPin label="Dispatcher" icon="truck" color="#10b981" top="40%" left="42%" />
      )}
      <View style={[styles.legend, { backgroundColor: colors.card + "ee", borderRadius: colors.radius }]}>
        <LegendItem color={colors.primary} label="Pickup" />
        <LegendItem color={colors.accent} label="Delivery" />
        {showDriver && <LegendItem color="#10b981" label="Driver (live)" />}
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function MapPin({
  label,
  icon,
  color,
  top,
  left,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  top: string;
  left: string;
}) {
  return (
    <View style={[styles.pin, { top: top as any, left: left as any }]}>
      <View style={[styles.pinIcon, { backgroundColor: color }]}>
        <Feather name={icon} size={14} color="#ffffff" />
      </View>
      <Text style={styles.pinLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 220,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(9,45,82,0.08)",
  },
  routeLine: {
    position: "absolute",
    top: "40%",
    left: "22%",
    width: "50%",
    height: 2,
    backgroundColor: "rgba(9,45,82,0.20)",
    transform: [{ rotate: "22deg" }],
  },
  pin: {
    position: "absolute",
    alignItems: "center",
    gap: 4,
  },
  pinIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  pinLabel: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: "#092d52",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  legend: {
    position: "absolute",
    bottom: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 5,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "#092d52",
  },
});
