import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  unit: string;
  active: boolean;
}

function storageKey(userId: string) {
  return `ll_services_${userId}`;
}

export default function BusinessServices() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newUnit, setNewUnit] = useState("item");
  const [saving, setSaving] = useState(false);

  const key = user?.id ? storageKey(user.id) : null;

  const load = useCallback(async () => {
    if (!key) { setIsLoading(false); return; }
    try {
      const raw = await AsyncStorage.getItem(key);
      setServices(raw ? JSON.parse(raw) : []);
    } catch {
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  }, [key]);

  useEffect(() => { load(); }, [load]);

  const persist = async (updated: ServiceItem[]) => {
    if (!key) return;
    setServices(updated);
    await AsyncStorage.setItem(key, JSON.stringify(updated));
  };

  const toggleActive = (id: string) => {
    persist(services.map((s) => s.id === id ? { ...s, active: !s.active } : s));
  };

  const deleteService = (id: string) => {
    if (Platform.OS === "web") {
      persist(services.filter((s) => s.id !== id));
      return;
    }
    Alert.alert("Remove service", "Remove this service from your menu?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => persist(services.filter((s) => s.id !== id)) },
    ]);
  };

  const addService = async () => {
    const name = newName.trim();
    const price = parseInt(newPrice.replace(/[^0-9]/g, ""), 10);
    const unit = newUnit.trim() || "item";
    if (!name || isNaN(price) || price < 1) return;
    setSaving(true);
    const item: ServiceItem = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      name,
      price,
      unit,
      active: true,
    };
    await persist([...services, item]);
    setNewName(""); setNewPrice(""); setNewUnit("item");
    setSaving(false);
    setShowAddSheet(false);
  };

  const resetAddForm = () => {
    setNewName(""); setNewPrice(""); setNewUnit("item");
    setShowAddSheet(false);
  };

  const shadow = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  };

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 100 : 80),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>Your Services</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Customers see your menu and Naira prices when placing orders.
            </Text>
          </View>
          <Pressable
            onPress={() => setShowAddSheet(true)}
            style={[styles.addBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
          >
            <Feather name="plus" size={16} color={colors.primaryForeground} />
            <Text style={[styles.addBtnText, { color: colors.primaryForeground }]}>Add</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : services.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderRadius: colors.radius }, shadow]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "10" }]}>
              <Feather name="tag" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No services yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Add your laundry services — set the name, Naira price, and unit (e.g. per shirt, per kg).
            </Text>
            <Pressable
              onPress={() => setShowAddSheet(true)}
              style={[styles.emptyBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
            >
              <Feather name="plus" size={15} color={colors.primaryForeground} />
              <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>Add First Service</Text>
            </Pressable>
          </View>
        ) : (
          services.map((service) => (
            <View
              key={service.id}
              style={[
                styles.serviceCard,
                { backgroundColor: colors.card, borderRadius: colors.radius, opacity: service.active ? 1 : 0.55 },
                shadow,
              ]}
            >
              <View style={[styles.serviceIconWrap, { backgroundColor: colors.accent + "12" }]}>
                <Feather name="droplet" size={18} color={colors.accent} />
              </View>
              <View style={styles.serviceInfo}>
                <Text style={[styles.serviceName, { color: colors.foreground }]}>{service.name}</Text>
                <Text style={[styles.servicePrice, { color: colors.accent }]}>
                  ₦{service.price.toLocaleString()} / {service.unit}
                </Text>
              </View>
              <View style={styles.serviceActions}>
                <Switch
                  value={service.active}
                  onValueChange={() => toggleActive(service.id)}
                  trackColor={{ false: colors.muted, true: colors.accent + "60" }}
                  thumbColor={service.active ? colors.accent : colors.mutedForeground}
                />
                <Pressable onPress={() => deleteService(service.id)} hitSlop={8} style={styles.deleteBtn}>
                  <Feather name="trash-2" size={15} color={colors.mutedForeground} />
                </Pressable>
              </View>
            </View>
          ))
        )}

        {services.length > 0 && (
          <View style={[styles.infoCard, { backgroundColor: colors.primary + "08", borderRadius: colors.radius }]}>
            <Feather name="info" size={14} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.primary }]}>
              Active services are visible to customers when placing orders. Toggle off to hide temporarily.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add Service Sheet */}
      <Modal
        visible={showAddSheet}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={resetAddForm}
      >
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Add Service</Text>
            <Pressable onPress={resetAddForm} hitSlop={12}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.sheetBody}
            contentContainerStyle={{ padding: 20, gap: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Service name</Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="e.g. Shirt Wash & Iron"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="words"
                style={[styles.input, { color: colors.foreground, borderColor: colors.input, borderRadius: colors.radius }]}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.foreground }]}>Price (₦)</Text>
                <View style={[styles.priceWrap, { borderColor: colors.input, borderRadius: colors.radius }]}>
                  <Text style={[styles.currencyPrefix, { color: colors.mutedForeground }]}>₦</Text>
                  <TextInput
                    value={newPrice}
                    onChangeText={setNewPrice}
                    placeholder="500"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="numeric"
                    style={[styles.priceInput, { color: colors.foreground }]}
                  />
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.foreground }]}>Per (unit)</Text>
                <TextInput
                  value={newUnit}
                  onChangeText={setNewUnit}
                  placeholder="shirt"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  style={[styles.input, { color: colors.foreground, borderColor: colors.input, borderRadius: colors.radius }]}
                />
              </View>
            </View>

            {newName.trim() && newPrice.trim() && (
              <View style={[styles.previewRow, { backgroundColor: colors.primary + "0a", borderRadius: colors.radius }]}>
                <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>Preview</Text>
                <Text style={[styles.previewValue, { color: colors.foreground }]}>{newName.trim()}</Text>
                <Text style={[styles.previewPrice, { color: colors.accent }]}>
                  ₦{parseInt(newPrice.replace(/[^0-9]/g, "") || "0", 10).toLocaleString()} / {newUnit.trim() || "item"}
                </Text>
              </View>
            )}

            <Pressable
              onPress={addService}
              disabled={saving || !newName.trim() || !newPrice.trim()}
              style={[
                styles.saveBtn,
                {
                  backgroundColor: colors.primary,
                  borderRadius: colors.radius,
                  opacity: (saving || !newName.trim() || !newPrice.trim()) ? 0.55 : 1,
                },
              ]}
            >
              {saving ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <>
                  <Feather name="check" size={16} color={colors.primaryForeground} />
                  <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Add Service</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "flex-start", marginBottom: 20, gap: 12 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 9 },
  addBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  emptyCard: { padding: 32, alignItems: "center", gap: 12 },
  emptyIcon: { width: 64, height: 64, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 13, marginTop: 4 },
  emptyBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  serviceCard: { flexDirection: "row", alignItems: "center", padding: 14, marginBottom: 10, gap: 12 },
  serviceIconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  serviceInfo: { flex: 1, gap: 3 },
  serviceName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  servicePrice: { fontSize: 13, fontFamily: "Inter_500Medium" },
  serviceActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  deleteBtn: { padding: 4 },
  infoCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, marginTop: 4 },
  infoText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  sheet: { flex: 1 },
  sheetHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 20, borderBottomWidth: 1,
  },
  sheetTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  sheetBody: { flex: 1 },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontFamily: "Inter_500Medium" },
  input: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  row: { flexDirection: "row", gap: 12 },
  priceWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12, gap: 4 },
  currencyPrefix: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  priceInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  previewRow: { padding: 14, gap: 4 },
  previewLabel: { fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 2 },
  previewValue: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  previewPrice: { fontSize: 14, fontFamily: "Inter_500Medium" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
});
