import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const NOTIF_KEY = "ll_notifications_v1";

interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: "ORDER" | "PAYMENT" | "STATUS" | "SYSTEM";
  read: boolean;
  createdAt: string;
}

const TYPE_ICON: Record<AppNotification["type"], keyof typeof Feather.glyphMap> = {
  ORDER: "package",
  PAYMENT: "credit-card",
  STATUS: "activity",
  SYSTEM: "bell",
};
const TYPE_COLOR: Record<AppNotification["type"], string> = {
  ORDER: "#1d4ed8",
  PAYMENT: "#059669",
  STATUS: "#d97706",
  SYSTEM: "#64748b",
};

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(NOTIF_KEY).then((raw) => {
      if (raw) {
        setNotifications(JSON.parse(raw));
      } else {
        // Seed with a welcome notification
        const welcome: AppNotification = {
          id: "welcome",
          title: "Welcome to LaundryLink!",
          body: "Your account is ready. Place your first order and experience fresh laundry delivered to your door.",
          type: "SYSTEM",
          read: false,
          createdAt: new Date().toISOString(),
        };
        setNotifications([welcome]);
        AsyncStorage.setItem(NOTIF_KEY, JSON.stringify([welcome]));
      }
    });
  }, []);

  const markAllRead = async () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
  };

  const markRead = async (id: string) => {
    const updated = notifications.map((n) => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.primary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Notifications</Text>
        {unreadCount > 0 && (
          <Pressable onPress={markAllRead}>
            <Text style={[styles.markAll, { color: colors.primary }]}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="bell-off" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No notifications</Text>
          <Text style={[styles.emptyMsg, { color: colors.mutedForeground }]}>
            Order updates and payment confirmations will appear here.
          </Text>
        </View>
      ) : (
        notifications.map((n) => (
          <Pressable
            key={n.id}
            onPress={() => markRead(n.id)}
            style={[
              styles.notifItem,
              {
                backgroundColor: n.read ? colors.card : colors.primary + "08",
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View style={[styles.notifIcon, { backgroundColor: TYPE_COLOR[n.type] + "16" }]}>
              <Feather name={TYPE_ICON[n.type]} size={18} color={TYPE_COLOR[n.type]} />
            </View>
            <View style={styles.notifBody}>
              <View style={styles.notifTitleRow}>
                <Text style={[styles.notifTitle, { color: colors.foreground }]}>{n.title}</Text>
                {!n.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
              </View>
              <Text style={[styles.notifText, { color: colors.mutedForeground }]}>{n.body}</Text>
              <Text style={[styles.notifTime, { color: colors.mutedForeground }]}>
                {new Date(n.createdAt).toLocaleDateString()} · {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, gap: 12 },
  backBtn: { padding: 4 },
  title: { flex: 1, fontSize: 22, fontFamily: "Inter_700Bold" },
  markAll: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", padding: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyMsg: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  notifItem: { flexDirection: "row", alignItems: "flex-start", padding: 16, gap: 12, borderBottomWidth: 1 },
  notifIcon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  notifBody: { flex: 1, gap: 4 },
  notifTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  notifTitle: { flex: 1, fontSize: 14, fontFamily: "Inter_700Bold" },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  notifText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  notifTime: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
});
