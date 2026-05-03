import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const SECTIONS = [
  {
    heading: "What We Collect",
    body: "We collect your name, email address, and phone number when you register. For order creation, we collect pickup and delivery addresses. We may collect device push token to send you order notifications.",
  },
  {
    heading: "How We Use Your Data",
    body: "Your data is used to operate the platform: processing orders, assigning riders, sending notifications, and providing support. We do not sell your personal data to third parties.",
  },
  {
    heading: "Payment Data",
    body: "LaundryLink does not store card numbers or bank account details. Payments are handled peer-to-peer between users. Any online card payments are processed by Paystack under their own privacy policy.",
  },
  {
    heading: "Location Data",
    body: "Location access is requested only when placing an order (for pickup address) or when a dispatcher is actively sharing their location for live tracking. We do not track your location in the background.",
  },
  {
    heading: "Data Retention",
    body: "Order history and account data are retained for 24 months after your last activity, or until you request deletion. You may request account deletion at any time via support.",
  },
  {
    heading: "Third-Party Services",
    body: "We use Supabase for secure data storage (hosted in the EU with data residency options), Paystack for payment processing, and Expo for push notifications. Each provider operates under their own privacy policy.",
  },
  {
    heading: "Your Rights (NDPR)",
    body: "Under Nigeria's Data Protection Regulation (NDPR), you have the right to access, correct, and request deletion of your personal data. Contact privacy@laundrylink.ng to exercise your rights.",
  },
  {
    heading: "Cookies & Analytics",
    body: "The web version of LaundryLink may use local storage for session management. We do not use advertising cookies or third-party tracking pixels.",
  },
  {
    heading: "Contact",
    body: "For privacy concerns, contact our Data Protection Officer at privacy@laundrylink.ng or write to us at LaundryLink Ltd, Abuja, FCT, Nigeria.",
  },
];

export default function PrivacyScreen() {
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
        <Text style={[styles.title, { color: colors.foreground }]}>Privacy Policy</Text>
      </View>

      <Text style={[styles.lastUpdated, { color: colors.mutedForeground }]}>Last updated: May 2026 · Compliant with Nigeria NDPR</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
        {SECTIONS.map((sec, i) => (
          <View key={i} style={[styles.section, i < SECTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <View style={styles.headingRow}>
              <Feather name="shield" size={14} color={colors.primary} />
              <Text style={[styles.heading, { color: colors.foreground }]}>{sec.heading}</Text>
            </View>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>{sec.body}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 12 },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  lastUpdated: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 20 },
  card: { overflow: "hidden" },
  section: { padding: 16 },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  heading: { fontSize: 14, fontFamily: "Inter_700Bold" },
  body: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
