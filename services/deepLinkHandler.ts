import * as Notifications from 'expo-notifications';
import { TitleDetails } from '@/context/AudioContext';

export interface DeepLinkAudioPayload {
  surahNumber: number;
  ayahNumber?: number;
  audioUrl: string;
  surahName: string;
  title?: string;
  qariName?: string;
}

/**
 * Parse deep link URL into playback payload
 * Example: quranflow://play?surah=65&ayah=2&audioUrl=https%3A%2F%2F...&surahName=At-Talaq
 */
export function parseDeepLinkUrl(url: string, isInitial: boolean = false): DeepLinkAudioPayload | null {
  if (!url) return null;

  if (isInitial) {
    if (handledInitialUrls.has(url)) {
      console.log('[deepLinkHandler] Initial URL already handled, skipping:', url);
      return null;
    }
    handledInitialUrls.add(url);
  }

  try {
    // Normalise url protocol
    const parsed = new URL(url);
    const host = parsed.host || parsed.pathname.replace(/^\/\//, '');

    if (host.includes('play') || parsed.pathname.includes('play')) {
      const searchParams = parsed.searchParams;
      const surahStr = searchParams.get('surah');
      const ayahStr = searchParams.get('ayah');
      const audioUrl = searchParams.get('audioUrl');
      const surahName = searchParams.get('surahName') || 'Al-Qur\'an';
      const title = searchParams.get('title') || undefined;

      if (audioUrl) {
        return {
          surahNumber: surahStr ? parseInt(surahStr, 10) : 1,
          ayahNumber: ayahStr ? parseInt(ayahStr, 10) : undefined,
          audioUrl: decodeURIComponent(audioUrl),
          surahName: decodeURIComponent(surahName),
          title: title ? decodeURIComponent(title) : undefined,
          qariName: 'Mishary Al-Afasy',
        };
      }
    }
  } catch (error) {
    // Manual query extraction fallback in case of non-standard URL scheme
    try {
      const queryMatch = url.match(/\?(.*)$/);
      if (queryMatch && queryMatch[1]) {
        const params = new URLSearchParams(queryMatch[1]);
        const surah = params.get('surah');
        const ayah = params.get('ayah');
        const audioUrl = params.get('audioUrl');
        const surahName = params.get('surahName');
        const title = params.get('title');

        if (audioUrl) {
          return {
            surahNumber: surah ? parseInt(surah, 10) : 1,
            ayahNumber: ayah ? parseInt(ayah, 10) : undefined,
            audioUrl: decodeURIComponent(audioUrl),
            surahName: surahName ? decodeURIComponent(surahName) : 'Al-Qur\'an',
            title: title ? decodeURIComponent(title) : undefined,
            qariName: 'Mishary Al-Afasy',
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse deep link URL fallback:', e);
    }
  }

  return null;
}

// Track processed identifiers so cold start and runtime events never execute more than once
const handledInitialUrls = new Set<string>();
const handledNotificationResponseIds = new Set<string>();

/**
 * Extract audio payload from notification response
 */
export function parseNotificationResponse(
  response: Notifications.NotificationResponse
): DeepLinkAudioPayload | null {
  try {
    const notifId =
      response.notification.request.identifier ||
      `${response.notification.date}_${response.actionIdentifier}`;

    if (handledNotificationResponseIds.has(notifId)) {
      console.log('[deepLinkHandler] Notification response already handled, skipping:', notifId);
      return null;
    }
    handledNotificationResponseIds.add(notifId);

    const data = response.notification.request.content.data;
    if (!data) return null;

    if (data.audioUrl) {
      return {
        surahNumber: Number(data.surahNumber) || 1,
        ayahNumber: data.ayahNumber ? Number(data.ayahNumber) : undefined,
        audioUrl: String(data.audioUrl),
        surahName: String(data.surahName || 'Al-Qur\'an'),
        title: data.title ? String(data.title) : undefined,
        qariName: 'Mishary Al-Afasy',
      };
    }

    if (data.url) {
      return parseDeepLinkUrl(String(data.url));
    }
  } catch (error) {
    console.warn('Failed to parse notification payload:', error);
  }

  return null;
}

// Global lock to prevent duplicate execution when multiple listeners fire for the same event
let lastHandledAt = 0;
let lastHandledKey = '';
let isExecuting = false;

/**
 * Direct playback and navigation to player screen with deduplication
 */
export async function executeDirectPlayback(
  payload: DeepLinkAudioPayload,
  playSurah: (url: string, details: TitleDetails) => Promise<void>,
  router: any
): Promise<void> {
  const currentKey = `${payload.surahNumber}_${payload.ayahNumber || 'all'}_${payload.audioUrl}`;
  const now = Date.now();

  // Deduplicate events occurring within 3 seconds
  if (now - lastHandledAt < 3000 && lastHandledKey === currentKey) {
    console.log('[deepLinkHandler] Ignoring duplicate playback trigger within debounce window:', currentKey);
    return;
  }

  if (isExecuting) {
    console.log('[deepLinkHandler] Playback execution currently in progress, skipping duplicate.');
    return;
  }

  isExecuting = true;
  lastHandledAt = now;
  lastHandledKey = currentKey;

  try {
    const displayName = payload.ayahNumber
      ? `${payload.surahName} : Ayat ${payload.ayahNumber}`
      : payload.surahName;

    await playSurah(payload.audioUrl, {
      surahName: displayName,
      qariName: payload.qariName || 'Mishary Al-Afasy',
      surahNumber: payload.surahNumber,
      qariId: 'mishary-alafasy',
      ayahNumber: payload.ayahNumber,
    });

    // Small delay ensures AudioContext and navigation stack are fully ready
    setTimeout(() => {
      try {
        if (router) {
          if (typeof router.navigate === 'function') {
            router.navigate('/player/fullscreen');
          } else if (typeof router.push === 'function') {
            router.push('/player/fullscreen');
          }
        }
      } catch (navError) {
        console.warn('[deepLinkHandler] Navigation error:', navError);
      }
    }, 400);
  } catch (error) {
    console.error('Error executing direct audio playback:', error);
  } finally {
    setTimeout(() => {
      isExecuting = false;
    }, 1500);
  }
}
