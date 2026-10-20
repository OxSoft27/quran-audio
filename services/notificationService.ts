import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NOTIFICATION_VERSES, getRandomVerse, NotificationVerseItem } from './notificationsData';
import { syncDailyVerseToWidget } from './widgetSyncService';

export const NOTIFICATION_PREF_KEY = '@quran_daily_notifications_enabled';
export const NOTIFICATION_HOUR_KEY = '@quran_daily_notification_hour';
export const NOTIFICATION_MINUTE_KEY = '@quran_daily_notification_minute';
export const NOTIFICATION_LAST_SCHEDULED_KEY = '@quran_daily_last_scheduled_timestamp';

// Set global notification foreground presentation handler
// When user is active inside the app, scheduled notifications do NOT disrupt with banners/sound.
// Only explicit manual test notifications will present a banner.
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const isTest = notification.request.content.data?.isTest === true;
    return {
      shouldPlaySound: isTest,
      shouldSetBadge: false,
      shouldShowBanner: isTest,
      shouldShowList: true,
    };
  },
});

/**
 * Initialize notification channels (Android) and permissions
 */
export async function initNotifications(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('quran-daily', {
      name: 'Pengingat Ayat Harian',
      description: 'Notifikasi harian penyejuk hati dan motivasi dari Al-Qur\'an',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
      sound: 'default',
    });
  }
}

/**
 * Request notification permissions from user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    await initNotifications();

    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing.status;

    if (existing.status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = requested.status;
    }

    const isGranted = finalStatus === 'granted';
    await AsyncStorage.setItem(NOTIFICATION_PREF_KEY, isGranted ? 'true' : 'false');

    if (isGranted) {
      // Schedule initial 30 days at 20:00 (8:00 PM)
      await scheduleDailyVersesForNext30Days(20, 0);
    }

    return isGranted;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Check if notifications are currently permitted
 */
export async function isNotificationPermitted(): Promise<boolean> {
  try {
    const perm = await Notifications.getPermissionsAsync();
    return perm.status === 'granted';
  } catch {
    return false;
  }
}

let isSchedulingLock = false;

/**
 * Schedule automated daily notifications for the next 30 days
 * Prioritizes Friday reminders for Fridays and rotates through emotion categories.
 * Uses deterministic date identifiers to guarantee iOS never fires multiple notifications per day.
 */
export async function scheduleDailyVersesForNext30Days(
  preferredHour: number = 20,
  preferredMinute: number = 0
): Promise<number> {
  if (isSchedulingLock) {
    console.log('[notificationService] Scheduling already in progress, skipping duplicate call.');
    return 0;
  }
  isSchedulingLock = true;

  try {
    const isGranted = await isNotificationPermitted();
    if (!isGranted) return 0;

    await initNotifications();

    // 1. Explicitly cancel every existing scheduled notification by identifier
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(existing.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Small delay to let iOS UNUserNotificationCenter fully flush its persistent queue
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Store user time preference and last schedule timestamp
    await AsyncStorage.setItem(NOTIFICATION_HOUR_KEY, preferredHour.toString());
    await AsyncStorage.setItem(NOTIFICATION_MINUTE_KEY, preferredMinute.toString());
    await AsyncStorage.setItem(NOTIFICATION_LAST_SCHEDULED_KEY, Date.now().toString());

    let scheduledCount = 0;
    const now = new Date();

    // Keep track of used verse IDs in this 30-day window to avoid immediate repeat
    const usedVerseIds = new Set<string>();

    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const targetDate = new Date();
      targetDate.setDate(now.getDate() + dayOffset);
      targetDate.setHours(preferredHour, preferredMinute, 0, 0);

      // Must be strictly in the future (at least 2 minutes ahead from now)
      if (targetDate.getTime() <= Date.now() + 120000) {
        continue;
      }

      const isFriday = targetDate.getDay() === 5;

      // Select unique verse
      let verse: NotificationVerseItem = getRandomVerse(isFriday);
      let attempts = 0;
      while (usedVerseIds.has(verse.id) && attempts < 15) {
        verse = getRandomVerse(isFriday);
        attempts++;
      }
      usedVerseIds.add(verse.id);

      // Deep link URL payload
      const deepLinkUrl = `quranflow://play?surah=${verse.surahNumber}&ayah=${verse.ayahNumber}&audioUrl=${encodeURIComponent(verse.audioUrl)}&surahName=${encodeURIComponent(verse.surahName)}`;

      // Deterministic identifier per calendar day (e.g. quran-daily-2026-10-20)
      // Guarantees iOS UNNotificationCenter overwrites instead of creating multiple notifications per day!
      const dateId = `quran-daily-${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;

      await Notifications.scheduleNotificationAsync({
        identifier: dateId,
        content: {
          title: `✨ ${verse.title}`,
          body: `${verse.arabic}\n\n"${verse.body}"\n— QS. ${verse.surahName}: ${verse.ayahNumber}`,
          sound: true,
          data: {
            surahNumber: verse.surahNumber,
            ayahNumber: verse.ayahNumber,
            audioUrl: verse.audioUrl,
            surahName: verse.surahName,
            title: verse.title,
            category: verse.category,
            url: deepLinkUrl,
          },
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: targetDate,
          channelId: 'quran-daily',
        },
      });

      scheduledCount++;
    }

    console.log(`Successfully scheduled ${scheduledCount} daily Quran notifications for the next 30 days.`);
    return scheduledCount;
  } catch (error) {
    console.error('Error scheduling daily notifications:', error);
    return 0;
  } finally {
    isSchedulingLock = false;
  }
}

const CLEANUP_MIGRATION_KEY = '@quran_daily_notif_cleanup_v3';

/**
 * Refresh notifications schedule on app open.
 * Reschedules if remaining upcoming count is low (< 7 days) and syncs today's verse to WidgetKit.
 */
export async function refreshNotificationSchedule(): Promise<void> {
  try {
    const isGranted = await isNotificationPermitted();

    // 1. Sync today's verse to iOS WidgetKit shared storage
    const today = new Date();
    const isFriday = today.getDay() === 5;
    const todayVerse = getRandomVerse(isFriday);
    await syncDailyVerseToWidget(todayVerse);

    if (!isGranted) return;

    // 2. One-time migration: wipe any ghost/legacy notifications from older builds
    const hasCleaned = await AsyncStorage.getItem(CLEANUP_MIGRATION_KEY);
    if (!hasCleaned) {
      console.log('[notificationService] Running one-time migration: clearing all legacy scheduled notifications...');
      const existing = await Notifications.getAllScheduledNotificationsAsync();
      await Promise.all(existing.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.setItem(CLEANUP_MIGRATION_KEY, 'true');

      const savedHour = await AsyncStorage.getItem(NOTIFICATION_HOUR_KEY);
      const savedMinute = await AsyncStorage.getItem(NOTIFICATION_MINUTE_KEY);
      const hour = savedHour !== null ? parseInt(savedHour, 10) : 20;
      const minute = savedMinute !== null ? parseInt(savedMinute, 10) : 0;
      await scheduleDailyVersesForNext30Days(hour, minute);
      return;
    }

    // 3. Purge any non-deterministic ghost notifications that don't match our pattern
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const legacy = scheduled.filter((n) => !n.identifier.startsWith('quran-daily-'));
    if (legacy.length > 0) {
      console.log(`[notificationService] Removing ${legacy.length} legacy notifications...`);
      await Promise.all(legacy.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
    }

    // 4. Cooldown check: avoid rescheduling multiple times within 24 hours
    const lastScheduledStr = await AsyncStorage.getItem(NOTIFICATION_LAST_SCHEDULED_KEY);
    if (lastScheduledStr) {
      const lastScheduledTime = parseInt(lastScheduledStr, 10);
      const hoursSinceLast = (Date.now() - lastScheduledTime) / (1000 * 60 * 60);
      if (hoursSinceLast < 24) {
        return;
      }
    }

    // 5. If fewer than 7 notifications are left, regenerate the 30-day queue
    const validScheduled = scheduled.filter((n) => n.identifier.startsWith('quran-daily-'));
    if (validScheduled.length < 7) {
      const savedHour = await AsyncStorage.getItem(NOTIFICATION_HOUR_KEY);
      const savedMinute = await AsyncStorage.getItem(NOTIFICATION_MINUTE_KEY);

      const hour = savedHour !== null ? parseInt(savedHour, 10) : 20;
      const minute = savedMinute !== null ? parseInt(savedMinute, 10) : 0;

      await scheduleDailyVersesForNext30Days(hour, minute);
    }
  } catch (error) {
    console.warn('Error refreshing notification schedule:', error);
  }
}
