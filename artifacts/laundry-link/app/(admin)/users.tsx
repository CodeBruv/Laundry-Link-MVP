import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { OrderCardSkeleton } from "@/components/SkeletonLoader";
import { useOrders } from "@/contexts/OrdersContext";
import { useColors } from "@/hooks/useColors";

interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "DISPATCHER";
  orderCount: number;
  lastOrderAt: string | null;
}

const ROLE_COLOR: Record<string, string> = {
  CUSTOMER: "#6366f1",
  DISPATCHER: "#10b981",
};

export default function AdminUsers() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders, isLoading } = useOrders();

  const users = useMemo<UserSummary[]>(() => {
    const map = new Map<string, UserSummary>();

    for (const o of orders) {
      if (!map.has(o.customerId)) {
        map.set(o.customerId, {
          id: o.customerId,
          name: o.customerName,
          email: o.customerEmail ?? "—",
          role: "CUSTOMER",
          orderCount: 0,
          lastOrderAt: null,
        });
      }
      const u = map.get(o.customerId)!;
      u.orderCount++;
      if (!u.lastOrderAt || o.createdAt > u.lastOrderAt) u.lastOrderAt = o.createdAt;

      // Dispatchers derived from assigned orders
      if (o.dispatcherId && o.assignedDriverName && !map.has(o.dispatcherId)) {
        map.set(o.dispatcherId, {
          id: o.dispatcherId,
          name: o.assignedDriverName,
          email: "dispatcher@laundrylink.app",
          role: "DISPATCHER",
          orderCount: 0,
          lastOrderAt: null,
        });
      }
      if (o.dispatcherId) {
        const d = map.get(o.dispatcherId)!;
        d.orderCount++;
        if (!d.lastOrderAt || o.createdAt > d.lastOrderAt) d.lastOrderAt = o.createdAt;
      }
    }

    return Array.from(map.values()).sort((a, b) => b.orderCount - a.orderCount);
  }, [orders]);

  const customerCount = users.filter((u) => u.role === "CUSTOMER").length;
  const dispatcherCount = users.filter((u) => u.role === "DISPATCHER").length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        padding: 20,
        gap: 16,
        paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 90),
      }}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text style={[styles.title, { color: colors.foreground }]}>Platform Users</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {customerCount} customers · {dispatcherCount} dispatchers
        </Text>
      </View>

      {isLoading ? (
        <>
          <OrderCardSkeleton />
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </>
      ) : users.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <Feather name="users" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Users Yet</Text>
          <Text style={[styles.emptyMsg, { color: colors.mutedForeground }]}>
            Users who place or fulfill orders will appear here.
          </Text>
        </View>
      ) : (
        users.map((user) => (
          <View
            key={user.id}
            style={[styles.userCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}
          >
            <View style={styles.cardTop}>
              <View style={[styles.avatar, { backgroundColor: ROLE_COLOR[user.role] + "20" }]}>
                <Feather
                  name={user.role === "DISPATCHER" ? "truck" : "user"}
                  size={20}
                  color={ROLE_COLOR[user.role]}
                />
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.userName, { color: colors.foreground }]}>{user.name}</Text>
                <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{user.email}</Text>
              </View>
              <View style={[styles.roleBadge, { backgroundColor: ROLE_COLOR[user.role] + "18" }]}>
                <Text style={[styles.roleText, { color: ROLE_COLOR[user.role] }]}>{user.role}</Text>
              </View>
            </View>
            <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
              <View style={styles.metaItem}>
                <Feather name="package" size={13} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                  {user.orderCount} order{user.orderCount !== 1 ? "s" : ""}
                </Text>
              </View>
              {user.lastOrderAt && (
                <View style={styles.metaItem}>
                  <Feather name="clock" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                    {new Date(user.lastOrderAt).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular" },
  emptyCard: { alignItems: "center", padding: 48, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyMsg: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  userCard: { overflow: "hidden" },
  cardTop: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1 },
  userName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  userEmail: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  roleText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  cardFooter: { flexDirection: "row", gap: 16, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
