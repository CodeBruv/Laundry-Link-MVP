import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth, ConnectionStatus } from "@/contexts/AuthContext";

type BannerConfig = {
  bg: string;
  icon: keyof typeof Feather.glyphMap;
  text: string;
};

function getConfig(status: ConnectionStatus): BannerConfig | null {
  switch (status) {
    case "unconfigured":
      return {
        bg: "#f59e0b",
        icon: "info",
        text: "Demo mode — Supabase keys not set. Data is stored locally.",
      };
    case "unreachable":
      return {
        bg: "#ef4444",
        icon: "wifi-off",
        text: "Supabase unreachable — running in offline demo mode. Check project URL or resume your Supabase project.",
      };
    case "checking":
      return {
        bg: "#6366f1",
        icon: "loader",
        text: "Checking Supabase connection…",
      };
    case "connected":
    default:
      return null;
  }
}

export function DemoModeBanner() {
  const insets = useSafeAreaInsets();
  const { connectionStatus } = useAuth();
  const config = getConfig(connectionStatus);

  if (!config) return null;

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: config.bg,
          paddingTop: insets.top + (Platform.OS === "web" ? 8 : 4),
        },
      ]}
    >
      <Feather name={config.icon} size={13} color="#ffffff" />
      <Text style={styles.text}>{config.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  text: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#ffffff",
    textAlign: "center",
  },
});
