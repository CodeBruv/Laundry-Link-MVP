import React from "react";
import { StyleSheet, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { useColors } from "@/hooks/useColors";

export default function DispatcherDeliveries() {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <EmptyState
        icon="truck"
        title="No Deliveries"
        message="Active and pending delivery assignments will appear here."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
