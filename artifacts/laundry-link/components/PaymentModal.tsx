import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

interface PaymentModalProps {
  visible: boolean;
  amount: number;
  orderNumber: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

type Stage = "form" | "processing" | "success" | "error";

function formatCard(raw: string) {
  return raw.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

export function PaymentModal({ visible, amount, orderNumber, onSuccess, onClose }: PaymentModalProps) {
  const colors = useColors();
  const [stage, setStage] = useState<Stage>("form");
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const isFormValid =
    card.replace(/\s/g, "").length === 16 &&
    expiry.length === 5 &&
    cvv.length === 3 &&
    name.trim().length > 1;

  const reset = () => {
    setStage("form");
    setCard("");
    setExpiry("");
    setCvv("");
    setName("");
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePay = async () => {
    setError("");
    if (!isFormValid) { setError("Please fill in all card details correctly."); return; }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStage("processing");
    // Simulate Paystack processing (1.8s)
    await new Promise((r) => setTimeout(r, 1800));
    const ref = `PS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    setStage("success");
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Give the user 1.5s to see success, then callback
    await new Promise((r) => setTimeout(r, 1500));
    reset();
    onSuccess(ref);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.sheet, { backgroundColor: colors.background }]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.paystackLogo, { backgroundColor: colors.primary }]}>
              <Feather name="shield" size={16} color={colors.primaryForeground} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>Secure Checkout</Text>
              <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Order #{orderNumber}</Text>
            </View>
          </View>
          <Pressable onPress={handleClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {stage === "form" && (
          <View style={styles.body}>
            {/* Amount */}
            <View style={[styles.amountBox, { backgroundColor: colors.primary + "10", borderRadius: colors.radius }]}>
              <Text style={[styles.amountLabel, { color: colors.mutedForeground }]}>Amount due</Text>
              <Text style={[styles.amountValue, { color: colors.primary }]}>₦{amount.toLocaleString()}</Text>
            </View>

            {/* Card name */}
            <LabeledInput
              label="Cardholder name"
              value={name}
              onChangeText={setName}
              placeholder="Full name on card"
              autoCapitalize="words"
              colors={colors}
            />

            {/* Card number */}
            <LabeledInput
              label="Card number"
              value={card}
              onChangeText={(t) => setCard(formatCard(t))}
              placeholder="0000 0000 0000 0000"
              keyboardType="numeric"
              colors={colors}
              icon="credit-card"
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <LabeledInput
                  label="Expiry"
                  value={expiry}
                  onChangeText={(t) => setExpiry(formatExpiry(t))}
                  placeholder="MM/YY"
                  keyboardType="numeric"
                  colors={colors}
                />
              </View>
              <View style={{ flex: 1 }}>
                <LabeledInput
                  label="CVV"
                  value={cvv}
                  onChangeText={(t) => setCvv(t.replace(/\D/g, "").slice(0, 3))}
                  placeholder="000"
                  keyboardType="numeric"
                  secureTextEntry
                  colors={colors}
                />
              </View>
            </View>

            {!!error && (
              <View style={[styles.errorRow, { backgroundColor: "#ef444412", borderRadius: colors.radius }]}>
                <Feather name="alert-circle" size={14} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Pressable
              onPress={handlePay}
              disabled={!isFormValid}
              style={[styles.payBtn, { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: isFormValid ? 1 : 0.5 }]}
            >
              <Feather name="lock" size={16} color={colors.primaryForeground} />
              <Text style={[styles.payBtnText, { color: colors.primaryForeground }]}>
                Pay ₦{amount.toLocaleString()} securely
              </Text>
            </Pressable>

            <View style={styles.securityRow}>
              <Feather name="shield" size={12} color={colors.mutedForeground} />
              <Text style={[styles.securityText, { color: colors.mutedForeground }]}>
                256-bit SSL encrypted · Powered by Paystack
              </Text>
            </View>
          </View>
        )}

        {stage === "processing" && (
          <View style={styles.statusCenter}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.statusTitle, { color: colors.foreground }]}>Processing payment…</Text>
            <Text style={[styles.statusSub, { color: colors.mutedForeground }]}>Please wait, do not close this screen.</Text>
          </View>
        )}

        {stage === "success" && (
          <View style={styles.statusCenter}>
            <View style={[styles.successIcon, { backgroundColor: "#10b98118" }]}>
              <Feather name="check-circle" size={48} color="#10b981" />
            </View>
            <Text style={[styles.statusTitle, { color: colors.foreground }]}>Payment successful!</Text>
            <Text style={[styles.statusSub, { color: colors.mutedForeground }]}>
              Your order has been marked as paid. The laundromat will be notified.
            </Text>
          </View>
        )}

        {stage === "error" && (
          <View style={styles.statusCenter}>
            <View style={[styles.errorIcon, { backgroundColor: "#ef444418" }]}>
              <Feather name="x-circle" size={48} color="#ef4444" />
            </View>
            <Text style={[styles.statusTitle, { color: colors.foreground }]}>Payment failed</Text>
            <Text style={[styles.statusSub, { color: colors.mutedForeground }]}>Please try again or use a different card.</Text>
            <Pressable onPress={() => setStage("form")} style={[styles.retryBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
              <Text style={[styles.retryText, { color: colors.primaryForeground }]}>Try again</Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  autoCapitalize,
  icon,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: "numeric" | "default";
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "words";
  icon?: keyof typeof Feather.glyphMap;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <View style={styles.inputWrap}>
      <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[styles.inputBox, { borderColor: colors.input, borderRadius: colors.radius }]}>
        {icon && <Feather name={icon} size={15} color={colors.mutedForeground} style={{ marginLeft: 12 }} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType={keyboardType ?? "default"}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize ?? "none"}
          style={[styles.input, { color: colors.foreground }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  paystackLogo: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  closeBtn: { padding: 6 },
  body: { padding: 20, gap: 16 },
  amountBox: { paddingHorizontal: 16, paddingVertical: 14, gap: 4 },
  amountLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  amountValue: { fontSize: 30, fontFamily: "Inter_700Bold" },
  inputWrap: { gap: 6 },
  inputLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  inputBox: { flexDirection: "row", alignItems: "center", borderWidth: 1 },
  input: { flex: 1, paddingHorizontal: 12, paddingVertical: 13, fontSize: 15, fontFamily: "Inter_400Regular" },
  row: { flexDirection: "row", gap: 12 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12 },
  errorText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", color: "#ef4444" },
  payBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, marginTop: 4 },
  payBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  securityRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  securityText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  statusCenter: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  successIcon: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center" },
  errorIcon: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center" },
  statusTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  statusSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  retryBtn: { paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 },
  retryText: { fontSize: 15, fontFamily: "Inter_700Bold" },
});
