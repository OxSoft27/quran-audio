import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { AppState, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import id from '../locales/id.json';
import en from '../locales/en.json';
import ar from '../locales/ar.json';

export const LANGUAGE_STORAGE_KEY = '@user_preferred_language';

export const SUPPORTED_LANGUAGES = [
    { code: 'id', name: 'Bahasa Indonesia', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'en', name: 'English', nativeName: 'English (US)', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', nativeName: 'العربية', flag: '🇸🇦' },
] as const;

export type SupportedLanguageCode = 'id' | 'en' | 'ar';

/**
 * Detect primary language from device / iOS Per-App Language setting
 */
export const getDeviceLanguage = (): SupportedLanguageCode => {
    try {
        const locales = Localization.getLocales();
        const code = locales && locales.length > 0 ? locales[0].languageCode : null;
        if (code === 'en' || code === 'ar' || code === 'id') {
            return code;
        }
        return 'id';
    } catch {
        return 'id';
    }
};

const resources = {
    id: { translation: id },
    en: { translation: en },
    ar: { translation: ar },
};

// Initialize i18next
i18n
    .use(initReactI18next)
    .init({
        compatibilityJSON: 'v4',
        resources,
        lng: getDeviceLanguage(),
        fallbackLng: 'id',
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false,
        },
    });

// Check if user has a stored custom override on startup
(async () => {
    try {
        const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLang && (savedLang === 'id' || savedLang === 'en' || savedLang === 'ar')) {
            i18n.changeLanguage(savedLang);
        } else {
            i18n.changeLanguage(getDeviceLanguage());
        }
    } catch {
        // Fallback to detected device language
    }
})();

// Automatically update language when app returns to foreground from iOS Settings
AppState.addEventListener('change', async (nextState) => {
    if (nextState === 'active') {
        try {
            const savedCustomLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
            // If user has not hardcoded a custom override in-app, sync with iOS Per-App language
            if (!savedCustomLang) {
                const currentDeviceLang = getDeviceLanguage();
                if (i18n.language !== currentDeviceLang) {
                    await i18n.changeLanguage(currentDeviceLang);
                }
            }
        } catch {
            // ignore
        }
    }
});

/**
 * Open iOS System Settings for QuranFlow
 * Opens iOS Settings > QuranFlow where "Preferred Language" is available
 */
export const openIosLanguageSettings = async () => {
    try {
        await Linking.openSettings();
    } catch (e) {
        console.warn('Could not open settings', e);
    }
};

/**
 * Manually switch language inside app and optionally persist
 */
export const changeAppLanguage = async (code: SupportedLanguageCode, persist = true) => {
    await i18n.changeLanguage(code);
    if (persist) {
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    }
};

/**
 * Reset in-app override to follow iOS System Settings
 */
export const resetToSystemLanguage = async () => {
    await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY);
    const systemLang = getDeviceLanguage();
    await i18n.changeLanguage(systemLang);
};

export default i18n;
