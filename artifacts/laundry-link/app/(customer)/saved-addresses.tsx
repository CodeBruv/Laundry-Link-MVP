import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Alert,
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

const STORAGE_KEY = "ll_saved_addresses_v1";

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  isDefault: boolean;
}

export default function SavedAddressesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setAddresses(JSON.parse(raw));
    });
  }, []);

  const save = async (list: SavedAddress[]) => {
    setAddresses(list);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const addAddress = async () => {
    if (!label.trim() || !address.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const item: SavedAddress = {
      id: Date.now().toString(),
      label: label.trim(),
      address: address.trim(),
      isDefault: addresses.length === 0,
    };
    await save([...addresses, item]);
    setLabel("");
    setAddress("");
    setShowForm(false);
  };

  const setDefault = async (id: string) => {
    const updated = addresses.map((a) => ({ ...a, isDefault: a.id === id }));
    await save(updated);
  };

  const remove = (id: string) => {
    if (Platform.OS === "web") {
      save(addresses.filter((a) => a.id !== id));
      return;
    }
    Alert.alert("Remove Address", "Delete this saved address?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => save(addresses.filter((a) => a.id !== id)) },
    ]);
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
        <Text style={[styles.title, { color: colors.foreground }]}>Saved Addresses</Text>
        <Pressable
          onPress={() => setShowForm(!showForm)}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={16} color={colors.primaryForeground} />
        </Pressable>
      </View>

      {/* Add form */}
      {showForm && (
        <View style={[styles.form, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <Text style={[styles.formTitle, { color: colors.foreground }]}>New Address</Text>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="Label (e.g. Home, Work)"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, borderColor: colors.input, borderRadius: colors.radius }]}
          />
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Full address"
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[styles.input, { color: colors.foreground, borderColor: colors.input, borderRadius: colors.radius, minHeight: 70 }]}
          />
          <View style={styles.formButtons}>
            <Pressable
              onPress={() => { setShowForm(false); setLabel(""); setAddress(""); }}
              style={[styles.cancelBtn, { borderColor: colors.border, borderRadius: colors.radius }]}
            >
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={addAddress}
              disabled={!label.trim() || !address.trim()}
              style={[styles.saveBtn, { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: (!label.trim() || !address.trim()) ? 0.5 : 1 }]}
            >
              <Text style={[styles.saveText, { color: colors.primaryForeground }]}>Save</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Address list */}
      {addresses.length === 0 && !showForm ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <Feather name="map-pin" size={36} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No saved addresses</Text>
          <Text style={[styles.emptyMsg, { color: colors.mutedForeground }]}>
            Tap + to save a home or work address for quicker order creation.
          </Text>
        </View>
      ) : (
        addresses.map((addr) => (
          <View key={addr.id} style={[styles.addressCard, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: addr.isDefault ? colors.primary : "transparent", borderWidth: addr.isDefault ? 1.5 : 0 }]}>
            <View style={styles.addrTop}>
              <View style={[styles.addrIcon, { backgroundColor: colors.primary + "14" }]}>
                <Feather name="map-pin" size={18} color={colors.primary} />
              </View>
              <View style={styles.addrInfo}>
                <View style={styles.addrLabelRow}>
                  <Text style={[styles.addrLabel, { color: colors.foreground }]}>{addr.label}</Text>
                  {addr.isDefault && (
                    <View style={[styles.defaultChip, { backgroundColor: colors.primary + "18" }]}>
                      <Text style={[styles.defaultText, { color: colors.primary }]}>Default</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.addrText, { color: colors.mutedForeground }]}>{addr.address}</Text>
              </View>
            </View>
            <View style={[styles.addrActions, { borderTopColor: colors.border }]}>
              {!addr.isDefault && (
                <Pressable onPress={() => setDefault(addr.id)} style={styles.addrAction}>
                  <Feather name="check-circle" size={15} color={colors.primary} />
                  <Text style={[styles.addrActionText, { color: colors.primary }]}>Set Default</Text>
                </Pressable>
              )}
              <Pressable onPress={() => remove(addr.id)} style={styles.addrAction}>
                <Feather name="trash-2" size={15} color={colors.destructive} />
                <Text style={[styles.addrActionText, { color: colors.destructive }]}>Remove</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backBtn: { padding: 4, marginRight: 12 },
  title: { flex: 1, fontSize: 22, fontFamily: "Inter_700Bold" },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  form: { padding: 16, marginBottom: 16, gap: 12 },
  formTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 4 },
  input: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  formButtons: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, borderWidth: 1, paddingVertical: 13, alignItems: "center" },
  cancelText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  saveBtn: { flex: 1, paddingVertical: 13, alignItems: "center" },
  saveText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  empty: { alignItems: "center", padding: 40, gap: 12, marginTop: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyMsg: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  addressCard: { marginBottom: 12, overflow: "hidden" },
  addrTop: { flexDirection: "row", alignItems: "flex-start", padding: 14, gap: 12 },
  addrIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  addrInfo: { flex: 1, gap: 4 },
  addrLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  addrLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  defaultChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  defaultText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  addrText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  addrActions: { flexDirection: "row", borderTopWidth: 1, paddingHorizontal: 14, paddingVertical: 10, gap: 20 },
  addrAction: { flexDirection: "row", alignItems: "center", gap: 6 },
  addrActionText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
