import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

export function DemoModeBanner() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isDemo } = useAuth();

  if (!isDemo) return null;

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: colors.primary,
          paddingTop: insets.top + (Platform.OS === "web" ? 8 : 4),
        },
      ]}
    >
      <Feather name="info" size={14} color={colors.primaryForeground} />
      <Text style={[styles.text, { color: colors.primaryForeground }]}>
        Demo Mode: add Supabase keys to enable real authentication
      </Text>
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
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
});