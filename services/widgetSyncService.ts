import { Platform } from 'react-native';
import { WidgetBridge } from '@/modules/widget-bridge';
import { NotificationVerseItem } from './notificationsData';

export const APP_GROUP_ID = 'group.com.lunaris.quranflow';

let SharedGroupPreferences: any = null;
try {
  SharedGroupPreferences = require('react-native-shared-group-preferences');
} catch (e) {
  // Graceful fallback if not linked
}

export interface WidgetPayload {
  dailyTitle: string;
  dailyArabic: string;
  dailyTranslation: string;
  dailySurahName: string;
  dailySurahNumber: number;
  dailyAyahNumber: number;
  dailyAudioUrl: string;
  dailyCategory: string;
  lastUpdated: number;
}

/**
 * Sync daily verse to iOS WidgetKit shared App Group storage
 */
export async function syncDailyVerseToWidget(verse: NotificationVerseItem): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;

  const payload: WidgetPayload = {
    dailyTitle: verse.title,
    dailyArabic: verse.arabic,
    dailyTranslation: verse.body,
    dailySurahName: verse.surahName,
    dailySurahNumber: verse.surahNumber,
    dailyAyahNumber: verse.ayahNumber,
    dailyAudioUrl: verse.audioUrl,
    dailyCategory: verse.category,
    lastUpdated: Date.now(),
  };

  let success = false;

  // 1. Write via WidgetBridge native module
  try {
    const bridgeResult = WidgetBridge.setWidgetData({
      dailyTitle: payload.dailyTitle,
      dailyArabic: payload.dailyArabic,
      dailyTranslation: payload.dailyTranslation,
      dailySurahName: payload.dailySurahName,
      dailySurahNumber: payload.dailySurahNumber,
      dailyAyahNumber: payload.dailyAyahNumber,
      dailyAudioUrl: payload.dailyAudioUrl,
      dailyCategory: payload.dailyCategory,
    });
    if (bridgeResult) success = true;
  } catch (err) {
    console.warn('WidgetBridge sync error:', err);
  }

  // 2. Write via react-native-shared-group-preferences for backup / JSON shared storage
  if (SharedGroupPreferences && SharedGroupPreferences.setItem) {
    try {
      await SharedGroupPreferences.setItem(
        'quran_daily_verse',
        payload,
        APP_GROUP_ID
      );
      success = true;
    } catch (err) {
      // In development or without signed provisioning profile, shared storage might warn
      console.warn('SharedGroupPreferences setItem warning:', err);
    }
  }

  // 3. Reload widgets timeline
  try {
    WidgetBridge.reloadAllWidgets();
  } catch (err) {
    console.warn('Widget reload error:', err);
  }

  return success;
}
