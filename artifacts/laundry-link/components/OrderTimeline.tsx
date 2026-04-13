import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { OrderStatus, OrderStatusHistory } from "@/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  PICKED_UP: "Picked up",
  IN_PROGRESS: "In progress",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export function OrderTimeline({ history }: { history: OrderStatusHistory[] }) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      {history.length === 0 ? (
        <Text style={[styles.empty, { color: colors.mutedForeground }]}>Timeline will appear as the order progresses.</Text>
      ) : (
        history.map((item, index) => (
          <View key={item.id} style={styles.row}>
            <View style={styles.markerWrap}>
              <View style={[styles.marker, { backgroundColor: colors.primary }]} />
              {index < history.length - 1 && <View style={[styles.line, { backgroundColor: colors.border }]} />}
            </View>
            <View style={styles.textWrap}>
              <Text style={[styles.status, { color: colors.foreground }]}>{STATUS_LABELS[item.status]}</Text>
              <Text style={[styles.date, { color: colors.mutedForeground }]}>{new Date(item.createdAt).toLocaleString()}</Text>
              {!!item.note && <Text style={[styles.note, { color: colors.mutedForeground }]}>{item.note}</Text>}
            </View>
          </View>
        ))
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
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 28,
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
