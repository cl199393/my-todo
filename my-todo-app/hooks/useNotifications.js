import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function useNotifications(deadlines) {
  useEffect(() => {
    requestPermission();
  }, []);

  useEffect(() => {
    if (deadlines && deadlines.length > 0) {
      scheduleAll(deadlines);
    }
  }, [deadlines]);
}

async function requestPermission() {
  if (!Device.isDevice) return;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function scheduleAll(deadlines) {
  // Cancel existing scheduled notifications before rescheduling
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = Date.now();

  for (const d of deadlines) {
    if (!d.due_at) continue;
    const dueMs = new Date(d.due_at).getTime();

    // 1-day before notification
    const minus1d = dueMs - 24 * 60 * 60 * 1000;
    if (minus1d > now + 60_000 && !d.notified_1d) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Due Tomorrow: ${d.title}`,
          body: d.course ? `${d.course} — due in ~24 hours` : 'Due in ~24 hours',
          data: { id: d.id },
        },
        trigger: { date: new Date(minus1d) },
        identifier: `1d-${d.id}`,
      }).catch(() => {});
    }

    // 1-hour before notification
    const minus1h = dueMs - 60 * 60 * 1000;
    if (minus1h > now + 60_000 && !d.notified_1h) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Due Soon: ${d.title}`,
          body: d.course ? `${d.course} — due in ~1 hour` : 'Due in ~1 hour',
          data: { id: d.id },
        },
        trigger: { date: new Date(minus1h) },
        identifier: `1h-${d.id}`,
      }).catch(() => {});
    }
  }
}
