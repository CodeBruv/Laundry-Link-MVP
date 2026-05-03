import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { registerForPushNotificationsAsync } from "@/lib/notifications";
import { useAuth } from "@/contexts/AuthContext";

export function useNotifications() {
  const { user } = useAuth();
  const router = useRouter();
  const listenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (Platform.OS === "web" || !user) return;

    let mounted = true;

    async function setup() {
      await registerForPushNotificationsAsync(user?.id);

      try {
        const N = await import("expo-notifications");

        const sub = N.addNotificationResponseReceivedListener((response) => {
          if (!mounted) return;
          const data = response.notification.request.content.data as Record<string, unknown>;
          const orderId = data?.orderId as string | undefined;
          if (orderId) {
            router.push(`/order/${orderId}` as any);
          }
        });

        listenerRef.current = () => sub.remove();
      } catch {
        // Expo Go or permissions denied — swallow
      }
    }

    setup();

    return () => {
      mounted = false;
      listenerRef.current?.();
    };
  }, [user?.id]);
}
