import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const FAQS = [
  {
    q: "How does pickup and delivery work?",
    a: "After placing an order, a nearby rider is assigned to collect your laundry. Once cleaned, you pay the service fee and the rider delivers it back to your address.",
  },
  {
    q: "How do I pay for my order?",
    a: "LaundryLink uses peer-to-peer payments — you pay the rider directly (cash or transfer) for pickup, and pay the laundromat directly (online via card or transfer) when your order is ready.",
  },
  {
    q: "How long does laundry take?",
    a: "Standard orders take 24–48 hours. Express orders (marked Urgent) are prioritised for same-day or next-morning delivery where the laundromat supports it.",
  },
  {
    q: "Can I cancel an order?",
    a: "You can cancel before the laundromat accepts the order. Once accepted and picked up, contact the laundromat directly to arrange any changes.",
  },
  {
    q: "What if my clothes are damaged?",
    a: "LaundryLink facilitates the connection but does not take responsibility for garment damage. Contact the laundromat directly and report to our support team for mediation.",
  },
];

export default function HelpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSending(false);
    setSent(true);
    setMessage("");
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.primary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Help & Support</Text>
      </View>

      {/* Quick contact */}
      <View style={styles.contactRow}>
        <Pressable
          onPress={() => Linking.openURL("mailto:support@laundrylink.ng")}
          style={[styles.contactBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
        >
          <Feather name="mail" size={16} color={colors.primaryForeground} />
          <Text style={[styles.contactBtnText, { color: colors.primaryForeground }]}>Email</Text>
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL("https://wa.me/2348000000001")}
          style={[styles.contactBtn, { backgroundColor: "#25D366", borderRadius: colors.radius }]}
        >
          <Feather name="message-circle" size={16} color="#ffffff" />
          <Text style={[styles.contactBtnText, { color: "#ffffff" }]}>WhatsApp</Text>
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL("tel:+2348000000001")}
          style={[styles.contactBtn, { backgroundColor: colors.accent, borderRadius: colors.radius }]}
        >
          <Feather name="phone" size={16} color="#ffffff" />
          <Text style={[styles.contactBtnText, { color: "#ffffff" }]}>Call</Text>
        </Pressable>
      </View>

      {/* FAQs */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Frequently Asked Questions</Text>
      {FAQS.map((faq, i) => (
        <Pressable
          key={i}
          onPress={() => setExpanded(expanded === i ? null : i)}
          style={[styles.faqItem, { backgroundColor: colors.card, borderRadius: colors.radius, marginBottom: 8 }]}
        >
          <View style={styles.faqHeader}>
            <Text style={[styles.faqQ, { color: colors.foreground, flex: 1 }]}>{faq.q}</Text>
            <Feather name={expanded === i ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
          </View>
          {expanded === i && (
            <Text style={[styles.faqA, { color: colors.mutedForeground, borderTopColor: colors.border }]}>
              {faq.a}
            </Text>
          )}
        </Pressable>
      ))}

      {/* Message form */}
      <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>Send a Message</Text>
      {sent ? (
        <View style={[styles.sentCard, { backgroundColor: "#05966910", borderRadius: colors.radius }]}>
          <Feather name="check-circle" size={24} color="#059669" />
          <Text style={[styles.sentText, { color: "#059669" }]}>
            Message sent! Our team will respond within 24 hours.
          </Text>
        </View>
      ) : (
        <View style={[styles.formCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Describe your issue or question…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[styles.textarea, { color: colors.foreground, borderColor: colors.input, borderRadius: colors.radius }]}
          />
          <Pressable
            onPress={sendMessage}
            disabled={!message.trim() || sending}
            style={[styles.sendBtn, { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: !message.trim() ? 0.5 : 1 }]}
          >
            {sending ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <>
                <Feather name="send" size={16} color={colors.primaryForeground} />
                <Text style={[styles.sendBtnText, { color: colors.primaryForeground }]}>Send Message</Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 12 },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  contactRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  contactBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13 },
  contactBtnText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  faqItem: { overflow: "hidden" },
  faqHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 8 },
  faqQ: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  faqA: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, paddingHorizontal: 14, paddingBottom: 14, paddingTop: 12, borderTopWidth: 1 },
  sentCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 18 },
  sentText: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  formCard: { padding: 16, gap: 12 },
  textarea: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, minHeight: 110, fontSize: 15, fontFamily: "Inter_400Regular", textAlignVertical: "top" },
  sendBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  sendBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
});
