import React from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";

import { useColors } from "@/hooks/useColors";
import { Order } from "@/types";

const BUSINESS_COORD = { latitude: 9.0765, longitude: 7.3986 };
const DELIVERY_COORD = { latitude: 9.0643, longitude: 7.4893 };
const FALLBACK_DRIVER = { latitude: 9.0698, longitude: 7.4431 };

export function OrderMap({ order }: { order: Order }) {
  const colors = useColors();
  const driverCoord =
    order.driverLatitude && order.driverLongitude
      ? { latitude: order.driverLatitude, longitude: order.driverLongitude }
      : order.isDriverLocationShared
        ? FALLBACK_DRIVER
        : null;

  return (
    <MapView
      style={[styles.map, { borderRadius: colors.radius }]}
      initialRegion={{
        latitude: 9.071,
        longitude: 7.443,
        latitudeDelta: 0.07,
        longitudeDelta: 0.07,
      }}
    >
      <Marker
        coordinate={BUSINESS_COORD}
        title="Business — pickup"
        description={order.businessName}
        pinColor="#092d52"
      />
      <Marker
        coordinate={DELIVERY_COORD}
        title="Delivery address"
        description={order.deliveryAddress}
        pinColor="#1e40af"
      />
      {driverCoord && (
        <Marker
          coordinate={driverCoord}
          title="Dispatcher (live)"
          description={order.assignedDriverName ?? "Assigned dispatcher"}
          pinColor="#10b981"
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 220,
    overflow: "hidden",
  },
});
