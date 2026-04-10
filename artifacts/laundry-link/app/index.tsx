import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuth } from "@/contexts/AuthContext";

export default function IndexRedirect() {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#092d52" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  switch (role) {
    case "BUSINESS":
      return <Redirect href="/(business)/" />;
    case "DISPATCHER":
      return <Redirect href="/(dispatcher)/" />;
    case "ADMIN":
      return <Redirect href="/(admin)/" />;
    default:
      return <Redirect href="/(customer)/" />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f9ff",
  },
});
