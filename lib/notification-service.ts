import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATION_PREFS_KEY = "@contentcraft_notification_prefs";
const DAILY_REMINDER_ID_KEY = "@contentcraft_daily_reminder_id";

export interface NotificationPrefs {
  enabled: boolean;
  hour: number;   // 0-23
  minute: number; // 0-59
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  enabled: false,
  hour: 9,
  minute: 0,
};

// Set the notification handler (call once at app startup)
export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// Request permissions (iOS requires explicit request)
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("contentcraft-reminders", {
      name: "Daily Content Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0D9488",
      description: "Daily reminders to check trending content ideas",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// Load saved notification preferences
export async function loadNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (raw) return JSON.parse(raw) as NotificationPrefs;
  } catch {}
  return DEFAULT_NOTIFICATION_PREFS;
}

// Save notification preferences
export async function saveNotificationPrefs(prefs: NotificationPrefs): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
}

// Schedule the daily reminder
export async function scheduleDailyReminder(
  prefs: NotificationPrefs,
  niche: string
): Promise<boolean> {
  if (Platform.OS === "web") return false;

  // Cancel any existing reminder first
  await cancelDailyReminder();

  if (!prefs.enabled) return true;

  const granted = await requestNotificationPermissions();
  if (!granted) return false;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to Create Content! ✨",
        body: `Your daily ${niche} content ideas are waiting. Check what's trending today!`,
        data: { screen: "trending" },
        sound: true,
      },
      trigger: {
        hour: prefs.hour,
        minute: prefs.minute,
        repeats: true,
        channelId: Platform.OS === "android" ? "contentcraft-reminders" : undefined,
      } as any,
    });
    await AsyncStorage.setItem(DAILY_REMINDER_ID_KEY, id);
    return true;
  } catch (e) {
    console.warn("Failed to schedule notification:", e);
    return false;
  }
}

// Cancel the daily reminder
export async function cancelDailyReminder(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const id = await AsyncStorage.getItem(DAILY_REMINDER_ID_KEY);
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(DAILY_REMINDER_ID_KEY);
    }
  } catch {}
}

// Format time for display (e.g., "9:00 AM")
export function formatNotificationTime(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute.toString().padStart(2, "0");
  return `${displayHour}:${displayMinute} ${period}`;
}
