import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Linking,
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
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useColors } from "@/hooks/useColors";
import { daysLeft } from "@/lib/subscription";

const APP_URL = "https://laundrylink.app";

interface MenuItem {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  route?: string;
  action?: () => void;
}

export default function BusinessProfile() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { subscription, isSubscribed } = useSubscription();
  const days = daysLeft(subscription);

  const handleContact = () => {
    Linking.openURL("mailto:hello@laundrylink.app?subject=LaundryLink Business Support");
  };

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
        title: "LaundryLink for Business",
        message: `I manage my laundry business with LaundryLink — flat SaaS, no commissions. Check it out: ${APP_URL}/business`,
        url: `${APP_URL}/business`,
      });
    } catch { /* cancelled */ }
  };

  const handleMenuPress = (item: MenuItem) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    if (item.action) { item.action(); return; }
    if (item.route) router.push(item.route as any);
  };

  const MENU_ITEMS: MenuItem[] = [
    { icon: "tag",          label: "Manage Services",    route: "/(business)/services" },
    { icon: "credit-card",  label: "Subscription & Plan", route: "/(business)/subscription" },
    { icon: "trending-up",  label: "Analytics & Reports", route: "/(business)/reports" },
    { icon: "help-circle",  label: "Help & Support",      action: handleContact },
    { icon: "file-text",    label: "Terms of Service",    route: "/(customer)/terms" },
    { icon: "shield",       label: "Privacy Policy",      route: "/(customer)/privacy" },
  ];

  const initials = (user?.user_metadata?.full_name as string | undefined)
    ?.split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "B";

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
          {user?.user_metadata?.full_name || "Business"}
        </Text>
        <Text style={[styles.email, { color: colors.mutedForeground }]}>{user?.email || ""}</Text>
        <View style={[styles.roleBadge, { backgroundColor: colors.accent + "18", borderRadius: colors.radius / 2 }]}>
          <Text style={[styles.roleText, { color: colors.accent }]}>Business Owner</Text>
        </View>
      </View>

      {/* Subscription status */}
      {isSubscribed && (
        <Pressable
          onPress={() => router.push("/(business)/subscription" as any)}
          style={[styles.subCard, {
            backgroundColor: "#10b98112", borderColor: "#10b98130",
            borderRadius: colors.radius, marginHorizontal: 20, marginTop: 12,
          }]}
        >
          <Feather name="check-circle" size={16} color="#10b981" />
          <View style={{ flex: 1 }}>
            <Text style={styles.subTitle}>
              {subscription.isTrial ? "Free Trial" : subscription.tier} · Active
            </Text>
            <Text style={styles.subSub}>{days} days remaining · tap to manage</Text>
          </View>
          <Feather name="chevron-right" size={14} color="#10b981" />
        </Pressable>
      )}

      {/* Share app banner */}
      <Pressable
        onPress={handleShare}
        style={[styles.shareBanner, { backgroundColor: colors.primary, borderRadius: colors.radius, marginHorizontal: 20, marginTop: 12 }]}
      >
        <View style={styles.shareIconWrap}>
          <Feather name="share-2" size={18} color={colors.primaryForeground} />
        </View>
        <View style={styles.shareText}>
          <Text style={[styles.shareTitle, { color: colors.primaryForeground }]}>Share with other businesses</Text>
          <Text style={[styles.shareSub, { color: colors.primaryForeground + "bb" }]}>
            Help fellow laundromats join LaundryLink
          </Text>
        </View>
        <Feather name="chevron-right" size={16} color={colors.primaryForeground + "80"} />
      </Pressable>

      {/* Menu */}
      <View style={[styles.menuSection, { marginTop: 12 }]}>
        {MENU_ITEMS.map((item, i) => (
          <Pressable
            key={item.label}
            onPress={() => handleMenuPress(item)}
            style={({ pressed }) => [
              styles.menuItem,
              {
                backgroundColor: pressed ? colors.muted : colors.card,
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
  profileCard: { alignItems: "center", paddingVertical: 28, paddingHorizontal: 20 },
  avatar: { width: 60, height: 60, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { fontSize: 24, fontFamily: "Inter_700Bold" },
  name: { fontSize: 18, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  email: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 10 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 4 },
  roleText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  subCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderWidth: 1 },
  subTitle: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#10b981" },
  subSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#10b981", marginTop: 1 },
  shareBanner: { flexDirection: "row", alignItems: "center", padding: 16, gap: 14 },
  shareIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  shareText: { flex: 1 },
  shareTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  shareSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  menuSection: {},
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 16, paddingHorizontal: 20, gap: 14 },
  menuIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 20, marginTop: 20, paddingVertical: 14 },
  signOutText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  version: { textAlign: "center", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 20, marginBottom: 8 },
});
