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
import { PaymentModal } from "@/components/PaymentModal";
import { StatusBadge } from "@/components/StatusBadge";
import { DISPATCHERS } from "@/constants/services";
import { LAUNDROMATS } from "@/constants/laundromats";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/contexts/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { OrderStatus } from "@/types";

/**
 * Strict status flow (enforced here and in business/orders + deliveries):
 *
 * Business controls:
 *   PENDING → ACCEPTED → PICKED_UP → IN_PROGRESS → READY
 *   (then blocked until customer pays → PAID)
 *   PAID → OUT_FOR_DELIVERY (business dispatches rider)
 *
 * Customer:
 *   When READY → pays via Paystack → PAID
 *
 * Dispatcher:
 *   ACCEPTED → PICKED_UP
 *   PAID → OUT_FOR_DELIVERY
 *   OUT_FOR_DELIVERY → DELIVERED
 *   Cannot skip payment gate.
 */

// Business can advance through these in order, but ONLY up to READY before payment
const BUSINESS_ADVANCE: Array<{ from: OrderStatus; to: OrderStatus; label: string }> = [
  { from: "PENDING", to: "ACCEPTED", label: "Accept Order" },
  { from: "ACCEPTED", to: "PICKED_UP", label: "Mark Picked Up" },
  { from: "PICKED_UP", to: "IN_PROGRESS", label: "Mark In Progress" },
  { from: "IN_PROGRESS", to: "READY", label: "Mark Ready" },
  { from: "PAID", to: "OUT_FOR_DELIVERY", label: "Send Out for Delivery" },
];

// Dispatcher gets one action at a time, gated strictly
function getDispatcherNextAction(status: OrderStatus): { status: OrderStatus; label: string; icon: keyof typeof Feather.glyphMap } | null {
  if (status === "ACCEPTED" || status === "PENDING") return { status: "PICKED_UP", label: "Mark Picked Up", icon: "shopping-bag" };
  if (status === "PAID") return { status: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: "truck" };
  if (status === "OUT_FOR_DELIVERY") return { status: "DELIVERED", label: "Mark Delivered", icon: "check-circle" };
  return null;
}

export default function OrderDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { role } = useAuth();
  const {
    getOrderById, getHistoryForOrder, updateOrderStatus,
    assignDispatcher, updateDriverLocation, markOrderPaid, isLoading,
  } = useOrders();

  const order = getOrderById(String(id));
  const [isSharingLocation, setIsSharingLocation] = useState(order?.isDriverLocationShared ?? false);
  const [showPayment, setShowPayment] = useState(false);
  const locationWatchRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (role !== "DISPATCHER" || !order) return;
    if (isSharingLocation) startSharingLocation();
    else stopSharingLocation();
    return () => { stopSharingLocation(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSharingLocation]);

  async function startSharingLocation() {
    if (Platform.OS === "web") {
      if (order) await updateDriverLocation(order.id, 9.0698 + Math.random() * 0.01, 7.4431 + Math.random() * 0.01, true);
      return;
    }
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted" || !order) return;
    locationWatchRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 30 },
      async (loc) => { await updateDriverLocation(order.id, loc.coords.latitude, loc.coords.longitude, true); },
    );
  }

  async function stopSharingLocation() {
    if (locationWatchRef.current) { locationWatchRef.current.remove(); locationWatchRef.current = null; }
    if (order) await updateDriverLocation(order.id, 0, 0, false);
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

  const laundromat = LAUNDROMATS.find((l) => l.id === order.businessId);
  const isUrgent = Boolean(order.urgent);
  const isCustomer = role === "CUSTOMER";
  const isBusinessRole = role === "BUSINESS";
  const isDispatcher = role === "DISPATCHER";
  const isTerminal = order.status === "DELIVERED" || order.status === "CANCELLED";
  const showPayNow = isCustomer && order.status === "READY";
  const isPaid = order.status === "PAID";
  const isReady = order.status === "READY";

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

  const handlePaymentSuccess = async (reference: string) => {
    setShowPayment(false);
    await markOrderPaid(order.id, reference);
  };

  // Find the next business action for current status
  const businessAction = BUSINESS_ADVANCE.find((a) => a.from === order.status);
  // Dispatcher next action
  const dispatcherAction = getDispatcherNextAction(order.status);

  return (
    <>
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
        <View style={[styles.card, {
          backgroundColor: isUrgent ? "#ef444410" : isPaid ? "#05966910" : colors.card,
          borderColor: isUrgent ? "#ef4444" : isPaid ? "#059669" : "transparent",
          borderWidth: isUrgent || isPaid ? 1.5 : 0,
          borderRadius: colors.radius,
        }]}>
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
                {isPaid && (
                  <View style={styles.paidChip}>
                    <Feather name="check-circle" size={12} color="#059669" />
                    <Text style={styles.paidChipText}>PAID</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{order.businessName}</Text>
            </View>
            <StatusBadge status={order.status} />
          </View>
          <View style={styles.amountRow}>
            <Text style={[styles.totalValue, { color: isPaid ? "#059669" : colors.primary }]}>
              ₦{order.totalAmount.toLocaleString()}
            </Text>
            <Text style={[styles.feeTag, { color: colors.mutedForeground }]}>
              incl. ₦{order.deliveryFee.toLocaleString()} delivery
            </Text>
          </View>
          {order.paystackRef && (
            <Text style={[styles.refText, { color: colors.mutedForeground }]}>Payment ref: {order.paystackRef}</Text>
          )}
        </View>

        {/* Customer: Pay Now when READY */}
        {showPayNow && (
          <Pressable
            onPress={() => setShowPayment(true)}
            style={[styles.payNowBtn, { backgroundColor: "#059669", borderRadius: colors.radius }]}
          >
            <Feather name="smartphone" size={18} color="#ffffff" />
            <View>
              <Text style={styles.payNowText}>Pay ₦{order.totalAmount.toLocaleString()} — Bank Transfer</Text>
              <Text style={styles.payNowSub}>Your laundry is ready. Transfer to start delivery.</Text>
            </View>
          </Pressable>
        )}

        {/* Payment confirmed (customer) */}
        {isPaid && isCustomer && (
          <View style={[styles.paidBanner, { backgroundColor: "#05966918", borderRadius: colors.radius }]}>
            <Feather name="check-circle" size={18} color="#059669" />
            <Text style={[styles.paidBannerText, { color: "#059669" }]}>
              Payment confirmed! Your laundry is on its way.
            </Text>
          </View>
        )}

        {/* Payment received (business) */}
        {isPaid && isBusinessRole && (
          <View style={[styles.paidBanner, { backgroundColor: "#05966918", borderRadius: colors.radius }]}>
            <Feather name="dollar-sign" size={18} color="#059669" />
            <Text style={[styles.paidBannerText, { color: "#059669" }]}>
              Payment received — ₦{order.totalAmount.toLocaleString()}. Assign dispatcher and send out for delivery.
            </Text>
          </View>
        )}

        {/* Waiting for payment (business + dispatcher) */}
        {isReady && (isBusinessRole || isDispatcher) && (
          <View style={[styles.waitBanner, { backgroundColor: "#d9770610", borderColor: "#d9770630", borderRadius: colors.radius }]}>
            <Feather name="clock" size={16} color="#d97706" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.waitTitle, { color: "#d97706" }]}>Waiting for customer payment</Text>
              <Text style={[styles.waitBody, { color: "#d97706" }]}>
                Customer needs to pay ₦{order.totalAmount.toLocaleString()} before the order can proceed to delivery.
              </Text>
            </View>
          </View>
        )}

        {/* Order details */}
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Order details</Text>
          <InfoRow icon="user" label={order.customerName} />
          <InfoRow icon="map-pin" label={`Pickup: ${order.pickupAddress}`} />
          <InfoRow icon="navigation" label={`Deliver: ${order.deliveryAddress}`} />
          {order.specialRequests ? <InfoRow icon="file-text" label={`Notes: ${order.specialRequests}`} /> : null}
          {order.assignedDriverName && <InfoRow icon="truck" label={`Rider: ${order.assignedDriverName}`} accent />}
        </View>

        {/* Map */}
        {(isCustomer || isBusinessRole) && (
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
          <View style={[styles.itemRow, { paddingTop: 6 }]}>
            <Text style={[styles.itemText, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Total</Text>
            <Text style={[styles.itemText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>₦{order.totalAmount.toLocaleString()}</Text>
          </View>
        </View>

        {/* Dispatcher assignment — Business only, shown when paid to allow dispatch */}
        {isBusinessRole && (isPaid || order.status === "READY") && (
          <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Assign Rider</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Currently: {order.assignedDriverName || "None assigned"}
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

        {/* Dispatcher controls */}
        {isDispatcher && (
          <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Rider Controls</Text>
            <View style={[styles.locationToggleRow, { backgroundColor: isSharingLocation ? colors.primary + "12" : colors.muted + "30", borderRadius: colors.radius }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Share live location</Text>
                <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>
                  {isSharingLocation ? "Customer can see your position on the map" : "Off — activate when on delivery"}
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
            {dispatcherAction && !isTerminal && (
              <Pressable
                onPress={() => handleStatus(dispatcherAction.status, dispatcherAction.label)}
                style={[styles.btn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
              >
                <Feather name={dispatcherAction.icon} size={16} color={colors.primaryForeground} />
                <Text style={[styles.btnText, { color: colors.primaryForeground }]}>{dispatcherAction.label}</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Timeline */}
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Order timeline</Text>
          <OrderTimeline history={getHistoryForOrder(order.id)} />
        </View>

        {/* Business actions — strictly gated */}
        {isBusinessRole && !isTerminal && businessAction && (
          <View style={styles.actionsCol}>
            {order.status === "PENDING" && (
              <Pressable onPress={confirmReject} style={[styles.rejectBtn, { borderRadius: colors.radius }]}>
                <Text style={styles.rejectText}>Reject Order</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => handleStatus(businessAction.to, businessAction.label)}
              style={[styles.btn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
            >
              <Text style={[styles.btnText, { color: colors.primaryForeground }]}>{businessAction.label}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Payment modal */}
      <PaymentModal
        visible={showPayment}
        amount={order.totalAmount}
        orderNumber={order.orderNumber}
        bankName={laundromat?.bankName ?? order.businessName}
        accountNumber={laundromat?.accountNumber ?? "Contact laundromat"}
        accountName={laundromat?.accountName ?? order.businessName}
        onSuccess={handlePaymentSuccess}
        onClose={() => setShowPayment(false)}
      />
    </>
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
  urgentChipText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#ef4444" },
  paidChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#05966920", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  paidChipText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#059669" },
  amountRow: { gap: 2 },
  totalValue: { fontSize: 26, fontFamily: "Inter_700Bold" },
  feeTag: { fontSize: 12, fontFamily: "Inter_400Regular" },
  refText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  payNowBtn: { flexDirection: "row", alignItems: "center", gap: 14, padding: 18, marginBottom: 12 },
  payNowText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#ffffff" },
  payNowSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.85)", marginTop: 2 },
  paidBanner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, marginBottom: 12 },
  paidBannerText: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  waitBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderWidth: 1, marginBottom: 12 },
  waitTitle: { fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 3 },
  waitBody: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 9 },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  mapHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  livePill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#10b98118", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#10b981" },
  liveText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#10b981" },
  itemRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  itemText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  chipRow: { gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, paddingVertical: 11, paddingHorizontal: 14 },
  chipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  locationToggleRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  toggleLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  toggleSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  actionsCol: { gap: 10 },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, paddingHorizontal: 14 },
  btnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  rejectBtn: { backgroundColor: "#ef444416", paddingVertical: 14, alignItems: "center" },
  rejectText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#ef4444" },
});
