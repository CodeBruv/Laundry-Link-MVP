import React from "react";
import { StyleSheet, View } from "react-native";

import { SubscriptionPaywall } from "@/components/SubscriptionPaywall";
import { useColors } from "@/hooks/useColors";

export default function BusinessSubscription() {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SubscriptionPaywall />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
