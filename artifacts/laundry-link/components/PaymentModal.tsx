import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

interface PaymentModalProps {
  visible: boolean;
  amount: number;
  orderNumber: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

function makeRef() {
  return `LL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    const mod = await import("expo-clipboard");
    await mod.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}

export function PaymentModal({
  visible,
  amount,
  orderNumber,
  bankName,
  accountNumber,
  accountName,
  onSuccess,
  onClose,
}: PaymentModalProps) {
  const colors = useColors();
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(accountNumber);
    if (ok) {
      setCopied(true);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConfirm = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConfirming(true);
    await new Promise((r) => setTimeout(r, 700));
    setConfirming(false);
    onSuccess(makeRef());
  };

  const handleClose = () => {
    setCopied(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primary }]}>
              <Feather name="smartphone" size={18} color={colors.primaryForeground} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>Bank Transfer</Text>
              <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Order #{orderNumber}</Text>
            </View>
          </View>
          <Pressable onPress={handleClose} hitSlop={8}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* Amount */}
          <View style={[styles.amountBox, { backgroundColor: colors.primary + "10", borderRadius: colors.radius }]}>
            <Text style={[styles.amountLabel, { color: colors.mutedForeground }]}>Amount to transfer</Text>
            <Text style={[styles.amountValue, { color: colors.primary }]}>₦{amount.toLocaleString()}</Text>
          </View>

          {/* P2P note */}
          <View style={[styles.noteBox, { backgroundColor: "#05966910", borderRadius: colors.radius, borderColor: "#05966930" }]}>
            <Feather name="shield" size={14} color="#059669" />
            <Text style={[styles.noteText, { color: "#065f46" }]}>
              Transfer goes directly to the laundromat. LaundryLink does not hold or process this payment.
            </Text>
          </View>

          {/* Bank details */}
          <View style={[styles.bankCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            <Text style={[styles.bankCardTitle, { color: colors.foreground }]}>Transfer to</Text>

            <View style={styles.bankRow}>
              <Text style={[styles.bankLabel, { color: colors.mutedForeground }]}>Bank</Text>
              <Text style={[styles.bankValue, { color: colors.foreground }]}>{bankName || "Contact laundromat"}</Text>
            </View>

            <View style={[styles.bankRow, { flexDirection: "row", alignItems: "center" }]}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[styles.bankLabel, { color: colors.mutedForeground }]}>Account Number</Text>
                <Text style={[styles.bankAccNum, { color: colors.foreground }]}>
                  {accountNumber || "—"}
                </Text>
              </View>
              <Pressable
                onPress={handleCopy}
                style={[styles.copyBtn, { backgroundColor: copied ? "#05966918" : colors.primary + "12", borderRadius: 8 }]}
                hitSlop={8}
              >
                <Feather name={copied ? "check" : "copy"} size={14} color={copied ? "#059669" : colors.primary} />
                <Text style={[styles.copyText, { color: copied ? "#059669" : colors.primary }]}>
                  {copied ? "Copied" : "Copy"}
                </Text>
              </Pressable>
            </View>

            <View style={styles.bankRow}>
              <Text style={[styles.bankLabel, { color: colors.mutedForeground }]}>Account Name</Text>
              <Text style={[styles.bankValue, { color: colors.foreground }]}>{accountName || "—"}</Text>
            </View>
          </View>

          {/* Steps */}
          <View style={[styles.stepsCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            {[
              { icon: "smartphone" as const, text: "Open your mobile banking app or dial your bank's USSD code" },
              { icon: "send" as const, text: `Transfer ₦${amount.toLocaleString()} to the account above` },
              { icon: "check-circle" as const, text: "Return here and tap the button below to confirm" },
            ].map((step, i, arr) => (
              <View
                key={i}
                style={[
                  styles.stepRow,
                  i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
              >
                <View style={[styles.stepIcon, { backgroundColor: colors.primary + "12" }]}>
                  <Feather name={step.icon} size={15} color={colors.primary} />
                </View>
                <Text style={[styles.stepText, { color: colors.foreground }]}>{step.text}</Text>
              </View>
            ))}
          </View>

          {/* Confirm button */}
          <Pressable
            onPress={handleConfirm}
            disabled={confirming}
            style={[
              styles.confirmBtn,
              { backgroundColor: "#059669", borderRadius: colors.radius, opacity: confirming ? 0.7 : 1 },
            ]}
          >
            {confirming ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Feather name="check-circle" size={18} color="#ffffff" />
                <Text style={styles.confirmBtnText}>I've completed the transfer</Text>
              </>
            )}
          </Pressable>

          <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
            Tap confirm only after the transfer is complete. The laundromat will verify receipt before dispatching your order.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 20, borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  body: { padding: 20, gap: 16 },
  amountBox: { paddingHorizontal: 16, paddingVertical: 16, gap: 4 },
  amountLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  amountValue: { fontSize: 34, fontFamily: "Inter_700Bold" },
  noteBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderWidth: 1 },
  noteText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium", lineHeight: 17 },
  bankCard: { padding: 16, gap: 14 },
  bankCardTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 2 },
  bankRow: { gap: 4 },
  bankLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  bankValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  bankAccNum: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7 },
  copyText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  stepsCard: { overflow: "hidden" },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  stepIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  stepText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  confirmBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 17, marginTop: 4,
  },
  confirmBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#ffffff" },
  disclaimer: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 16 },
});
