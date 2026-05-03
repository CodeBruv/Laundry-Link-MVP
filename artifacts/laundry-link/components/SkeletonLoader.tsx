import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";

import { useColors } from "@/hooks/useColors";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({ width = "100%", height = 16, borderRadius, style }: SkeletonProps) {
  const colors = useColors();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: borderRadius ?? 8,
          backgroundColor: colors.muted,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function OrderCardSkeleton() {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderRadius: 14 }]}>
      <View style={styles.cardHeader}>
        <SkeletonBox width={90} height={14} />
        <SkeletonBox width={60} height={22} borderRadius={11} />
      </View>
      <SkeletonBox width="70%" height={13} style={{ marginTop: 8 }} />
      <View style={styles.cardRow}>
        <SkeletonBox width={120} height={13} />
        <SkeletonBox width={80} height={13} />
      </View>
      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        <SkeletonBox width={100} height={13} />
        <SkeletonBox width={70} height={13} />
      </View>
    </View>
  );
}

export function StatCardSkeleton() {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderRadius: 14 }]}>
      <SkeletonBox width={36} height={36} borderRadius={10} />
      <SkeletonBox width={50} height={26} style={{ marginTop: 8 }} />
      <SkeletonBox width={80} height={12} style={{ marginTop: 6 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 10, marginBottom: 10 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", paddingTop: 12, borderTopWidth: 1, marginTop: 4 },
  statCard: { width: "48%", flexGrow: 1, padding: 16 },
});
