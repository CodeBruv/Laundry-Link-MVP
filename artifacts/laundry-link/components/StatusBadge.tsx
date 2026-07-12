import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { OrderStatus } from "@/types";

const STATUS_CONFIG: Partial<Record<OrderStatus, { label: string; color: string }>> = {
  // ── Legacy ────────────────────────────────────────────────────────────
  PENDING:          { label: "Pending",          color: "#f59e0b" },
  ACCEPTED:         { label: "Accepted",          color: "#3b82f6" },
  PICKED_UP:        { label: "Picked Up",         color: "#8b5cf6" },
  IN_PROGRESS:      { label: "In Progress",       color: "#6366f1" },
  READY:            { label: "Ready",             color: "#10b981" },
  PAID:             { label: "Paid ✓",            color: "#059669" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery",  color: "#f97316" },
  // ── Production workflow ───────────────────────────────────────────────
  DRAFT:               { label: "Draft",                color: "#f59e0b" },
  DEPOSIT_PAID:        { label: "Deposit Paid",         color: "#059669" },
  PICKUP_ASSIGNED:     { label: "Pickup Assigned",      color: "#3b82f6" },
  PICKUP_COMPLETED:    { label: "Pickup Completed",     color: "#8b5cf6" },
  RECEIVED_AT_LAUNDRY: { label: "Received",             color: "#4f46e5" },
  SORTING:             { label: "Sorting",              color: "#4338ca" },
  WASHING:             { label: "Washing",              color: "#2563eb" },
  DRYING:              { label: "Drying",               color: "#0891b2" },
  IRONING:             { label: "Ironing",              color: "#b45309" },
  QUALITY_CHECK:       { label: "Quality Check",        color: "#7c3aed" },
  PACKAGING:           { label: "Packaging",            color: "#475569" },
  SHELF_LOCATION:      { label: "Shelf Location",       color: "#64748b" },
  READY_FOR_DELIVERY:  { label: "Ready for Delivery",   color: "#10b981" },
  BALANCE_PAID:        { label: "Balance Paid",         color: "#059669" },
  DELIVERY_ASSIGNED:   { label: "Out for Delivery",     color: "#f97316" },
  DELIVERED:           { label: "Delivered",            color: "#22c55e" },
  COMPLETED:           { label: "Completed ✓",          color: "#16a34a" },
  CANCELLED:           { label: "Cancelled",            color: "#ef4444" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const colors = useColors();
  const config = STATUS_CONFIG[status] ?? { label: status, color: "#6b7280" };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.color + "1a",
          borderRadius: colors.radius / 2,
          borderColor: config.color + "40",
          borderWidth: 1,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
    alignSelf: "flex-start",
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
