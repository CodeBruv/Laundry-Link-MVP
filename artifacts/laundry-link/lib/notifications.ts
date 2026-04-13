import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let hasRequestedPermission = false;

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "web") return null;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  hasRequestedPermission = true;
  if (finalStatus !== "granted") return null;
  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

export async function sendLocalNotification(title: string, body: string) {
  if (Platform.OS === "web") {
    console.log(`[LaundryLink notification] ${title}: ${body}`);
    return;
  }
  if (!hasRequestedPermission) {
    await registerForPushNotificationsAsync();
  }
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}
