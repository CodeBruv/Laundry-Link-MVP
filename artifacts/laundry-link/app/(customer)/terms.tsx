import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const SECTIONS = [
  {
    heading: "1. Acceptance of Terms",
    body: "By accessing or using the LaundryLink platform, you agree to be bound by these Terms of Service. If you do not agree, do not use the app.",
  },
  {
    heading: "2. Service Description",
    body: "LaundryLink is a SaaS platform that connects laundry businesses (laundromats), delivery riders (dispatchers), and customers. We provide software tools — we do not operate a laundry, employ riders, or process orders ourselves.",
  },
  {
    heading: "3. Peer-to-Peer Payments",
    body: "All payments between customers, laundromats, and riders are peer-to-peer. LaundryLink does not collect, hold, or process customer payments. Businesses pay a monthly subscription fee for access to the platform.",
  },
  {
    heading: "4. User Responsibilities",
    body: "Customers are responsible for providing accurate pickup and delivery addresses, and for making payments as agreed. Businesses are responsible for service quality and timely order updates. Riders are responsible for safe and timely pickups and deliveries.",
  },
  {
    heading: "5. Prohibited Uses",
    body: "You may not use LaundryLink to commit fraud, abuse other users, send spam, or violate any applicable Nigerian or international law. Accounts found in violation may be suspended without notice.",
  },
  {
    heading: "6. Limitation of Liability",
    body: "LaundryLink is not liable for damage to garments, failed deliveries, payment disputes between users, or losses arising from platform downtime. We facilitate connections — all service obligations rest with the parties directly.",
  },
  {
    heading: "7. Subscription & Billing",
    body: "Business subscriptions are billed monthly in Nigerian Naira. Prices are as stated at time of purchase. Subscriptions auto-renew unless cancelled before the renewal date. No refunds are given for partial months.",
  },
  {
    heading: "8. Termination",
    body: "We may terminate or suspend your access to LaundryLink at any time, with or without cause. You may cancel your account at any time through the app.",
  },
  {
    heading: "9. Governing Law",
    body: "These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved through the appropriate courts in Abuja, FCT.",
  },
  {
    heading: "10. Changes to Terms",
    body: "We reserve the right to update these Terms at any time. Continued use of the platform following any update constitutes acceptance of the revised Terms.",
  },
];

export default function TermsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.primary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Terms of Service</Text>
      </View>

      <Text style={[styles.lastUpdated, { color: colors.mutedForeground }]}>Last updated: May 2026</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
        {SECTIONS.map((sec, i) => (
          <View key={i} style={[styles.section, i < SECTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <Text style={[styles.heading, { color: colors.foreground }]}>{sec.heading}</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>{sec.body}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.contact, { color: colors.mutedForeground }]}>
        Questions about these terms? Email legal@laundrylink.ng
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 12 },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  lastUpdated: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 20 },
  card: { overflow: "hidden", marginBottom: 20 },
  section: { padding: 16 },
  heading: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 8 },
  body: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  contact: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
});
