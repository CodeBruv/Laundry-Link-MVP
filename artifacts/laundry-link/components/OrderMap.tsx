import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { Order } from "@/types";

const BUSINESS_COORDINATE = { latitude: 9.0765, longitude: 7.3986 };
const DELIVERY_COORDINATE = { latitude: 9.0643, longitude: 7.4893 };
const FALLBACK_DRIVER_COORDINATE = { latitude: 9.0698, longitude: 7.4431 };

export function OrderMap({ order }: { order: Order }) {
  const colors = useColors();
  const driverCoordinate = order.driverLatitude && order.driverLongitude
    ? { latitude: order.driverLatitude, longitude: order.driverLongitude }
    : order.isDriverLocationShared
      ? FALLBACK_DRIVER_COORDINATE
      : null;

  if (Platform.OS === "web") {
    return (
      <View style={[styles.webMap, { backgroundColor: colors.muted, borderRadius: colors.radius }]}> 
        <View style={styles.routeLine} />
        <MapPin label="Business pickup" icon="home" color={colors.primary} top="22%" left="18%" />
        <MapPin label="Delivery" icon="map-pin" color={colors.accent} top="60%" left="68%" />
        {driverCoordinate && <MapPin label="Dispatcher live" icon="truck" color="#10b981" top="42%" left="45%" />}
      </View>
    );
  }

  const Maps = require("react-native-maps");
  const MapView = Maps.default;
  const Marker = Maps.Marker;

  return (
    <MapView
      style={styles.nativeMap}
      initialRegion={{
        latitude: 9.071,
        longitude: 7.443,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      }}
    >
      <Marker coordinate={BUSINESS_COORDINATE} title="Business pickup" description={order.businessName} />
      <Marker coordinate={DELIVERY_COORDINATE} title="Delivery address" description={order.deliveryAddress} />
      {driverCoordinate && <Marker coordinate={driverCoordinate} title="Dispatcher live location" description={order.assignedDriverName ?? "Assigned dispatcher"} />}
    </MapView>
  );
}

function MapPin({ label, icon, color, top, left }: { label: string; icon: keyof typeof Feather.glyphMap; color: string; top: string; left: string }) {
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
  nativeMap: {
    height: 220,
    borderRadius: 18,
    overflow: "hidden",
  },
  webMap: {
    height: 220,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(9,45,82,0.08)",
  },
  routeLine: {
    position: "absolute",
    top: "36%",
    left: "24%",
    width: "48%",
    height: 3,
    backgroundColor: "rgba(9,45,82,0.28)",
    transform: [{ rotate: "24deg" }],
  },
  pin: {
    position: "absolute",
    alignItems: "center",
    gap: 5,
  },
  pinIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
  },
  pinLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#092d52",
    backgroundColor: "rgba(255,255,255,0.88)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
});
