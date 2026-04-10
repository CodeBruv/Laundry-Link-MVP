import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const SETTINGS_ITEMS = [
  { icon: "sliders" as const, label: "Service Templates", desc: "Manage default service templates" },
  { icon: "bell" as const, label: "Push Notifications", desc: "Configure notification settings" },
  { icon: "shield" as const, label: "Security", desc: "Rate limiting & audit logs" },
  { icon: "database" as const, label: "Data Management", desc: "Backups & data export" },
  { icon: "globe" as const, label: "Regions", desc: "Manage supported regions" },
  { icon: "mail" as const, label: "Email Templates", desc: "Customize email notifications" },
];

export default function AdminSettings() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80),
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        {SETTINGS_ITEMS.map((item, i) => (
          <Pressable
            key={item.label}
            style={[
              styles.settingItem,
              {
                backgroundColor: colors.card,
                borderBottomWidth: i < SETTINGS_ITEMS.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: colors.primary + "14",
                  borderRadius: colors.radius - 4,
                },
              ]}
            >
              <Feather name={item.icon} size={18} color={colors.primary} />
            </View>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>
                {item.label}
              </Text>
              <Text
                style={[styles.settingDesc, { color: colors.mutedForeground }]}
              >
                {item.desc}
              </Text>
            </View>
            <Feather
              name="chevron-right"
              size={18}
              color={colors.mutedForeground}
            />
          </Pressable>
        ))}
      </View>

      <View style={{ padding: 20 }}>
        <Text style={[styles.versionText, { color: colors.mutedForeground }]}>
          LaundryLink v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { marginTop: 8 },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 14,
  },
  iconWrap: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  settingText: { flex: 1 },
  settingLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  versionText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
