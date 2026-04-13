import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { StatusBadge } from "@/components/StatusBadge";
import { useColors } from "@/hooks/useColors";
import { Order } from "@/types";

interface OrderCardProps {
  order: Order;
  showCustomer?: boolean;
  showDriver?: boolean;
}

export function OrderCard({ order, showCustomer, showDriver }: OrderCardProps) {
  const colors = useColors();
  const router = useRouter();
  const itemSummary = order.items
    .map((item) => `${item.quantity}x ${item.serviceName}`)
    .join(", ");

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/order/[id]", params: { id: order.id } } as any)}
      style={[
        styles.card,
        { backgroundColor: colors.card, borderRadius: colors.radius },
      ]}
    >
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.orderNumber, { color: colors.foreground }]}>#{order.orderNumber}</Text>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>₦{order.totalAmount.toLocaleString()} total</Text>
        </View>
        <StatusBadge status={order.status} />
      </View>

      {showCustomer && (
        <View style={styles.metaRow}>
          <Feather name="user" size={14} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{order.customerName}</Text>
        </View>
      )}

      <View style={styles.metaRow}>
        <Feather name="package" size={14} color={colors.mutedForeground} />
        <Text style={[styles.metaText, { color: colors.mutedForeground }]} numberOfLines={1}>{itemSummary || "No items"}</Text>
      </View>

      <View style={styles.metaRow}>
        <Feather name="map-pin" size={14} color={colors.mutedForeground} />
        <Text style={[styles.metaText, { color: colors.mutedForeground }]} numberOfLines={1}>{order.pickupAddress}</Text>
      </View>

      {showDriver && order.assignedDriverName && (
        <View style={styles.metaRow}>
          <Feather name="truck" size={14} color={colors.accent} />
          <Text style={[styles.metaText, { color: colors.accent }]}>{order.assignedDriverName}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  date: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
