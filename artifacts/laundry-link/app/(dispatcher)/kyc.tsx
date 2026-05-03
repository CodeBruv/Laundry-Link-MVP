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
  fullName: string;
  phone: string;
  vehicleType: string;
  vehiclePlate: string;
  guarantorName: string;
  guarantorPhone: string;
  guarantorRelationship: string;
  photoUploaded: boolean;
  status: "unsubmitted" | "pending" | "approved" | "rejected";
}

const VEHICLE_TYPES = ["Motorcycle", "Bicycle", "Car", "Van", "Keke (Tricycle)"];

const STATUS_CONFIG = {
  unsubmitted: { color: "#64748b", icon: "clock" as const, label: "Not submitted yet" },
  pending: { color: "#d97706", icon: "loader" as const, label: "Under review (24h)" },
  approved: { color: "#059669", icon: "check-circle" as const, label: "Approved — you can accept orders" },
  rejected: { color: "#dc2626", icon: "x-circle" as const, label: "Rejected — please resubmit" },
};

export default function KycScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [kyc, setKyc] = useState<KycData>({
    fullName: "", phone: "", vehicleType: "Motorcycle", vehiclePlate: "",
    guarantorName: "", guarantorPhone: "", guarantorRelationship: "", photoUploaded: false, status: "unsubmitted",
  });
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) { const saved = JSON.parse(raw); setKyc(saved); if (saved.status === "pending") setSubmitted(true); }
    });
  }, []);

  const isComplete =
    kyc.fullName.trim().length > 2 &&
    kyc.phone.length >= 10 &&
    kyc.vehiclePlate.trim().length >= 4 &&
    kyc.guarantorName.trim().length > 2 &&
    kyc.guarantorPhone.length >= 10 &&
    kyc.guarantorRelationship.trim().length > 1;

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
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.primary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>KYC Verification</Text>
      </View>

      {/* Status */}
      <View style={[styles.statusBanner, { backgroundColor: cfg.color + "14", borderColor: cfg.color + "30", borderRadius: colors.radius }]}>
        <Feather name={cfg.icon} size={16} color={cfg.color} />
        <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>

      {submitted && kyc.status === "pending" ? (
        <View style={[styles.successCard, { backgroundColor: "#05966912", borderRadius: colors.radius }]}>
          <Feather name="check-circle" size={36} color="#059669" />
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Application Submitted</Text>
          <Text style={[styles.successBody, { color: colors.mutedForeground }]}>
            We will review your details and respond within 24 hours. You will receive a notification once approved.
          </Text>
        </View>
      ) : (
        <>
          {/* Basic Info */}
          <SectionHeader title="Personal Information" />
          <View style={[styles.section, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            <Field label="Full Legal Name" value={kyc.fullName} onChangeText={(v) => setKyc((p) => ({ ...p, fullName: v }))}
              placeholder="As it appears on your ID" colors={colors} autoCapitalize="words" />
            <Divider color={colors.border} />
            <Field label="Phone Number" value={kyc.phone} onChangeText={(v) => setKyc((p) => ({ ...p, phone: v.replace(/\D/g, "").slice(0, 11) }))}
              placeholder="080XXXXXXXX" colors={colors} keyboardType="phone-pad" />
          </View>

          {/* Vehicle Info */}
          <SectionHeader title="Vehicle Information" />
          <View style={[styles.section, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Vehicle Type</Text>
            <View style={styles.typeGrid}>
              {VEHICLE_TYPES.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setKyc((p) => ({ ...p, vehicleType: t }))}
                  style={[styles.typeChip, { backgroundColor: kyc.vehicleType === t ? colors.primary : colors.muted, borderRadius: colors.radius }]}
                >
                  <Text style={[styles.typeText, { color: kyc.vehicleType === t ? colors.primaryForeground : colors.foreground }]}>
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Divider color={colors.border} />
            <Field label="Plate Number" value={kyc.vehiclePlate} onChangeText={(v) => setKyc((p) => ({ ...p, vehiclePlate: v }))}
              placeholder="e.g. ABC-123-XY" colors={colors} autoCapitalize="characters" />
          </View>

          {/* Guarantor */}
          <SectionHeader title="Guarantor Details" />
          <View style={[styles.section, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
              A guarantor is someone who vouches for your identity and character.
            </Text>
            <Field label="Guarantor Full Name" value={kyc.guarantorName} onChangeText={(v) => setKyc((p) => ({ ...p, guarantorName: v }))}
              placeholder="Full name" colors={colors} autoCapitalize="words" />
            <Divider color={colors.border} />
            <Field label="Guarantor Phone" value={kyc.guarantorPhone} onChangeText={(v) => setKyc((p) => ({ ...p, guarantorPhone: v.replace(/\D/g, "").slice(0, 11) }))}
              placeholder="080XXXXXXXX" colors={colors} keyboardType="phone-pad" />
            <Divider color={colors.border} />
            <Field label="Relationship" value={kyc.guarantorRelationship} onChangeText={(v) => setKyc((p) => ({ ...p, guarantorRelationship: v }))}
              placeholder="e.g. Employer, Family friend" colors={colors} autoCapitalize="words" />
          </View>

          {/* Photo placeholder */}
          <SectionHeader title="Profile Photo" />
          <Pressable
            onPress={() => setKyc((p) => ({ ...p, photoUploaded: !p.photoUploaded }))}
            style={[styles.photoCard, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: kyc.photoUploaded ? "#059669" : colors.border }]}
          >
            <View style={[styles.photoIcon, { backgroundColor: kyc.photoUploaded ? "#05966914" : colors.muted }]}>
              <Feather name={kyc.photoUploaded ? "check-circle" : "camera"} size={28} color={kyc.photoUploaded ? "#059669" : colors.mutedForeground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.photoTitle, { color: colors.foreground }]}>
                {kyc.photoUploaded ? "Photo uploaded" : "Upload a clear selfie"}
              </Text>
              <Text style={[styles.photoSub, { color: colors.mutedForeground }]}>
                {kyc.photoUploaded ? "Tap to remove" : "Photo storage integration coming soon — tap to mark uploaded"}
              </Text>
            </View>
          </Pressable>

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
        </>
      )}
    </ScrollView>
  );
}

function SectionHeader({ title }: { title: string }) {
  const colors = useColors();
  return <Text style={[styles.sectionHeader, { color: colors.foreground }]}>{title}</Text>;
}

function Field({ label, value, onChangeText, placeholder, colors, keyboardType, autoCapitalize }: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  keyboardType?: "phone-pad" | "default"; autoCapitalize?: "characters" | "words" | "none";
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize ?? "none"}
        style={[styles.fieldInput, { color: colors.foreground }]}
      />
    </View>
  );
}

function Divider({ color }: { color: string }) {
  return <View style={[styles.divider, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 12 },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statusBanner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderWidth: 1, marginBottom: 16 },
  statusText: { flex: 1, fontSize: 13, fontFamily: "Inter_700Bold" },
  successCard: { alignItems: "center", padding: 40, gap: 14 },
  successTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  successBody: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  sectionHeader: { fontSize: 14, fontFamily: "Inter_700Bold", marginTop: 16, marginBottom: 8 },
  section: { overflow: "hidden", marginBottom: 4 },
  sectionHint: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 16, padding: 16, paddingBottom: 8 },
  divider: { height: 1, marginHorizontal: 16 },
  fieldGroup: { padding: 14, gap: 4 },
  fieldLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  fieldInput: { fontSize: 15, fontFamily: "Inter_400Regular", paddingVertical: 4 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 14, paddingTop: 8 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8 },
  typeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  photoCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderWidth: 1, marginBottom: 16 },
  photoIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  photoTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  photoSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4, lineHeight: 16 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15 },
  submitText: { fontSize: 15, fontFamily: "Inter_700Bold" },
});
