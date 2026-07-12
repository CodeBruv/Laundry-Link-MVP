import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import { OrderStatus, UserRole } from "@/types";
import { getStatusLabel } from "@/constants/orderStatuses";

// Lazy import to avoid crashing Expo Go on Android SDK 53+
// Local notifications (schedule) still work in Expo Go; push tokens do not.
let _Notifications: typeof import("expo-notifications") | null = null;

async function getNotifications() {
  if (_Notifications) return _Notifications;
  try {
    _Notifications = await import("expo-notifications");
    _Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    _Notifications = null;
  }
  return _Notifications;
}

const TOKEN_KEY = "ll_push_token";
let _permissionRequested = false;

export async function registerForPushNotificationsAsync(
  userId?: string,
): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const N = await getNotifications();
  if (!N) return null;

  try {
    const { status: existingStatus } = await N.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await N.requestPermissionsAsync();
      finalStatus = status;
    }
    _permissionRequested = true;
    if (finalStatus !== "granted") return null;

    // getExpoPushTokenAsync fails in Expo Go (SDK 53+) — swallow gracefully
    const tokenData = await N.getExpoPushTokenAsync().catch(() => null);
    if (!tokenData) return null;

    const token = tokenData.data;
    const key = userId ? `${TOKEN_KEY}_${userId}` : TOKEN_KEY;
    await AsyncStorage.setItem(key, token);
    return token;
  } catch {
    return null;
  }
}

export async function getPushToken(userId?: string): Promise<string | null> {
  const key = userId ? `${TOKEN_KEY}_${userId}` : TOKEN_KEY;
  return AsyncStorage.getItem(key);
}

export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  if (Platform.OS === "web") {
    console.log(`[LaundryLink] ${title}: ${body}`);
    return;
  }

  const N = await getNotifications();
  if (!N) return;

  if (!_permissionRequested) {
    await registerForPushNotificationsAsync();
  }

  try {
    await N.scheduleNotificationAsync({
      content: { title, body, data: data ?? {}, sound: true },
      trigger: null,
    });
  } catch {
    // Swallow — may fail on simulator or when permissions are pending
  }
}

// ── Typed event helpers ──────────────────────────────────────────────────────

export function notifyNewOrder(orderNumber: string, businessName: string) {
  sendLocalNotification(
    "New Order Received",
    `Order #${orderNumber} is waiting for acceptance at ${businessName}.`,
    { type: "NEW_ORDER" },
  );
}

export function notifyStatusChange(
  orderNumber: string,
  status: OrderStatus,
  recipientRole: UserRole,
) {
  const label = getStatusLabel(status);

  sendLocalNotification(
    `Order #${orderNumber} — ${label}`,
    recipientRole === "CUSTOMER"
      ? `Your laundry order is now: ${label}`
      : `Order #${orderNumber} updated to ${label}`,
    { type: "STATUS_CHANGE", status },
  );
}

export function notifyDispatcherAssigned(
  orderNumber: string,
  dispatcherName: string,
) {
  sendLocalNotification(
    "Dispatcher Assigned",
    `${dispatcherName} has been assigned to order #${orderNumber}.`,
    { type: "DISPATCHER_ASSIGNED" },
  );
}

export function notifyPaymentReceived(
  orderNumber: string,
  amount: number,
  reference: string,
) {
  sendLocalNotification(
    "Payment Received",
    `Order #${orderNumber} — ₦${amount.toLocaleString()} received. Ref: ${reference}`,
    { type: "PAYMENT_RECEIVED" },
  );
}

export function notifyOrderReady(orderNumber: string) {
  sendLocalNotification(
    "Your Order is Ready!",
    `Order #${orderNumber} is clean and ready. Complete payment to trigger delivery.`,
    { type: "ORDER_READY" },
  );
}
