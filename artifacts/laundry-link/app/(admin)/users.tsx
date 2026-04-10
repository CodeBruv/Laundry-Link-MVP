import React from "react";
import { StyleSheet, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { useColors } from "@/hooks/useColors";

export default function AdminUsers() {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <EmptyState
        icon="users"
        title="No Users Yet"
        message="Platform users (customers, businesses, dispatchers) will be listed here."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
