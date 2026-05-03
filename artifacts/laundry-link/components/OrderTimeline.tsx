import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { OrderStatus, OrderStatusHistory } from "@/types";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; icon: keyof typeof Feather.glyphMap; bg: string }
> = {
  PENDING:          { label: "Order Placed",       color: "#f59e0b", icon: "clock",        bg: "#f59e0b18" },
  ACCEPTED:         { label: "Accepted",            color: "#3b82f6", icon: "check-circle", bg: "#3b82f618" },
  PICKED_UP:        { label: "Picked Up",           color: "#8b5cf6", icon: "shopping-bag", bg: "#8b5cf618" },
  IN_PROGRESS:      { label: "In Progress",         color: "#6366f1", icon: "loader",       bg: "#6366f118" },
  READY:            { label: "Ready for Delivery",  color: "#10b981", icon: "package",      bg: "#10b98118" },
  PAID:             { label: "Payment Received",    color: "#059669", icon: "dollar-sign",  bg: "#05966918" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery",    color: "#f97316", icon: "truck",        bg: "#f9731618" },
  DELIVERED:        { label: "Delivered",           color: "#22c55e", icon: "check",        bg: "#22c55e18" },
  CANCELLED:        { label: "Cancelled",           color: "#ef4444", icon: "x-circle",     bg: "#ef444418" },
};

export function OrderTimeline({ history }: { history: OrderStatusHistory[] }) {
  const colors = useColors();

  if (history.length === 0) {
    return (
      <Text style={[styles.empty, { color: colors.mutedForeground }]}>
        Timeline will appear as the order progresses.
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      {history.map((item, index) => {
        const cfg = STATUS_CONFIG[item.status] ?? {
          label: item.status,
          color: "#6b7280",
          icon: "circle" as const,
          bg: "#6b728018",
        };
        const isLast = index === history.length - 1;

        return (
          <View key={item.id} style={styles.row}>
            {/* Left column: icon + connector */}
            <View style={styles.markerCol}>
              <View style={[styles.marker, { backgroundColor: cfg.bg }]}>
                <View style={[styles.markerInner, { backgroundColor: cfg.color }]}>
                  <Feather name={cfg.icon} size={12} color="#ffffff" />
                </View>
              </View>
              {!isLast && <View style={[styles.connector, { backgroundColor: colors.border }]} />}
            </View>

            {/* Right column: text */}
            <View style={[styles.textCol, !isLast && { paddingBottom: 20 }]}>
              <View style={styles.topRow}>
                <Text style={[styles.statusLabel, { color: isLast ? cfg.color : colors.foreground }]}>
                  {cfg.label}
                </Text>
                {isLast && (
                  <View style={[styles.currentPill, { backgroundColor: cfg.color + "18" }]}>
                    <Text style={[styles.currentPillText, { color: cfg.color }]}>Current</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.date, { color: colors.mutedForeground }]}>
                {new Date(item.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              {!!item.note && (
                <Text style={[styles.note, { color: colors.mutedForeground }]}>{item.note}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 0 },
  empty: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  row: { flexDirection: "row", gap: 14 },
  markerCol: { alignItems: "center", width: 40 },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  markerInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  connector: { width: 2, flex: 1, minHeight: 12, marginVertical: 3 },
  textCol: { flex: 1, paddingTop: 10 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  statusLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  currentPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  currentPillText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  date: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 3 },
  note: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4, lineHeight: 17 },
});
