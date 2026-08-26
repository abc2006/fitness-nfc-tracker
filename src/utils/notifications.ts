import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getSetting, getUserProfile, saveSetting } from '../db/database';
import { caloriesForDuration } from './stats';

const ANDROID_CHANNEL_ID = 'default';
const PENDING_NOTIFICATION_KEY = 'pendingAutoCompleteNotificationId';
const STALE_THRESHOLD_MS = 30 * 60 * 1000;
const GRACE_PERIOD_MS = 2 * 60 * 1000;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let androidChannelReady = false;

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android' || androidChannelReady) return;

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Trainingsbegleiter',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    enableVibrate: true,
    vibrationPattern: [0, 250, 250, 250],
    // Route through the alarm stream so the reminder is audible even with the
    // ringer on silent/vibrate — the same reason an alarm clock still rings then.
    audioAttributes: { usage: Notifications.AndroidAudioUsage.ALARM },
  });
  androidChannelReady = true;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  await ensureAndroidChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function cancelAutoCompleteReminder(): Promise<void> {
  const id = await getSetting(PENDING_NOTIFICATION_KEY);
  if (id) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // Already fired or cancelled.
    }
    await saveSetting(PENDING_NOTIFICATION_KEY, '');
  }
}

export async function scheduleAutoCompleteReminder(startedAt: number, lastActivityAt: number): Promise<void> {
  await cancelAutoCompleteReminder();

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  const fireDate = new Date(lastActivityAt + STALE_THRESHOLD_MS);
  if (fireDate.getTime() <= Date.now()) return;

  const completedAtMs = lastActivityAt + GRACE_PERIOD_MS;
  const durationSeconds = Math.max(0, Math.round((completedAtMs - startedAt) / 1000));
  const profile = await getUserProfile();
  const calories = caloriesForDuration(durationSeconds, profile);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Training automatisch abgeschlossen',
      body: `${calories} Kalorien verbraucht`,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireDate,
      channelId: ANDROID_CHANNEL_ID,
    },
  });

  await saveSetting(PENDING_NOTIFICATION_KEY, id);
}

export async function scheduleRestEndNotification(durationSeconds: number): Promise<string | null> {
  if (durationSeconds <= 0) return null;

  const granted = await ensureNotificationPermission();
  if (!granted) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Pause vorbei',
      body: 'Weiter geht’s mit dem nächsten Satz!',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, Math.round(durationSeconds)),
      channelId: ANDROID_CHANNEL_ID,
    },
  });
}

export async function cancelRestEndNotification(id: string | null): Promise<void> {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // Already fired or cancelled.
  }
}
