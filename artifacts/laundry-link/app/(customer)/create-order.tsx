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

import { LAUNDRY_SERVICES } from "@/constants/services";
import { useOrders } from "@/contexts/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { OrderItem } from "@/types";

const STEPS = ["Pickup", "Delivery", "Services", "Summary"];
const DELIVERY_FEE = 1500;

export default function CreateOrderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { createOrder } = useOrders();

  const [step, setStep] = useState(0);
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [sameAsPickup, setSameAsPickup] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [specialRequests, setSpecialRequests] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const items: OrderItem[] = useMemo(() => {
    return LAUNDRY_SERVICES.filter((s) => s.id !== "express-fee")
      .map((service) => {
        const quantity = quantities[service.id] ?? 0;
        return {
          id: service.id,
          serviceName: service.name,
          quantity,
          pricePerUnit: service.pricePerUnit,
          total: quantity * service.pricePerUnit,
        };
      })
      .filter((item) => item.quantity > 0);
  }, [quantities]);

  const servicesTotal = items.reduce((sum, item) => sum + item.total, 0);
  const urgentFee = urgent ? 2000 : 0;
  const totalAmount = servicesTotal + urgentFee + DELIVERY_FEE;
  const finalDeliveryAddress = sameAsPickup ? pickupAddress : deliveryAddress;

  const useCurrentLocation = async () => {
    setError("");
    if (Platform.OS === "web") {
      setPickupAddress("Current location (browser GPS not available in preview)");
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
    if (step === 0) return pickupAddress.trim().length > 3;
    if (step === 1) return sameAsPickup || deliveryAddress.trim().length > 3;
    if (step === 2) return items.length > 0;
    return true;
  };

  const submit = async () => {
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
      deliveryFee: DELIVERY_FEE,
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 90) }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Step indicators */}
      <View style={styles.stepRow}>
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
      </View>

      {!!error && <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>}

      {/* Step 0 – Pickup */}
      {step === 0 && (
        <View style={styles.card}>
          <Text style={[styles.title, { color: colors.foreground }]}>Pickup address</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Where should the dispatcher collect your laundry?
          </Text>
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
        </View>
      )}

      {/* Step 1 – Delivery */}
      {step === 1 && (
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
          <View style={[styles.feeNote, { backgroundColor: colors.primary + "12", borderRadius: colors.radius }]}>
            <Feather name="truck" size={15} color={colors.primary} />
            <Text style={[styles.feeNoteText, { color: colors.primary }]}>
              Flat delivery fee: ₦{DELIVERY_FEE.toLocaleString()} (included in total)
            </Text>
          </View>
        </View>
      )}

      {/* Step 2 – Services */}
      {step === 2 && (
        <View style={styles.card}>
          <Text style={[styles.title, { color: colors.foreground }]}>Select services</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Add laundry services and quantities.</Text>
          {LAUNDRY_SERVICES.filter((s) => s.id !== "express-fee").map((service) => (
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
        </View>
      )}

      {/* Step 3 – Summary */}
      {step === 3 && (
        <View style={styles.card}>
          <Text style={[styles.title, { color: colors.foreground }]}>Order summary</Text>

          {/* Services */}
          {items.map((item) => (
            <View key={item.id} style={styles.summaryRow}>
              <Text style={[styles.summaryText, { color: colors.foreground }]}>{item.quantity}× {item.serviceName}</Text>
              <Text style={[styles.summaryText, { color: colors.foreground }]}>₦{item.total.toLocaleString()}</Text>
            </View>
          ))}

          {/* Delivery fee line */}
          <View style={styles.summaryRow}>
            <View style={styles.feeRowLeft}>
              <Feather name="truck" size={14} color={colors.mutedForeground} />
              <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>Delivery fee</Text>
            </View>
            <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>₦{DELIVERY_FEE.toLocaleString()}</Text>
          </View>

          {/* Urgent toggle */}
          <View style={styles.switchRow}>
            <View style={styles.serviceInfo}>
              <Text style={[styles.serviceName, { color: colors.foreground }]}>Urgent order</Text>
              <Text style={[styles.serviceDesc, { color: colors.mutedForeground }]}>
                +₦2,000 priority handling
              </Text>
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
              <Text style={[styles.summaryText, { color: "#ef4444" }]}>Urgent Handling</Text>
              <Text style={[styles.summaryText, { color: "#ef4444" }]}>₦2,000</Text>
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
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>₦{totalAmount.toLocaleString()}</Text>
          </View>

          {urgent && (
            <View style={[styles.urgentBadge, { backgroundColor: "#ef444418", borderRadius: colors.radius }]}>
              <Feather name="zap" size={14} color="#ef4444" />
              <Text style={styles.urgentText}>Urgent order — priority processing requested</Text>
            </View>
          )}
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
          onPress={() => (step === 3 ? submit() : setStep(step + 1))}
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
              {step === 3 ? "Place Order" : "Continue"}
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stepRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 22 },
  stepItem: { alignItems: "center", flex: 1, gap: 6 },
  stepDot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  stepNumber: { fontSize: 12, fontFamily: "Inter_700Bold" },
  stepLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  error: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  card: { gap: 14 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  input: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, minHeight: 54, fontSize: 15, fontFamily: "Inter_400Regular", textAlignVertical: "top" },
  textarea: { minHeight: 90 },
  secondaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, paddingVertical: 14 },
  secondaryButtonText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
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
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  feeRowLeft: { flexDirection: "row", alignItems: "center", gap: 7 },
  summaryText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  totalRow: { borderTopWidth: 1, paddingTop: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 16, fontFamily: "Inter_700Bold" },
  totalValue: { fontSize: 26, fontFamily: "Inter_700Bold" },
  urgentBadge: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  urgentText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#ef4444" },
  navRow: { flexDirection: "row", gap: 12, marginTop: 24 },
  backButton: { flex: 0.35, borderWidth: 1, paddingVertical: 15, alignItems: "center" },
  backButtonText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  primaryButton: { flex: 1, paddingVertical: 16, alignItems: "center" },
  primaryButtonText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
