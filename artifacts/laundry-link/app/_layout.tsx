import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { StyleSheet, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { DemoModeBanner } from "@/components/DemoModeBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrdersProvider } from "@/contexts/OrdersContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { useNotifications } from "@/hooks/useNotifications";
import colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AppServices() {
  useNotifications();
  return null;
}

function RootLayoutNav() {
  const scheme = useColorScheme();
  const bg = scheme === "dark" ? colors.dark.background : colors.light.background;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Enable native swipe-back gesture on iOS & gesture nav on Android
        gestureEnabled: true,
        gestureDirection: "horizontal",
        animation: "slide_from_right",
        contentStyle: { backgroundColor: bg },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(customer)" />
      <Stack.Screen name="(business)" />
      <Stack.Screen name="(dispatcher)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen
        name="order/[id]"
        options={{
          headerShown: false,
          gestureEnabled: true,
          animation: "slide_from_right",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={styles.shell}>
            <AuthProvider>
              <SubscriptionProvider>
                <OrdersProvider>
                  <AppServices />
                  <DemoModeBanner />
                  <OfflineBanner />
                  <RootLayoutNav />
                </OrdersProvider>
              </SubscriptionProvider>
            </AuthProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
});
