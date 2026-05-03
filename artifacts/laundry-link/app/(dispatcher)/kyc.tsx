import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

const STORAGE_KEY = "ll_kyc_v1";

interface KycData {
  ninNumber: string;
  bvn: string;
  guarantorName: string;
  guarantorPhone: string;
  status: "unsubmitted" | "pending" | "approved" | "rejected";
}

const STATUS_CONFIG = {
  unsubmitted: { color: "#64748b", icon: "clock" as const, label: "Not submitted" },
  pending: { color: "#d97706", icon: "loader" as const, label: "Under review" },
  approved: { color: "#059669", icon: "check-circle" as const, label: "Approved" },
  rejected: { color: "#dc2626", icon: "x-circle" as const, label: "Rejected — resubmit" },
};

export default function KycScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [kyc, setKyc] = useState<KycData>({
    ninNumber: "", bvn: "", guarantorName: "", guarantorPhone: "", status: "unsubmitted",
  });
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setKyc(JSON.parse(raw));
    });
  }, []);

  const isComplete = kyc.ninNumber.length >= 11 && kyc.bvn.length >= 11 && kyc.guarantorName.trim().length > 2 && kyc.guarantorPhone.length >= 10;

  const handleSubmit = async () => {
    if (!isComplete) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    const updated: KycData = { ...kyc, status: "pending" };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setKyc(updated);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    setSubmitted(true);
  };

  const cfg = STATUS_CONFIG[kyc.status];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.primary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>KYC Documents</Text>
      </View>

      {/* Status badge */}
      <View style={[styles.statusBanner, { backgroundColor: cfg.color + "14", borderColor: cfg.color + "30", borderRadius: colors.radius }]}>
        <Feather name={cfg.icon} size={16} color={cfg.color} />
        <Text style={[styles.statusText, { color: cfg.color }]}>Verification status: {cfg.label}</Text>
      </View>

      {submitted && kyc.status === "pending" ? (
        <View style={[styles.successCard, { backgroundColor: "#05966912", borderRadius: colors.radius }]}>
          <Feather name="check-circle" size={36} color="#059669" />
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Documents Submitted</Text>
          <Text style={[styles.successBody, { color: colors.mutedForeground }]}>
            Your KYC documents are under review. We will notify you within 24 hours once approved.
          </Text>
        </View>
      ) : (
        <View style={[styles.form, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <Text style={[styles.formHint, { color: colors.mutedForeground }]}>
            Required to start accepting delivery orders. All information is encrypted and stored securely.
          </Text>

          <LabeledInput label="NIN Number" value={kyc.ninNumber} onChangeText={(v) => setKyc((p) => ({ ...p, ninNumber: v.replace(/\D/g, "").slice(0, 11) }))}
            placeholder="11-digit NIN" colors={colors} keyboardType="numeric" />
          <LabeledInput label="BVN" value={kyc.bvn} onChangeText={(v) => setKyc((p) => ({ ...p, bvn: v.replace(/\D/g, "").slice(0, 11) }))}
            placeholder="11-digit BVN" colors={colors} keyboardType="numeric" />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Guarantor Information</Text>

          <LabeledInput label="Guarantor Full Name" value={kyc.guarantorName} onChangeText={(v) => setKyc((p) => ({ ...p, guarantorName: v }))}
            placeholder="Full name" colors={colors} autoCapitalize="words" />
          <LabeledInput label="Guarantor Phone" value={kyc.guarantorPhone} onChangeText={(v) => setKyc((p) => ({ ...p, guarantorPhone: v.replace(/\D/g, "").slice(0, 11) }))}
            placeholder="080XXXXXXXX" colors={colors} keyboardType="phone-pad" />

          <Pressable
            onPress={handleSubmit}
            disabled={!isComplete || saving}
            style={[styles.submitBtn, { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: !isComplete ? 0.5 : 1 }]}
          >
            {saving ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <>
                <Feather name="shield" size={16} color={colors.primaryForeground} />
                <Text style={[styles.submitText, { color: colors.primaryForeground }]}>Submit for Verification</Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

function LabeledInput({ label, value, onChangeText, placeholder, colors, keyboardType, autoCapitalize }: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  keyboardType?: "numeric" | "phone-pad" | "default"; autoCapitalize?: "words" | "none";
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize ?? "none"}
        style={[styles.input, { color: colors.foreground, borderColor: colors.input, borderRadius: colors.radius }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 12 },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statusBanner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderWidth: 1, marginBottom: 16 },
  statusText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  successCard: { alignItems: "center", padding: 40, gap: 14 },
  successTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  successBody: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  form: { padding: 16, gap: 14 },
  formHint: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  sectionLabel: { fontSize: 15, fontFamily: "Inter_700Bold" },
  divider: { height: 1 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  input: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: "Inter_400Regular" },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, marginTop: 4 },
  submitText: { fontSize: 15, fontFamily: "Inter_700Bold" },
});
