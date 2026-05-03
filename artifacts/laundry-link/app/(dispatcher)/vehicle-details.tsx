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

const STORAGE_KEY = "ll_vehicle_v1";
const VEHICLE_TYPES = ["Motorcycle", "Bicycle", "Car", "Van", "Keke (Tricycle)"];

interface VehicleInfo {
  type: string;
  plateNumber: string;
  color: string;
  model: string;
}

export default function VehicleDetailsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [info, setInfo] = useState<VehicleInfo>({ type: "Motorcycle", plateNumber: "", color: "", model: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setInfo(JSON.parse(raw));
    });
  }, []);

  const handleSave = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(info));
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

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
        <Text style={[styles.title, { color: colors.foreground }]}>Vehicle Details</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Vehicle Type</Text>
        <View style={styles.typeGrid}>
          {VEHICLE_TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setInfo((prev) => ({ ...prev, type: t }))}
              style={[
                styles.typeChip,
                {
                  backgroundColor: info.type === t ? colors.primary : colors.muted,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Text style={[styles.typeText, { color: info.type === t ? colors.primaryForeground : colors.foreground }]}>
                {t}
              </Text>
            </Pressable>
          ))}
        </View>

        <LabeledInput
          label="Plate Number"
          value={info.plateNumber}
          onChangeText={(v) => setInfo((p) => ({ ...p, plateNumber: v }))}
          placeholder="e.g. ABC-123-XY"
          colors={colors}
          autoCapitalize="characters"
        />
        <LabeledInput
          label="Vehicle Color"
          value={info.color}
          onChangeText={(v) => setInfo((p) => ({ ...p, color: v }))}
          placeholder="e.g. Red"
          colors={colors}
        />
        <LabeledInput
          label="Make & Model"
          value={info.model}
          onChangeText={(v) => setInfo((p) => ({ ...p, model: v }))}
          placeholder="e.g. Honda CB150"
          colors={colors}
        />
      </View>

      {saved && (
        <View style={[styles.savedBanner, { backgroundColor: "#05966912", borderRadius: colors.radius }]}>
          <Feather name="check-circle" size={16} color="#059669" />
          <Text style={[styles.savedText, { color: "#059669" }]}>Vehicle details saved!</Text>
        </View>
      )}

      <Pressable
        onPress={handleSave}
        disabled={saving}
        style={[styles.saveBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
      >
        {saving ? (
          <ActivityIndicator color={colors.primaryForeground} />
        ) : (
          <>
            <Feather name="save" size={16} color={colors.primaryForeground} />
            <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Save Details</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

function LabeledInput({ label, value, onChangeText, placeholder, colors, autoCapitalize }: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  autoCapitalize?: "characters" | "words" | "none";
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        autoCapitalize={autoCapitalize ?? "words"}
        style={[styles.input, { color: colors.foreground, borderColor: colors.input, borderRadius: colors.radius }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 12 },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  card: { padding: 16, gap: 16, marginBottom: 16 },
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8 },
  typeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  inputGroup: { gap: 6 },
  input: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: "Inter_400Regular" },
  savedBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, marginBottom: 12 },
  savedText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, marginTop: 4 },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
});
