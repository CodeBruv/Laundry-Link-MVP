import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

const MENU_ITEMS = [
  { icon: "truck" as const, label: "Vehicle Details", route: "/(dispatcher)/vehicle-details" },
  { icon: "map-pin" as const, label: "Service Area", route: "/(dispatcher)/service-area" },
  { icon: "file-text" as const, label: "KYC Documents", route: "/(dispatcher)/kyc" },
  { icon: "bell" as const, label: "Notifications", route: "/(customer)/notifications-screen" },
  { icon: "help-circle" as const, label: "Help & Support", route: "/(customer)/help" },
];

export default function DispatcherProfile() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    if (Platform.OS === "web") { signOut(); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  const handleMenuPress = (route: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    router.push(route as any);
  };

  const initials = (user?.user_metadata?.full_name as string | undefined)
    ?.split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "D";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80) }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
        <View style={[styles.avatar, { backgroundColor: colors.accent, borderRadius: 32 }]}>
          <Text style={[styles.avatarText, { color: "#ffffff" }]}>{initials}</Text>
        </View>
        <Text style={[styles.name, { color: colors.foreground }]}>
          {user?.user_metadata?.full_name || "Dispatcher"}
        </Text>
        <Text style={[styles.email, { color: colors.mutedForeground }]}>{user?.email || ""}</Text>
        <View style={[styles.roleBadge, { backgroundColor: colors.accent + "18", borderRadius: colors.radius / 2 }]}>
          <Feather name="truck" size={11} color={colors.accent} />
          <Text style={[styles.roleText, { color: colors.accent }]}>Dispatcher</Text>
        </View>
      </View>

      {/* Earnings hint */}
      <View style={[styles.earningsCard, { backgroundColor: colors.card, marginHorizontal: 20, marginTop: 12, borderRadius: colors.radius }]}>
        <View style={styles.earningsRow}>
          <View style={[styles.earningsStat, { borderRightWidth: 1, borderRightColor: colors.border }]}>
            <Text style={[styles.earningsValue, { color: colors.foreground }]}>₦0</Text>
            <Text style={[styles.earningsLabel, { color: colors.mutedForeground }]}>Today</Text>
          </View>
          <View style={styles.earningsStat}>
            <Text style={[styles.earningsValue, { color: colors.foreground }]}>₦0</Text>
            <Text style={[styles.earningsLabel, { color: colors.mutedForeground }]}>This Month</Text>
          </View>
        </View>
        <Text style={[styles.earningsNote, { color: colors.mutedForeground }]}>
          Earnings are paid directly by customers and laundromats — no deductions.
        </Text>
      </View>

      <View style={[styles.menuSection, { marginTop: 12 }]}>
        {MENU_ITEMS.map((item, i) => (
          <Pressable
            key={item.label}
            onPress={() => handleMenuPress(item.route)}
            style={[
              styles.menuItem,
              {
                backgroundColor: colors.card,
                borderBottomWidth: i < MENU_ITEMS.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: colors.accent + "14" }]}>
              <Feather name={item.icon} size={18} color={colors.accent} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={handleSignOut}
        style={[styles.signOutBtn, { backgroundColor: colors.destructive + "12", borderRadius: colors.radius }]}
      >
        <Feather name="log-out" size={18} color={colors.destructive} />
        <Text style={[styles.signOutText, { color: colors.destructive }]}>Sign Out</Text>
      </Pressable>

      <Text style={[styles.version, { color: colors.mutedForeground }]}>LaundryLink v1.0 · Nigeria 🇳🇬</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileCard: { alignItems: "center", paddingVertical: 32, paddingHorizontal: 20 },
  avatar: { width: 64, height: 64, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { fontSize: 24, fontFamily: "Inter_700Bold" },
  name: { fontSize: 18, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  email: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 10 },
  roleBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 5 },
  roleText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  earningsCard: { padding: 16, gap: 12 },
  earningsRow: { flexDirection: "row" },
  earningsStat: { flex: 1, alignItems: "center", gap: 4 },
  earningsValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  earningsLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  earningsNote: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 16 },
  menuSection: {},
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 15, paddingHorizontal: 20, gap: 14 },
  menuIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 20, marginTop: 20, paddingVertical: 14 },
  signOutText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  version: { textAlign: "center", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 20, marginBottom: 8 },
});
