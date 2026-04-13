import { Link } from "expo-router";
import React from "react";
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { OrderCard } from "@/components/OrderCard";
import { useOrders } from "@/contexts/OrdersContext";
import { useColors } from "@/hooks/useColors";

export default function CustomerOrders() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders, isLoading, refreshOrders } = useOrders();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      {orders.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState icon="package" title="No Orders Yet" message="Create your first laundry order and track it here in real time." />
          <Link href="/(customer)/create-order" asChild>
            <Pressable style={[styles.createButton, { backgroundColor: colors.primary, borderRadius: colors.radius }]}> 
              <Text style={[styles.createButtonText, { color: colors.primaryForeground }]}>Create Order</Text>
            </Pressable>
          </Link>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 90) }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshOrders} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.title, { color: colors.foreground }]}>Your Orders</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Pull to refresh. Status updates appear automatically.</Text>
            </View>
            <Link href="/(customer)/create-order" asChild>
              <Pressable style={[styles.smallButton, { backgroundColor: colors.primary, borderRadius: colors.radius }]}> 
                <Text style={[styles.smallButtonText, { color: colors.primaryForeground }]}>New</Text>
              </Pressable>
            </Link>
          </View>
          {orders.map((order) => <OrderCard key={order.id} order={order} showDriver />)}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyWrap: { flex: 1, paddingBottom: 90 },
  createButton: { marginHorizontal: 20, marginBottom: 24, paddingVertical: 15, alignItems: "center" },
  createButtonText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3, maxWidth: 260 },
  smallButton: { paddingHorizontal: 16, paddingVertical: 10 },
  smallButtonText: { fontSize: 13, fontFamily: "Inter_700Bold" },
});
