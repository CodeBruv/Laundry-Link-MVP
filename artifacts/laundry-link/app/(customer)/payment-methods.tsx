import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const PAYMENT_MODES = [
  {
    icon: "smartphone" as const,
    title: "Bank Transfer",
    desc: "Transfer directly to the laundromat's or rider's account number. Details are shown on each order when it is ready.",
    badge: "Most Common",
    badgeColor: "#059669",
  },
  {
    icon: "dollar-sign" as const,
    title: "Cash on Pickup / Delivery",
    desc: "Pay cash to the rider on pickup, or to the laundromat when collecting your items.",
    badge: null,
    badgeColor: "",
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Place your order",
    desc: "Choose a laundromat and select your services. No upfront payment required at this step.",
  },
  {
    step: "2",
    title: "Pickup fee — pay rider",
    desc: "When the rider arrives to collect your laundry, pay the pickup fee (₦300–₦1,000) directly to them via bank transfer or cash.",
  },
  {
    step: "3",
    title: "Order ready notification",
    desc: "Once your laundry is cleaned and pressed, you receive a notification with the laundromat's bank account details.",
  },
  {
    step: "4",
    title: "Service + delivery fee — pay laundromat",
    desc: "Transfer the service total plus delivery fee directly to the laundromat's bank account. They confirm receipt before dispatching the rider.",
  },
  {
    step: "5",
    title: "Delivery to your door",
    desc: "Once payment is confirmed, the rider picks up your fresh laundry and delivers it to your address.",
  },
];

export default function PaymentMethodsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.primary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>How Payments Work</Text>
      </View>

      {/* P2P note */}
      <View style={[styles.p2pBanner, { backgroundColor: colors.primary + "0f", borderColor: colors.primary + "30", borderRadius: colors.radius }]}>
        <Feather name="shield" size={18} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.p2pTitle, { color: colors.primary }]}>Peer-to-Peer Payments</Text>
          <Text style={[styles.p2pDesc, { color: colors.mutedForeground }]}>
            LaundryLink does not hold or process your money. All payments go directly from you to the laundromat or rider. We charge businesses a flat monthly subscription — zero commissions on your orders.
          </Text>
        </View>
      </View>

      {/* Payment modes */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Accepted Methods</Text>
      {PAYMENT_MODES.map((mode) => (
        <View key={mode.title} style={[styles.modeCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <View style={[styles.modeIcon, { backgroundColor: colors.primary + "14" }]}>
            <Feather name={mode.icon} size={22} color={colors.primary} />
          </View>
          <View style={styles.modeInfo}>
            <View style={styles.modeTitleRow}>
              <Text style={[styles.modeTitle, { color: colors.foreground }]}>{mode.title}</Text>
              {mode.badge && (
                <View style={[styles.modeBadge, { backgroundColor: mode.badgeColor + "20" }]}>
                  <Text style={[styles.modeBadgeText, { color: mode.badgeColor }]}>{mode.badge}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.modeDesc, { color: colors.mutedForeground }]}>{mode.desc}</Text>
          </View>
        </View>
      ))}

      {/* Payment flow */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Payment Flow</Text>
      <View style={[styles.flowCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
        {HOW_IT_WORKS.map((step, i, arr) => (
          <View
            key={step.step}
            style={[
              styles.flowStep,
              i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
            ]}
          >
            <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.stepNum, { color: colors.primaryForeground }]}>{step.step}</Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>{step.title}</Text>
              <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>{step.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Dispute info */}
      <View style={[styles.disputeCard, { backgroundColor: "#fef3c718", borderRadius: colors.radius, borderColor: "#d9770630" }]}>
        <Feather name="alert-triangle" size={16} color="#d97706" />
        <Text style={[styles.disputeText, { color: colors.mutedForeground }]}>
          Always verify the account details shown on your order before transferring. For payment disputes, contact our support team.
        </Text>
      </View>

      <Pressable
        onPress={() => router.push("/(customer)/help" as any)}
        style={[styles.supportBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
      >
        <Feather name="help-circle" size={16} color={colors.primaryForeground} />
        <Text style={[styles.supportBtnText, { color: colors.primaryForeground }]}>Contact Support</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 12 },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  p2pBanner: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, borderWidth: 1, marginBottom: 24 },
  p2pTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 5 },
  p2pDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  modeCard: { flexDirection: "row", padding: 14, gap: 14, marginBottom: 10, alignItems: "flex-start" },
  modeIcon: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  modeInfo: { flex: 1, gap: 6 },
  modeTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  modeTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  modeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  modeBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  modeDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  flowCard: { marginBottom: 20 },
  flowStep: { flexDirection: "row", padding: 14, gap: 12, alignItems: "flex-start" },
  stepBadge: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", marginTop: 1 },
  stepNum: { fontSize: 12, fontFamily: "Inter_700Bold" },
  stepBody: { flex: 1, gap: 4 },
  stepTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  stepDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  disputeCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderWidth: 1, marginBottom: 16 },
  disputeText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  supportBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15 },
  supportBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
