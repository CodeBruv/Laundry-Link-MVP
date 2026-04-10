import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
  { icon: "map-pin" as const, label: "Saved Addresses" },
  { icon: "credit-card" as const, label: "Payment Methods" },
  { icon: "bell" as const, label: "Notifications" },
  { icon: "help-circle" as const, label: "Help & Support" },
  { icon: "file-text" as const, label: "Terms of Service" },
  { icon: "shield" as const, label: "Privacy Policy" },
];

export default function CustomerProfile() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    if (Platform.OS === "web") {
      signOut();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80),
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: colors.primary, borderRadius: 30 },
          ]}
        >
          <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
            {user?.user_metadata?.full_name?.[0]?.toUpperCase() || "U"}
          </Text>
        </View>
        <Text style={[styles.name, { color: colors.foreground }]}>
          {user?.user_metadata?.full_name || "User"}
        </Text>
        <Text style={[styles.email, { color: colors.mutedForeground }]}>
          {user?.email || ""}
        </Text>
        <View
          style={[
            styles.roleBadge,
            {
              backgroundColor: colors.primary + "14",
              borderRadius: colors.radius / 2,
            },
          ]}
        >
          <Text style={[styles.roleText, { color: colors.primary }]}>
            Customer
          </Text>
        </View>
      </View>

      <View style={styles.menuSection}>
        {MENU_ITEMS.map((item, i) => (
          <Pressable
            key={item.label}
            style={[
              styles.menuItem,
              {
                backgroundColor: colors.card,
                borderBottomWidth: i < MENU_ITEMS.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <Feather name={item.icon} size={20} color={colors.primary} />
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>
              {item.label}
            </Text>
            <Feather
              name="chevron-right"
              size={18}
              color={colors.mutedForeground}
            />
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={handleSignOut}
        style={[
          styles.signOutBtn,
          {
            backgroundColor: colors.destructive + "12",
            borderRadius: colors.radius,
          },
        ]}
      >
        <Feather name="log-out" size={18} color={colors.destructive} />
        <Text style={[styles.signOutText, { color: colors.destructive }]}>
          Sign Out
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileCard: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  name: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 10,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  roleText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  menuSection: {
    marginTop: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 14,
  },
  signOutText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
