import React from "react";
import { StyleSheet, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { useColors } from "@/hooks/useColors";

export default function AdminBusinesses() {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <EmptyState
        icon="briefcase"
        title="No Businesses"
        message="Registered laundromats and their subscription status will appear here."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
