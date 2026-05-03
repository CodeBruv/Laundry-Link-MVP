import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import { useColors } from "@/hooks/useColors";

export default function AdminLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.card,
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowOffset: { width: 0, height: 1 },
          shadowRadius: 4,
          elevation: 2,
        },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontFamily: "Inter_700Bold", fontSize: 16, color: colors.foreground },
        tabBarLabelStyle: { fontFamily: "Inter_500Medium", fontSize: 10 },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 8,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={95} tint={isDark ? "dark" : "extraLight"} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarLabel: "Overview",
          tabBarIcon: ({ color }) => <Feather name="activity" size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: "User Management",
          tabBarLabel: "Users",
          tabBarIcon: ({ color }) => <Feather name="users" size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "All Orders",
          tabBarLabel: "Orders",
          tabBarIcon: ({ color }) => <Feather name="package" size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarLabel: "Analytics",
          tabBarIcon: ({ color }) => <Feather name="trending-up" size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Security & Settings",
          tabBarLabel: "Settings",
          tabBarIcon: ({ color }) => <Feather name="shield" size={21} color={color} />,
        }}
      />
      {/* Hidden from tab bar — accessible via router.push */}
      <Tabs.Screen name="businesses" options={{ href: null, title: "Businesses" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({});
