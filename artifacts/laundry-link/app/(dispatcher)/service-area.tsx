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
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const STORAGE_KEY = "ll_service_area_v1";

const ABUJA_ZONES = [
  "Wuse Zone 1", "Wuse Zone 2", "Wuse Zone 4", "Wuse Zone 5", "Wuse Zone 6",
  "Garki Area 1", "Garki Area 2", "Garki Area 8", "Garki Area 11",
  "Maitama", "Asokoro", "Guzape", "Jabi", "Utako",
  "Kubwa", "Lugbe", "Gwagwalada", "Nyanya", "Karu",
];

export default function ServiceAreaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setSelected(JSON.parse(raw));
    });
  }, []);

  const toggle = (zone: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setSelected((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone],
    );
  };

  const handleSave = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.primary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Service Area</Text>
      </View>

      <View style={[styles.infoBox, { backgroundColor: colors.primary + "0f", borderColor: colors.primary + "30", borderRadius: colors.radius }]}>
        <Feather name="map-pin" size={15} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
          Select the Abuja zones you cover. You will only be assigned orders within your service area.
        </Text>
      </View>

      <Text style={[styles.count, { color: colors.mutedForeground }]}>
        {selected.length} zone{selected.length !== 1 ? "s" : ""} selected
      </Text>

      <View style={styles.grid}>
        {ABUJA_ZONES.map((zone) => {
          const isSelected = selected.includes(zone);
          return (
            <Pressable
              key={zone}
              onPress={() => toggle(zone)}
              style={[
                styles.zoneChip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.card,
                  borderColor: isSelected ? colors.primary : colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              {isSelected && <Feather name="check" size={13} color={colors.primaryForeground} />}
              <Text style={[styles.zoneText, { color: isSelected ? colors.primaryForeground : colors.foreground }]}>
                {zone}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {saved && (
        <View style={[styles.savedBanner, { backgroundColor: "#05966912", borderRadius: colors.radius }]}>
          <Feather name="check-circle" size={16} color="#059669" />
          <Text style={[styles.savedText, { color: "#059669" }]}>Service area saved!</Text>
        </View>
      )}

      <Pressable
        onPress={handleSave}
        disabled={saving || selected.length === 0}
        style={[styles.saveBtn, { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: selected.length === 0 ? 0.5 : 1 }]}
      >
        {saving ? (
          <ActivityIndicator color={colors.primaryForeground} />
        ) : (
          <>
            <Feather name="save" size={16} color={colors.primaryForeground} />
            <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Save Service Area</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 12 },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderWidth: 1, marginBottom: 16 },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  count: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  zoneChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1 },
  zoneText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  savedBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, marginBottom: 12 },
  savedText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
});
