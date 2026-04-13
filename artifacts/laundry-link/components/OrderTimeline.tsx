import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { OrderStatus, OrderStatusHistory } from "@/types";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: keyof typeof Feather.glyphMap }> = {
  PENDING: { label: "Pending", color: "#f59e0b", icon: "clock" },
  ACCEPTED: { label: "Accepted", color: "#1e40af", icon: "check-circle" },
  PICKED_UP: { label: "Picked up", color: "#8b5cf6", icon: "shopping-bag" },
  IN_PROGRESS: { label: "In progress", color: "#6366f1", icon: "loader" },
  READY: { label: "Ready", color: "#10b981", icon: "package" },
  OUT_FOR_DELIVERY: { label: "Out for delivery", color: "#0ea5e9", icon: "truck" },
  DELIVERED: { label: "Delivered", color: "#22c55e", icon: "check" },
  CANCELLED: { label: "Cancelled", color: "#ef4444", icon: "x-circle" },
};

export function OrderTimeline({ history }: { history: OrderStatusHistory[] }) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      {history.length === 0 ? (
        <Text style={[styles.empty, { color: colors.mutedForeground }]}>Timeline will appear as the order progresses.</Text>
      ) : (
        history.map((item, index) => {
          const config = STATUS_CONFIG[item.status];
          return (
            <View key={item.id} style={styles.row}>
              <View style={styles.markerWrap}>
                <View style={[styles.marker, { backgroundColor: config.color }]}> 
                  <Feather name={config.icon} size={12} color="#ffffff" />
                </View>
                {index < history.length - 1 && <View style={[styles.line, { backgroundColor: colors.border }]} />}
              </View>
              <View style={styles.textWrap}>
                <Text style={[styles.status, { color: colors.foreground }]}>{config.label}</Text>
                <Text style={[styles.date, { color: colors.mutedForeground }]}>{new Date(item.createdAt).toLocaleString()}</Text>
                {!!item.note && <Text style={[styles.note, { color: colors.mutedForeground }]}>{item.note}</Text>}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 2,
  },
  empty: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  markerWrap: {
    alignItems: "center",
  },
  marker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 24,
    marginTop: 4,
  },
  textWrap: {
    flex: 1,
    paddingBottom: 14,
  },
  status: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  date: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  note: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
});
