import notificationsDataRaw from '@/constants/notificationsData.json';

export type VerseEmotionCategory = 'rezeki' | 'kecemasan' | 'kesedihan' | 'motivasi' | 'jumat';

export interface NotificationVerseItem {
  id: string;
  category: VerseEmotionCategory;
  categoryLabel: string;
  title: string;
  body: string;
  arabic: string;
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  audioUrl: string;
}

export const NOTIFICATION_VERSES: NotificationVerseItem[] = notificationsDataRaw as NotificationVerseItem[];

/**
 * Filter verses by category
 */
export function getVersesByCategory(category: VerseEmotionCategory): NotificationVerseItem[] {
  return NOTIFICATION_VERSES.filter((v) => v.category === category);
}

/**
 * Get verse by ID
 */
export function getVerseById(id: string): NotificationVerseItem | undefined {
  return NOTIFICATION_VERSES.find((v) => v.id === id);
}

/**
 * Pick a random verse, with optional preference for Friday
 */
export function getRandomVerse(isFriday: boolean = false): NotificationVerseItem {
  if (isFriday) {
    const jumatVerses = getVersesByCategory('jumat');
    if (jumatVerses.length > 0) {
      return jumatVerses[Math.floor(Math.random() * jumatVerses.length)];
    }
  }

  // Non-Friday or fallback: pick from other categories
  const nonFridayVerses = NOTIFICATION_VERSES.filter((v) => v.category !== 'jumat');
  return nonFridayVerses[Math.floor(Math.random() * nonFridayVerses.length)];
}
