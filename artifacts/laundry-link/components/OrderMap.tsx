import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { Order } from "@/types";

// Simple haversine for display
function haversineKm(
  lat1: number, lng1: number, lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function etaLabel(km: number): string {
  const mins = Math.round((km / 30) * 60);
  if (mins < 2) return "< 2 min";
  if (mins < 60) return `~${mins} min`;
  return `~${Math.round(mins / 60)}h ${mins % 60}m`;
}

// Lat/lng → percentage offsets within the 450×240 canvas
const VIEWPORT = {
  minLat: 9.055, maxLat: 9.090,
  minLng: 7.385, maxLng: 7.500,
};

function coord(lat: number, lng: number): { top: string; left: string } {
  const top = ((VIEWPORT.maxLat - lat) / (VIEWPORT.maxLat - VIEWPORT.minLat)) * 100;
  const left = ((lng - VIEWPORT.minLng) / (VIEWPORT.maxLng - VIEWPORT.minLng)) * 100;
  return { top: `${top.toFixed(1)}%`, left: `${left.toFixed(1)}%` };
}

const BUSINESS = { lat: 9.0765, lng: 7.3986 };
const DELIVERY = { lat: 9.0643, lng: 7.4893 };
const FALLBACK_DRIVER = { lat: 9.0698, lng: 7.4431 };

export function OrderMap({ order }: { order: Order }) {
  const colors = useColors();
  const pulse = useRef(new Animated.Value(1)).current;

  const driverPos =
    order.driverLatitude && order.driverLongitude
      ? { lat: order.driverLatitude, lng: order.driverLongitude }
      : order.isDriverLocationShared
        ? FALLBACK_DRIVER
        : null;

  // Pulse animation for driver marker
  useEffect(() => {
    if (!driverPos) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [driverPos !== null]);

  const etaKm = driverPos
    ? haversineKm(driverPos.lat, driverPos.lng, DELIVERY.lat, DELIVERY.lng)
    : null;

  const bizPos = coord(BUSINESS.lat, BUSINESS.lng);
  const delPos = coord(DELIVERY.lat, DELIVERY.lng);
  const drvPos = driverPos ? coord(driverPos.lat, driverPos.lng) : null;

  return (
    <View style={[styles.map, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
      {/* Grid lines — simulated street grid */}
      {[20, 40, 60, 80].map((pct) => (
        <View key={`h${pct}`} style={[styles.gridH, { top: `${pct}%`, backgroundColor: colors.border }]} />
      ))}
      {[25, 50, 75].map((pct) => (
        <View key={`v${pct}`} style={[styles.gridV, { left: `${pct}%`, backgroundColor: colors.border }]} />
      ))}

      {/* Route line: business → delivery */}
      <View
        style={[
          styles.routeLine,
          {
            backgroundColor: colors.primary + "50",
            top: bizPos.top,
            left: bizPos.left,
          },
        ]}
      />

      {/* Driver route line: driver → delivery */}
      {drvPos && (
        <View
          style={[
            styles.routeLine,
            {
              backgroundColor: "#10b98180",
              top: drvPos.top,
              left: drvPos.left,
            },
          ]}
        />
      )}

      {/* Business pickup pin */}
      <MapPin
        label="Pickup"
        icon="home"
        color={colors.primary}
        top={bizPos.top}
        left={bizPos.left}
      />

      {/* Delivery pin */}
      <MapPin
        label="Delivery"
        icon="navigation"
        color={colors.accent}
        top={delPos.top}
        left={delPos.left}
      />

      {/* Driver (animated pulsing) */}
      {drvPos && (
        <View style={[styles.pin, { top: drvPos.top as any, left: drvPos.left as any }]}>
          <Animated.View
            style={[
              styles.driverRing,
              { borderColor: "#10b981", transform: [{ scale: pulse }] },
            ]}
          />
          <View style={[styles.driverDot, { backgroundColor: "#10b981" }]}>
            <Feather name="truck" size={11} color="#ffffff" />
          </View>
          <Text style={styles.pinLabel}>Driver</Text>
        </View>
      )}

      {/* ETA chip */}
      {etaKm !== null && (
        <View style={[styles.etaChip, { backgroundColor: "#10b981", borderRadius: 10 }]}>
          <Feather name="clock" size={11} color="#ffffff" />
          <Text style={styles.etaText}>ETA {etaLabel(etaKm)}</Text>
        </View>
      )}

      {/* Legend */}
      <View style={[styles.legend, { backgroundColor: colors.card + "f0", borderRadius: colors.radius }]}>
        <LegendRow color={colors.primary} label="Pickup" />
        <LegendRow color={colors.accent} label="Delivery" />
        {driverPos && <LegendRow color="#10b981" label="Driver (live)" />}
      </View>

      {/* No driver overlay */}
      {!driverPos && (
        <View style={[styles.noDriver, { backgroundColor: colors.card + "cc" }]}>
          <Text style={[styles.noDriverText, { color: colors.mutedForeground }]}>
            Driver location unavailable
          </Text>
        </View>
      )}
    </View>
  );
}

function MapPin({
  label, icon, color, top, left,
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
        <Feather name={icon} size={12} color="#ffffff" />
      </View>
      <Text style={styles.pinLabel}>{label}</Text>
    </View>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { height: 240, overflow: "hidden", position: "relative", borderWidth: 1, borderColor: "rgba(9,45,82,0.07)" },
  gridH: { position: "absolute", left: 0, right: 0, height: 1, opacity: 0.6 },
  gridV: { position: "absolute", top: 0, bottom: 0, width: 1, opacity: 0.6 },
  routeLine: { position: "absolute", width: 2, height: 60, opacity: 0.6, transform: [{ rotate: "35deg" }] },
  pin: { position: "absolute", alignItems: "center", gap: 3, transform: [{ translateX: -16 }, { translateY: -16 }] },
  pinIcon: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 4 },
  pinLabel: { fontSize: 8, fontFamily: "Inter_700Bold", color: "#092d52", backgroundColor: "rgba(255,255,255,0.92)", paddingHorizontal: 4, paddingVertical: 2, borderRadius: 5, marginTop: 2 },
  driverRing: { position: "absolute", width: 34, height: 34, borderRadius: 17, borderWidth: 2.5, opacity: 0.5, transform: [{ translateX: -2 }, { translateY: -2 }] },
  driverDot: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", shadowColor: "#10b981", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  etaChip: { position: "absolute", top: 10, right: 10, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5 },
  etaText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#ffffff" },
  legend: { position: "absolute", bottom: 10, right: 10, paddingHorizontal: 10, paddingVertical: 8, gap: 5 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#092d52" },
  noDriver: { position: "absolute", bottom: 0, left: 0, right: 0, paddingVertical: 8, alignItems: "center" },
  noDriverText: { fontSize: 11, fontFamily: "Inter_500Medium" },
});
