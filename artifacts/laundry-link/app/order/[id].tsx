import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { OrderMap } from "@/components/OrderMap";
import { OrderTimeline } from "@/components/OrderTimeline";
import { StatusBadge } from "@/components/StatusBadge";
import { DISPATCHERS } from "@/constants/services";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/contexts/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { OrderStatus } from "@/types";

// What statuses can business advance through
const BUSINESS_FLOW: OrderStatus[] = ["ACCEPTED", "PICKED_UP", "IN_PROGRESS", "READY"];
// What statuses dispatcher can trigger
const DISPATCHER_FLOW: { status: OrderStatus; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { status: "PICKED_UP", label: "Mark Picked Up", icon: "shopping-bag" },
  { status: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: "truck" },
  { status: "DELIVERED", label: "Mark Delivered", icon: "check-circle" },
];

export default function OrderDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { role } = useAuth();
  const { getOrderById, getHistoryForOrder, updateOrderStatus, assignDispatcher, updateDriverLocation, isLoading } =
    useOrders();

  const order = getOrderById(String(id));
  const [isSharingLocation, setIsSharingLocation] = useState(order?.isDriverLocationShared ?? false);
  const locationWatchRef = useRef<Location.LocationSubscription | null>(null);

  // Start/stop location sharing for dispatcher
  useEffect(() => {
    if (role !== "DISPATCHER" || !order) return;
    if (isSharingLocation) {
      startSharingLocation();
    } else {
      stopSharingLocation();
    }
    return () => { stopSharingLocation(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSharingLocation]);

  async function startSharingLocation() {
    if (Platform.OS === "web") {
      // Simulate a location on web
      if (order) {
        await updateDriverLocation(order.id, 9.0698 + Math.random() * 0.01, 7.4431 + Math.random() * 0.01, true);
      }
      return;
    }
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted" || !order) return;
    locationWatchRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 30 },
      async (loc) => {
        await updateDriverLocation(order.id, loc.coords.latitude, loc.coords.longitude, true);
      },
    );
  }

  async function stopSharingLocation() {
    if (locationWatchRef.current) {
      locationWatchRef.current.remove();
      locationWatchRef.current = null;
    }
    if (order) {
      await updateDriverLocation(order.id, 0, 0, false);
    }
  }

  if (!order) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} size="large" />
        ) : (
          <>
            <Text style={[styles.title, { color: colors.foreground }]}>Order not found</Text>
            <Pressable onPress={() => router.back()} style={[styles.btn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
              <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Go Back</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  const isUrgent = Boolean(order.urgent);

  const handleStatus = async (status: OrderStatus, label: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateOrderStatus(order.id, status, `${label} — updated by ${role?.toLowerCase()}`);
  };

  const confirmReject = () => {
    if (Platform.OS === "web") { handleStatus("CANCELLED", "Rejected"); return; }
    Alert.alert("Reject order", "This will cancel the order.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reject", style: "destructive", onPress: () => handleStatus("CANCELLED", "Rejected") },
    ]);
  };

  const canBusinessUpdate = role === "BUSINESS" && order.status !== "DELIVERED" && order.status !== "CANCELLED";
  const isDispatcher = role === "DISPATCHER";
  const canDispatcherUpdate = isDispatcher && order.status !== "DELIVERED" && order.status !== "CANCELLED";
  const showMap = role === "CUSTOMER" || role === "BUSINESS";
  const isOnDelivery = order.status === "OUT_FOR_DELIVERY";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Back */}
      <Pressable onPress={() => router.back()} style={styles.backRow}>
        <Feather name="chevron-left" size={22} color={colors.primary} />
        <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
      </Pressable>

      {/* Header card */}
      <View style={[styles.card, { backgroundColor: isUrgent ? "#ef444410" : colors.card, borderColor: isUrgent ? "#ef4444" : "transparent", borderWidth: isUrgent ? 1.5 : 0, borderRadius: colors.radius }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.orderNumRow}>
              <Text style={[styles.title, { color: colors.foreground }]}>#{order.orderNumber}</Text>
              {isUrgent && (
                <View style={styles.urgentChip}>
                  <Feather name="zap" size={12} color="#ef4444" />
                  <Text style={styles.urgentChipText}>URGENT</Text>
                </View>
              )}
            </View>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{order.businessName}</Text>
          </View>
          <StatusBadge status={order.status} />
        </View>
        <View style={styles.amountRow}>
          <Text style={[styles.totalValue, { color: colors.primary }]}>₦{order.totalAmount.toLocaleString()}</Text>
          <Text style={[styles.feeTag, { color: colors.mutedForeground }]}>incl. ₦{order.deliveryFee.toLocaleString()} delivery</Text>
        </View>
      </View>

      {/* Addresses */}
      <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Order details</Text>
        <InfoRow icon="user" label={order.customerName} />
        <InfoRow icon="map-pin" label={`Pickup: ${order.pickupAddress}`} />
        <InfoRow icon="navigation" label={`Delivery: ${order.deliveryAddress}`} />
        {order.specialRequests ? <InfoRow icon="file-text" label={`Notes: ${order.specialRequests}`} /> : null}
        {order.assignedDriverName && <InfoRow icon="truck" label={`Driver: ${order.assignedDriverName}`} accent />}
      </View>

      {/* Map — Customer and Business views */}
      {showMap && (
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <View style={styles.mapHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Live tracking</Text>
            {order.isDriverLocationShared && (
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>
          <OrderMap order={order} />
        </View>
      )}

      {/* Items */}
      <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Items</Text>
        {order.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={[styles.itemText, { color: colors.foreground }]}>{item.quantity}× {item.serviceName}</Text>
            <Text style={[styles.itemText, { color: colors.foreground }]}>₦{item.total.toLocaleString()}</Text>
          </View>
        ))}
        <View style={[styles.itemRow, { paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }]}>
          <Text style={[styles.itemText, { color: colors.mutedForeground }]}>Delivery fee</Text>
          <Text style={[styles.itemText, { color: colors.mutedForeground }]}>₦{order.deliveryFee.toLocaleString()}</Text>
        </View>
      </View>

      {/* Dispatcher assignment (Business only) */}
      {role === "BUSINESS" && (
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Assign dispatcher</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Currently: {order.assignedDriverName || "None"}
          </Text>
          <View style={styles.chipRow}>
            {DISPATCHERS.map((driver) => {
              const isSelected = order.dispatcherId === driver.id;
              return (
                <Pressable
                  key={driver.id}
                  onPress={() => assignDispatcher(order.id, driver.id, driver.name)}
                  style={[styles.chip, {
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected ? colors.primary : colors.card,
                    borderRadius: colors.radius,
                  }]}
                >
                  <Feather name="user" size={13} color={isSelected ? colors.primaryForeground : colors.mutedForeground} />
                  <Text style={[styles.chipText, { color: isSelected ? colors.primaryForeground : colors.foreground }]}>
                    {driver.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Dispatcher: location sharing + status actions */}
      {isDispatcher && (
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Driver controls</Text>

          <View style={[styles.locationToggleRow, { backgroundColor: isSharingLocation ? colors.primary + "12" : colors.muted + "30", borderRadius: colors.radius }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Share live location</Text>
              <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>
                {isSharingLocation ? "Customer and business can see your position" : "Off — activate when on delivery"}
              </Text>
            </View>
            <Switch
              value={isSharingLocation}
              onValueChange={(v) => {
                setIsSharingLocation(v);
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              trackColor={{ false: colors.muted, true: colors.accent }}
              thumbColor={isSharingLocation ? colors.primary : colors.card}
            />
          </View>

          {canDispatcherUpdate && (
            <View style={styles.dispatcherActions}>
              {DISPATCHER_FLOW.filter((action) => {
                const idx = DISPATCHER_FLOW.findIndex((a) => a.status === order.status);
                const actionIdx = DISPATCHER_FLOW.findIndex((a) => a.status === action.status);
                return actionIdx > idx;
              }).map((action) => (
                <Pressable
                  key={action.status}
                  onPress={() => handleStatus(action.status, action.label)}
                  style={[styles.btn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
                >
                  <Feather name={action.icon} size={16} color={colors.primaryForeground} />
                  <Text style={[styles.btnText, { color: colors.primaryForeground }]}>{action.label}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Timeline */}
      <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Order timeline</Text>
        <OrderTimeline history={getHistoryForOrder(order.id)} />
      </View>

      {/* Business action buttons */}
      {canBusinessUpdate && (
        <View style={styles.actionsRow}>
          {order.status === "PENDING" && (
            <Pressable onPress={confirmReject} style={[styles.rejectBtn, { borderRadius: colors.radius }]}>
              <Text style={styles.rejectText}>Reject</Text>
            </Pressable>
          )}
          {BUSINESS_FLOW.filter((s) => s !== order.status).map((status) => (
            <Pressable
              key={status}
              onPress={() => handleStatus(status, status.replaceAll("_", " "))}
              style={[styles.btn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
            >
              <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
                {status === "ACCEPTED" ? "Accept" : status.replaceAll("_", " ")}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function InfoRow({ icon, label, accent }: { icon: keyof typeof Feather.glyphMap; label: string; accent?: boolean }) {
  const colors = useColors();
  return (
    <View style={styles.infoRow}>
      <Feather name={icon} size={15} color={accent ? colors.accent : colors.mutedForeground} />
      <Text style={[styles.infoText, { color: accent ? colors.accent : colors.foreground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: 16 },
  backText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  card: { padding: 16, marginBottom: 12, gap: 12 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  orderNumRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  urgentChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#ef444420", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  urgentChipText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#ef4444", letterSpacing: 0.5 },
  amountRow: { gap: 2 },
  totalValue: { fontSize: 26, fontFamily: "Inter_700Bold" },
  feeTag: { fontSize: 12, fontFamily: "Inter_400Regular" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 9 },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  mapHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  livePill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#10b98118", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#10b981" },
  liveText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#10b981", letterSpacing: 0.5 },
  itemRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  itemText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  chipRow: { gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, paddingVertical: 11, paddingHorizontal: 14 },
  chipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  locationToggleRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  toggleLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  toggleSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  dispatcherActions: { gap: 8, marginTop: 4 },
  actionsRow: { gap: 10, flexDirection: "column" },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, paddingHorizontal: 14 },
  btnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  rejectBtn: { backgroundColor: "#ef444416", paddingVertical: 14, alignItems: "center" },
  rejectText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#ef4444" },
});
