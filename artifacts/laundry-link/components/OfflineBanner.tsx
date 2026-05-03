import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";

import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const translateY = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: isOnline ? -60 : 0,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [isOnline]);

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY }] }]}>
      <Feather name="wifi-off" size={14} color="#ffffff" />
      <Text style={styles.text}>You're offline — changes will sync when reconnected</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: "#ef4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  text: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#ffffff" },
});
