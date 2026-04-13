import React from "react";
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { OrderCard } from "@/components/OrderCard";
import { useOrders } from "@/contexts/OrdersContext";
import { useColors } from "@/hooks/useColors";

export default function DispatcherDeliveries() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders, isLoading, refreshOrders } = useOrders();
  const assigned = orders.filter((order) => !!order.assignedDriverName);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      {assigned.length === 0 ? (
        <EmptyState icon="truck" title="No Deliveries" message="Assigned pickup and delivery jobs will appear here after a business selects a dispatcher." />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 90) }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshOrders} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>Assigned Deliveries</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Open an order to see pickup, delivery, and timeline details.</Text>
          {assigned.map((order) => <OrderCard key={order.id} order={order} showCustomer showDriver />)}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 4 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 16 },
});
