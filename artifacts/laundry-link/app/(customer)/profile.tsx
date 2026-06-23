import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

const APP_URL = "https://laundrylink.ng";

const MENU_ITEMS = [
  { icon: "map-pin" as const, label: "Saved Addresses", route: "/(customer)/saved-addresses" },
  { icon: "credit-card" as const, label: "Payment Methods", route: "/(customer)/payment-methods" },
  { icon: "bell" as const, label: "Notifications", route: "/(customer)/notifications-screen" },
  { icon: "help-circle" as const, label: "Help & Support", route: "/(customer)/help" },
  { icon: "file-text" as const, label: "Terms of Service", route: "/(customer)/terms" },
  { icon: "shield" as const, label: "Privacy Policy", route: "/(customer)/privacy" },
];

export default function CustomerProfile() {
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

  const handleShare = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        title: "LaundryLink — Fresh laundry, delivered",
        message: `I use LaundryLink to get my laundry picked up, cleaned, and delivered: ${APP_URL}`,
        url: APP_URL,
      });
    } catch { /* cancelled */ }
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
    .toUpperCase() || "U";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 100 : 80) }}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar card */}
      <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary, borderRadius: 30 }]}>
          <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>{initials}</Text>
        </View>
        <Text style={[styles.name, { color: colors.foreground }]}>
          {user?.user_metadata?.full_name || "Customer"}
        </Text>
        <Text style={[styles.email, { color: colors.mutedForeground }]}>{user?.email || ""}</Text>
        <View style={[styles.roleBadge, { backgroundColor: colors.primary + "14", borderRadius: colors.radius / 2 }]}>
          <Text style={[styles.roleText, { color: colors.primary }]}>Customer</Text>
        </View>
      </View>

      {/* Share app banner */}
      <Pressable
        onPress={handleShare}
        style={[styles.shareBanner, { backgroundColor: colors.primary, borderRadius: colors.radius, marginHorizontal: 20, marginTop: 12 }]}
      >
        <View style={styles.shareIconWrap}>
          <Feather name="share-2" size={18} color={colors.primaryForeground} />
        </View>
        <View style={styles.shareText}>
          <Text style={[styles.shareTitle, { color: colors.primaryForeground }]}>Share LaundryLink</Text>
          <Text style={[styles.shareSub, { color: colors.primaryForeground + "bb" }]}>
            Invite friends · fresh laundry delivered
          </Text>
        </View>
        <Feather name="chevron-right" size={16} color={colors.primaryForeground + "80"} />
      </Pressable>

      {/* Menu */}
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
            <View style={[styles.menuIconWrap, { backgroundColor: colors.primary + "12" }]}>
              <Feather name={item.icon} size={18} color={colors.primary} />
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
  roleBadge: { paddingHorizontal: 12, paddingVertical: 4 },
  roleText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  shareBanner: { flexDirection: "row", alignItems: "center", padding: 16, gap: 14 },
  shareIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  shareText: { flex: 1 },
  shareTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  shareSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  menuSection: {},
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 15, paddingHorizontal: 20, gap: 14 },
  menuIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 20, marginTop: 20, paddingVertical: 14 },
  signOutText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  version: { textAlign: "center", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 20, marginBottom: 8 },
});
