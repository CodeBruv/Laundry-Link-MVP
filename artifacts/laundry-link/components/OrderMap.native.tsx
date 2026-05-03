import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

import { useColors } from "@/hooks/useColors";
import { Order } from "@/types";

const BUSINESS_COORD = { latitude: 9.0765, longitude: 7.3986 };
const DELIVERY_COORD = { latitude: 9.0643, longitude: 7.4893 };
const FALLBACK_DRIVER = { latitude: 9.0698, longitude: 7.4431 };

function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
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

function etaLabel(distanceKm: number): string {
  const minutes = Math.round((distanceKm / 30) * 60);
  if (minutes < 2) return "< 2 min";
  if (minutes < 60) return `~${minutes} min`;
  return `~${Math.round(minutes / 60)}h ${minutes % 60}m`;
}

export function OrderMap({ order }: { order: Order }) {
  const colors = useColors();
  const mapRef = useRef<MapView>(null);

  const driverCoord =
    order.driverLatitude && order.driverLongitude
      ? { latitude: order.driverLatitude, longitude: order.driverLongitude }
      : order.isDriverLocationShared
        ? FALLBACK_DRIVER
        : null;

  // Animate map camera when driver location changes
  useEffect(() => {
    if (!driverCoord || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: driverCoord.latitude,
        longitude: driverCoord.longitude,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      },
      800,
    );
  }, [order.driverLatitude, order.driverLongitude]);

  // ETA from driver to delivery
  const etaDistance =
    driverCoord
      ? haversineKm(
          driverCoord.latitude,
          driverCoord.longitude,
          DELIVERY_COORD.latitude,
          DELIVERY_COORD.longitude,
        )
      : null;

  const routeCoords = [BUSINESS_COORD, DELIVERY_COORD];
  const driverRoute = driverCoord
    ? [driverCoord, DELIVERY_COORD]
    : [];

  return (
    <View style={[styles.container, { borderRadius: colors.radius }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 9.071,
          longitude: 7.443,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
      >
        {/* Route: business → delivery */}
        <Polyline
          coordinates={routeCoords}
          strokeColor={colors.primary + "60"}
          strokeWidth={3}
          lineDashPattern={[8, 4]}
        />

        {/* Live driver route */}
        {driverRoute.length === 2 && (
          <Polyline
            coordinates={driverRoute}
            strokeColor="#10b981"
            strokeWidth={4}
          />
        )}

        {/* Business pickup */}
        <Marker
          coordinate={BUSINESS_COORD}
          title="Laundry pickup"
          description={order.businessName}
          pinColor="#092d52"
        />

        {/* Delivery destination */}
        <Marker
          coordinate={DELIVERY_COORD}
          title="Delivery address"
          description={order.deliveryAddress}
          pinColor="#1e40af"
        />

        {/* Driver live location */}
        {driverCoord && (
          <Marker
            coordinate={driverCoord}
            title="Dispatcher (live)"
            description={order.assignedDriverName ?? "Assigned dispatcher"}
            pinColor="#10b981"
          />
        )}
      </MapView>

      {/* ETA overlay */}
      {etaDistance !== null && (
        <View style={[styles.etaChip, { backgroundColor: "#10b981", borderRadius: colors.radius }]}>
          <Text style={styles.etaText}>ETA {etaLabel(etaDistance)}</Text>
        </View>
      )}

      {/* Offline placeholder when no driver location */}
      {!driverCoord && (
        <View style={[styles.noDriverChip, { backgroundColor: colors.card + "ee", borderRadius: colors.radius }]}>
          <Text style={[styles.noDriverText, { color: colors.mutedForeground }]}>
            Awaiting dispatcher location…
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: "hidden", position: "relative" },
  map: { height: 240 },
  etaChip: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  etaText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#ffffff" },
  noDriverChip: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  noDriverText: { fontSize: 11, fontFamily: "Inter_500Medium" },
});
