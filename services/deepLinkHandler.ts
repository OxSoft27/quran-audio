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
export function parseDeepLinkUrl(url: string): DeepLinkAudioPayload | null {
  if (!url) return null;

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

/**
 * Extract audio payload from notification response
 */
export function parseNotificationResponse(
  response: Notifications.NotificationResponse
): DeepLinkAudioPayload | null {
  try {
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

/**
 * Direct playback and navigation to player screen
 */
export async function executeDirectPlayback(
  payload: DeepLinkAudioPayload,
  playSurah: (url: string, details: TitleDetails) => Promise<void>,
  router: any
): Promise<void> {
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

    // Navigate to full player screen
    if (router && typeof router.push === 'function') {
      router.push('/player/fullscreen');
    }
  } catch (error) {
    console.error('Error executing direct audio playback:', error);
  }
}
