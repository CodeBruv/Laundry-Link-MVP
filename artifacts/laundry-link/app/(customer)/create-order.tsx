import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  LAUNDROMATS,
  Laundromat,
  sortLaundromats,
} from "@/constants/laundromats";
import { useOrders } from "@/contexts/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { OrderItem } from "@/types";

const STEPS = ["Laundromat", "Pickup", "Delivery", "Services", "Summary"];

type SortKey = "distance" | "rating" | "price";

export default function CreateOrderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { createOrder } = useOrders();

  const [step, setStep] = useState(0);
  const [selectedLaundromat, setSelectedLaundromat] = useState<Laundromat | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("distance");
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [sameAsPickup, setSameAsPickup] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [specialRequests, setSpecialRequests] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const sortedLaundromats = useMemo(() => sortLaundromats(LAUNDROMATS, sortBy), [sortBy]);
  const services = selectedLaundromat?.services ?? [];
  const deliveryFee = selectedLaundromat?.deliveryFee ?? 1500;

  const items: OrderItem[] = useMemo(() => {
    return services
      .map((s) => ({
        id: s.id,
        serviceName: s.name,
        quantity: quantities[s.id] ?? 0,
        pricePerUnit: s.pricePerUnit,
        total: (quantities[s.id] ?? 0) * s.pricePerUnit,
      }))
      .filter((item) => item.quantity > 0);
  }, [quantities, services]);

  const servicesTotal = items.reduce((sum, item) => sum + item.total, 0);
  const urgentFee = urgent ? 2000 : 0;
  const totalAmount = servicesTotal + urgentFee + deliveryFee;
  const finalDeliveryAddress = sameAsPickup ? pickupAddress : deliveryAddress;

  const useCurrentLocation = async () => {
    setError("");
    if (Platform.OS === "web") {
      setPickupAddress("Current location (tap to use GPS on device)");
      return;
    }
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setError("Location permission not granted. Please type your pickup address.");
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setPickupAddress(`${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`);
  };

  const canContinue = () => {
    if (step === 0) return selectedLaundromat !== null;
    if (step === 1) return pickupAddress.trim().length > 3;
    if (step === 2) return sameAsPickup || deliveryAddress.trim().length > 3;
    if (step === 3) return items.length > 0;
    return true;
  };

  const submit = async () => {
    if (!selectedLaundromat) return;
    setIsSubmitting(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const allItems: OrderItem[] = urgent
      ? [...items, { id: "urgent-fee", serviceName: "Urgent Handling", quantity: 1, pricePerUnit: 2000, total: 2000 }]
      : items;

    const result = await createOrder({
      pickupAddress: pickupAddress.trim(),
      deliveryAddress: finalDeliveryAddress.trim(),
      items: allItems,
      totalAmount,
      deliveryFee,
      specialRequests: specialRequests.trim(),
      urgent,
    });

    setIsSubmitting(false);
    if (result.error) { setError(result.error); return; }
    router.replace("/(customer)/orders");
  };

  const updateQuantity = (serviceId: string, change: number) => {
    setQuantities((curr) => ({
      ...curr,
      [serviceId]: Math.max(0, (curr[serviceId] ?? 0) + change),
    }));
  };

  const handleSelectLaundromat = (l: Laundromat) => {
    if (!l.isOpen) return;
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setSelectedLaundromat(l);
    setQuantities({});
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 90) }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Step indicators */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stepScroll} contentContainerStyle={styles.stepRow}>
        {STEPS.map((label, index) => (
          <View key={label} style={styles.stepItem}>
            <View style={[styles.stepDot, { backgroundColor: index <= step ? colors.primary : colors.muted }]}>
              <Text style={[styles.stepNumber, { color: index <= step ? colors.primaryForeground : colors.mutedForeground }]}>
                {index + 1}
              </Text>
            </View>
            <Text style={[styles.stepLabel, { color: index === step ? colors.primary : colors.mutedForeground }]}>
              {label}
            </Text>
          </View>
        ))}
      </ScrollView>

      {!!error && <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>}

      {/* Step 0 — Choose Laundromat */}
      {step === 0 && (
        <View style={styles.card}>
          <Text style={[styles.title, { color: colors.foreground }]}>Choose a Laundromat</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Each laundromat sets their own prices. Select one to see their services.
          </Text>

          {/* Sort row */}
          <View style={[styles.sortRow, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
            {(["distance", "rating", "price"] as SortKey[]).map((key) => (
              <Pressable
                key={key}
                onPress={() => setSortBy(key)}
                style={[styles.sortBtn, sortBy === key && { backgroundColor: colors.card, borderRadius: colors.radius - 2 }]}
              >
                <Text style={[styles.sortText, { color: sortBy === key ? colors.primary : colors.mutedForeground }]}>
                  {key === "distance" ? "📍 Nearest" : key === "rating" ? "⭐ Rating" : "💰 Cheapest"}
                </Text>
              </Pressable>
            ))}
          </View>

          {sortedLaundromats.map((l) => {
            const isSelected = selectedLaundromat?.id === l.id;
            const minPrice = Math.min(...l.services.map((s) => s.pricePerUnit));
            return (
              <Pressable
                key={l.id}
                onPress={() => handleSelectLaundromat(l)}
                style={[
                  styles.laundryCard,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.card,
                    borderRadius: colors.radius,
                    borderWidth: isSelected ? 0 : 1,
                    borderColor: colors.border,
                    opacity: l.isOpen ? 1 : 0.55,
                  },
                ]}
              >
                <View style={[styles.laundryAvatar, { backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : colors.primary + "14" }]}>
                  <Feather name="home" size={20} color={isSelected ? "#ffffff" : colors.primary} />
                </View>
                <View style={styles.laundryInfo}>
                  <View style={styles.laundryTitleRow}>
                    <Text style={[styles.laundryName, { color: isSelected ? "#ffffff" : colors.foreground }]}>{l.name}</Text>
                    {!l.isOpen && (
                      <View style={[styles.closedChip, { backgroundColor: "#ef444418" }]}>
                        <Text style={styles.closedText}>Closed</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.laundryAddress, { color: isSelected ? "rgba(255,255,255,0.8)" : colors.mutedForeground }]}>
                    {l.location} · {l.distanceKm} km away
                  </Text>
                  <View style={styles.laundryMeta}>
                    <Feather name="star" size={11} color={isSelected ? "#fbbf24" : "#d97706"} />
                    <Text style={[styles.laundryRating, { color: isSelected ? "#ffffff" : colors.foreground }]}>
                      {l.rating} ({l.reviewCount})
                    </Text>
                    <Text style={[styles.laundryPriceFrom, { color: isSelected ? "rgba(255,255,255,0.7)" : colors.mutedForeground }]}>
                      · from ₦{minPrice.toLocaleString()}/item
                    </Text>
                  </View>
                  <View style={styles.laundryFees}>
                    <Text style={[styles.feeTag, { color: isSelected ? "rgba(255,255,255,0.8)" : colors.mutedForeground }]}>
                      Pickup: ₦{l.pickupFee.toLocaleString()} · Delivery: ₦{l.deliveryFee.toLocaleString()}
                    </Text>
                  </View>
                </View>
                {isSelected && <Feather name="check-circle" size={22} color="#ffffff" />}
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Step 1 — Pickup */}
      {step === 1 && (
        <View style={styles.card}>
          <Text style={[styles.title, { color: colors.foreground }]}>Pickup address</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Where should the rider collect your laundry?
          </Text>

          {/* Selected laundromat info */}
          {selectedLaundromat && (
            <View style={[styles.selectedLaundry, { backgroundColor: colors.primary + "0e", borderRadius: colors.radius, borderColor: colors.primary + "25" }]}>
              <Feather name="home" size={15} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.selectedLaundryName, { color: colors.primary }]}>{selectedLaundromat.name}</Text>
                <Text style={[styles.selectedLaundryBank, { color: colors.mutedForeground }]}>
                  Pay to: {selectedLaundromat.bankName} · {selectedLaundromat.accountNumber}
                </Text>
              </View>
            </View>
          )}

          <TextInput
            value={pickupAddress}
            onChangeText={setPickupAddress}
            placeholder="House number, street, area"
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[styles.input, { color: colors.foreground, borderColor: colors.input, borderRadius: colors.radius }]}
          />
          <Pressable
            onPress={useCurrentLocation}
            style={[styles.secondaryButton, { borderColor: colors.primary, borderRadius: colors.radius }]}
          >
            <Feather name="navigation" size={16} color={colors.primary} />
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Use Current Location</Text>
          </Pressable>

          <View style={[styles.pickupFeeNote, { backgroundColor: colors.accent + "10", borderRadius: colors.radius }]}>
            <Feather name="info" size={14} color={colors.accent} />
            <Text style={[styles.pickupFeeText, { color: colors.accent }]}>
              Pay pickup fee (₦{selectedLaundromat?.pickupFee.toLocaleString()}) directly to the rider on arrival.
            </Text>
          </View>
        </View>
      )}

      {/* Step 2 — Delivery */}
      {step === 2 && (
        <View style={styles.card}>
          <Text style={[styles.title, { color: colors.foreground }]}>Delivery address</Text>
          <Pressable onPress={() => setSameAsPickup(!sameAsPickup)} style={styles.checkRow}>
            <View style={[styles.checkbox, { borderColor: colors.primary, backgroundColor: sameAsPickup ? colors.primary : "transparent" }]}>
              {sameAsPickup && <Feather name="check" size={14} color={colors.primaryForeground} />}
            </View>
            <Text style={[styles.checkText, { color: colors.foreground }]}>Same as pickup address</Text>
          </Pressable>
          {!sameAsPickup && (
            <TextInput
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              placeholder="Delivery address"
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={[styles.input, { color: colors.foreground, borderColor: colors.input, borderRadius: colors.radius }]}
            />
          )}
          <View style={[styles.feeNote, { backgroundColor: colors.primary + "10", borderRadius: colors.radius }]}>
            <Feather name="truck" size={15} color={colors.primary} />
            <Text style={[styles.feeNoteText, { color: colors.primary }]}>
              Delivery fee: ₦{deliveryFee.toLocaleString()} (paid to {selectedLaundromat?.name} when order is ready)
            </Text>
          </View>
        </View>
      )}

      {/* Step 3 — Services */}
      {step === 3 && (
        <View style={styles.card}>
          <Text style={[styles.title, { color: colors.foreground }]}>Select services</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Prices set by {selectedLaundromat?.name}.
          </Text>
          {services.map((service) => (
            <View key={service.id} style={[styles.serviceRow, { borderBottomColor: colors.border }]}>
              <View style={styles.serviceInfo}>
                <Text style={[styles.serviceName, { color: colors.foreground }]}>{service.name}</Text>
                <Text style={[styles.serviceDesc, { color: colors.mutedForeground }]}>
                  ₦{service.pricePerUnit.toLocaleString()} / {service.unit}
                </Text>
              </View>
              <View style={styles.qtyRow}>
                <Pressable
                  onPress={() => updateQuantity(service.id, -1)}
                  style={[styles.qtyButton, { backgroundColor: colors.muted }]}
                >
                  <Feather name="minus" size={14} color={colors.foreground} />
                </Pressable>
                <Text style={[styles.qtyText, { color: colors.foreground }]}>{quantities[service.id] ?? 0}</Text>
                <Pressable
                  onPress={() => updateQuantity(service.id, 1)}
                  style={[styles.qtyButton, { backgroundColor: colors.primary }]}
                >
                  <Feather name="plus" size={14} color={colors.primaryForeground} />
                </Pressable>
              </View>
            </View>
          ))}
          {items.length > 0 && (
            <View style={[styles.subtotalRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.subtotalLabel, { color: colors.mutedForeground }]}>Services subtotal</Text>
              <Text style={[styles.subtotalValue, { color: colors.primary }]}>₦{servicesTotal.toLocaleString()}</Text>
            </View>
          )}
        </View>
      )}

      {/* Step 4 — Summary */}
      {step === 4 && (
        <View style={styles.card}>
          <Text style={[styles.title, { color: colors.foreground }]}>Order summary</Text>

          {/* Laundromat */}
          {selectedLaundromat && (
            <View style={[styles.summaryBlock, { backgroundColor: colors.muted + "80", borderRadius: colors.radius }]}>
              <Text style={[styles.blockLabel, { color: colors.mutedForeground }]}>Laundromat</Text>
              <Text style={[styles.blockValue, { color: colors.foreground }]}>{selectedLaundromat.name}</Text>
              <Text style={[styles.blockSub, { color: colors.mutedForeground }]}>{selectedLaundromat.location}</Text>
              <Text style={[styles.blockSub, { color: colors.mutedForeground }]}>
                Payment: {selectedLaundromat.bankName} · {selectedLaundromat.accountNumber} · {selectedLaundromat.accountName}
              </Text>
            </View>
          )}

          {/* Services */}
          {items.map((item) => (
            <View key={item.id} style={styles.summaryRow}>
              <Text style={[styles.summaryText, { color: colors.foreground }]}>{item.quantity}× {item.serviceName}</Text>
              <Text style={[styles.summaryText, { color: colors.foreground }]}>₦{item.total.toLocaleString()}</Text>
            </View>
          ))}

          {/* Pickup fee row */}
          <View style={styles.summaryRow}>
            <View style={styles.feeRowLeft}>
              <Feather name="shopping-bag" size={14} color={colors.mutedForeground} />
              <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>Pickup fee (pay rider)</Text>
            </View>
            <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>₦{selectedLaundromat?.pickupFee.toLocaleString()}</Text>
          </View>

          {/* Delivery fee row */}
          <View style={styles.summaryRow}>
            <View style={styles.feeRowLeft}>
              <Feather name="truck" size={14} color={colors.mutedForeground} />
              <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>Delivery fee (pay laundromat)</Text>
            </View>
            <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>₦{deliveryFee.toLocaleString()}</Text>
          </View>

          {/* Urgent */}
          <View style={styles.switchRow}>
            <View style={styles.serviceInfo}>
              <Text style={[styles.serviceName, { color: colors.foreground }]}>Urgent order</Text>
              <Text style={[styles.serviceDesc, { color: colors.mutedForeground }]}>+₦2,000 priority handling</Text>
            </View>
            <Switch
              value={urgent}
              onValueChange={setUrgent}
              trackColor={{ false: colors.muted, true: colors.accent }}
              thumbColor={urgent ? colors.primary : colors.card}
            />
          </View>
          {urgent && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryText, { color: "#dc2626" }]}>Urgent Handling</Text>
              <Text style={[styles.summaryText, { color: "#dc2626" }]}>₦2,000</Text>
            </View>
          )}

          {/* Special requests */}
          <TextInput
            value={specialRequests}
            onChangeText={setSpecialRequests}
            placeholder="Special requests or fabric care notes"
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[styles.input, styles.textarea, { color: colors.foreground, borderColor: colors.input, borderRadius: colors.radius }]}
          />

          {/* Total */}
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <View>
              <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total (service + delivery)</Text>
              <Text style={[styles.totalNote, { color: colors.mutedForeground }]}>Pickup fee paid separately to rider</Text>
            </View>
            <Text style={[styles.totalValue, { color: colors.primary }]}>₦{totalAmount.toLocaleString()}</Text>
          </View>
        </View>
      )}

      {/* Navigation */}
      <View style={styles.navRow}>
        {step > 0 && (
          <Pressable
            onPress={() => setStep(step - 1)}
            style={[styles.backButton, { borderColor: colors.border, borderRadius: colors.radius }]}
          >
            <Text style={[styles.backButtonText, { color: colors.foreground }]}>Back</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => (step === STEPS.length - 1 ? submit() : setStep(step + 1))}
          disabled={!canContinue() || isSubmitting}
          style={[
            styles.primaryButton,
            { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: !canContinue() || isSubmitting ? 0.6 : 1 },
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
              {step === STEPS.length - 1 ? "Place Order" : "Continue"}
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stepScroll: { marginBottom: 22 },
  stepRow: { flexDirection: "row", gap: 4, paddingRight: 20 },
  stepItem: { alignItems: "center", gap: 6, minWidth: 60 },
  stepDot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  stepNumber: { fontSize: 12, fontFamily: "Inter_700Bold" },
  stepLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  error: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  card: { gap: 14 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  sortRow: { flexDirection: "row", padding: 4, gap: 2 },
  sortBtn: { flex: 1, paddingVertical: 9, alignItems: "center" },
  sortText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  laundryCard: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  laundryAvatar: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  laundryInfo: { flex: 1, gap: 3 },
  laundryTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  laundryName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  closedChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  closedText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#ef4444" },
  laundryAddress: { fontSize: 12, fontFamily: "Inter_400Regular" },
  laundryMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  laundryRating: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  laundryPriceFrom: { fontSize: 11, fontFamily: "Inter_400Regular" },
  laundryFees: {},
  feeTag: { fontSize: 11, fontFamily: "Inter_400Regular" },
  selectedLaundry: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderWidth: 1 },
  selectedLaundryName: { fontSize: 14, fontFamily: "Inter_700Bold" },
  selectedLaundryBank: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  input: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, minHeight: 54, fontSize: 15, fontFamily: "Inter_400Regular", textAlignVertical: "top" },
  textarea: { minHeight: 90 },
  secondaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, paddingVertical: 14 },
  secondaryButtonText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  pickupFeeNote: { flexDirection: "row", alignItems: "flex-start", gap: 9, padding: 13 },
  pickupFeeText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 18 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  checkText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  feeNote: { flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 14, paddingVertical: 12 },
  feeNoteText: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  serviceRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, gap: 10 },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  serviceDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  qtyButton: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  qtyText: { minWidth: 20, textAlign: "center", fontSize: 15, fontFamily: "Inter_700Bold" },
  subtotalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTopWidth: 1 },
  subtotalLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  subtotalValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  summaryBlock: { padding: 12, gap: 4 },
  blockLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  blockValue: { fontSize: 15, fontFamily: "Inter_700Bold" },
  blockSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  feeRowLeft: { flexDirection: "row", alignItems: "center", gap: 7 },
  summaryText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  totalRow: { borderTopWidth: 1, paddingTop: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 14, fontFamily: "Inter_700Bold" },
  totalNote: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  totalValue: { fontSize: 26, fontFamily: "Inter_700Bold" },
  navRow: { flexDirection: "row", gap: 12, marginTop: 24 },
  backButton: { flex: 0.35, borderWidth: 1, paddingVertical: 15, alignItems: "center" },
  backButtonText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  primaryButton: { flex: 1, paddingVertical: 16, alignItems: "center" },
  primaryButtonText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
