import { requireNativeModule } from 'expo';
import { Platform } from 'react-native';

export interface QuranWidgetData {
  surahName?: string;
  surahNumber?: number;
  qariName?: string;
  isPlaying?: boolean;
  ayahArabic?: string;
  ayahTranslation?: string;
  nextPrayerName?: string;
  nextPrayerTime?: string;
  dailyTitle?: string;
  dailyArabic?: string;
  dailyTranslation?: string;
  dailySurahName?: string;
  dailySurahNumber?: number;
  dailyAyahNumber?: number;
  dailyAudioUrl?: string;
  dailyCategory?: string;
}

let nativeModule: any = null;
try {
  if (Platform.OS === 'ios') {
    nativeModule = requireNativeModule('WidgetBridge');
  }
} catch (e) {
  // Graceful fallback if native module is not yet compiled into binary
}

export const WidgetBridge = {
  setWidgetData: (data: QuranWidgetData): boolean => {
    if (nativeModule?.setWidgetData) {
      try {
        return nativeModule.setWidgetData(data);
      } catch (e) {
        console.warn('WidgetBridge.setWidgetData error', e);
      }
    }
    return false;
  },

  getWidgetData: (): QuranWidgetData | null => {
    if (nativeModule?.getWidgetData) {
      try {
        return nativeModule.getWidgetData();
      } catch (e) {
        console.warn('WidgetBridge.getWidgetData error', e);
      }
    }
    return null;
  },

  reloadAllWidgets: (): boolean => {
    if (nativeModule?.reloadAllWidgets) {
      try {
        return nativeModule.reloadAllWidgets();
      } catch (e) {
        console.warn('WidgetBridge.reloadAllWidgets error', e);
      }
    }
    return false;
  },
};
