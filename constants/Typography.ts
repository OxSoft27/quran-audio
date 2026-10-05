import { Platform, TextStyle } from 'react-native';

/**
 * Apple Human Interface Guidelines Typography System
 * https://developer.apple.com/design/human-interface-guidelines/typography
 *
 * Core Apple Font Family Architecture:
 * - SF Pro / SF Pro Rounded: Primary UI font & Branding (QuranFlow)
 * - SF Pro Display: Optical size for Headings & Section Titles (>= 20pt)
 * - SF Pro Text: Optical size for Body, Surah Name, Descriptions (< 20pt)
 * - SF Pro Tabular Numbers: Clean, fixed-width numbers for audio duration (05:32), timestamps & surah counters
 * - SF Arabic: Native Apple Arabic UI glyphs
 * - Dedicated Quran Arabic Font: Amiri Quran ('AmiriQuran', 'Amiri-Bold') for authentic classical Quranic calligraphy
 */

export const Typography = {
  // ── Font Families ───────────────────────────────────
  fontFamily: {
    // Primary Apple System Font (SF Pro on iOS)
    primary: Platform.select({ ios: 'System', default: 'System' }),
    // SF Pro Display (Optical sizing >= 20pt in iOS CoreText)
    display: Platform.select({ ios: 'System', default: 'System' }),
    // SF Pro Text (Optical sizing < 20pt in iOS CoreText)
    text: Platform.select({ ios: 'System', default: 'System' }),
    // SF Pro Rounded (Used for App title / brand badges)
    rounded: Platform.select({ ios: 'SF Pro Rounded', default: 'System' }),
    // Apple SF Arabic for clean modern UI Arabic
    arabicUI: Platform.select({ ios: 'System', default: 'System' }),
    // Dedicated authentic Quran Arabic font for verses & Surah Arabic names
    quran: 'AmiriQuran',
    quranBold: 'Amiri-Bold',
  },

  // ── Dynamic Type Sizes (px / pt) ────────────────────
  size: {
    caption2: 11,
    caption1: 12,
    footnote: 13,
    subhead: 15,
    callout: 16,
    body: 17,
    title3: 20, // Optical threshold where SF Pro switches from Text to Display
    headline: 20,
    title2: 22,
    title1: 28,
    largeTitle: 34,
    display: 48,
  },

  // ── Font Weights ────────────────────────────────────
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },

  // ── Letter Spacings (Apple tracking specifications) ──
  tracking: {
    tight: -0.6,
    display: -0.4,
    headline: -0.3,
    body: -0.2,
    subhead: -0.1,
    normal: 0,
    wide: 0.2,
  },

  // ── Numbers & Durations (SF Pro Tabular Figures) ─────
  // Prevents digit jittering when audio plays (e.g., 05:32)
  tabularNumber: {
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontWeight: '500' as const,
    fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
  },

  // ── Presets ─────────────────────────────────────────
  preset: {
    // 1. Heading Besar (SF Pro Display Semibold / Bold)
    brandTitle: {
      fontFamily: Platform.select({ ios: 'SF Pro Rounded', default: 'System' }),
      fontSize: 34,
      fontWeight: '700' as const,
      letterSpacing: -0.6,
    },
    largeTitle: {
      fontFamily: Platform.select({ ios: 'System', default: 'System' }),
      fontSize: 34,
      fontWeight: '700' as const,
      letterSpacing: -0.6,
    },
    title1: {
      fontFamily: Platform.select({ ios: 'System', default: 'System' }),
      fontSize: 28,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
    },
    title2: {
      fontFamily: Platform.select({ ios: 'System', default: 'System' }),
      fontSize: 22,
      fontWeight: '600' as const,
      letterSpacing: -0.4,
    },

    // 2. Judul Section (SF Pro Display Semibold)
    sectionHeader: {
      fontFamily: Platform.select({ ios: 'System', default: 'System' }),
      fontSize: 20,
      fontWeight: '600' as const,
      letterSpacing: -0.4,
    },
    headline: {
      fontFamily: Platform.select({ ios: 'System', default: 'System' }),
      fontSize: 20,
      fontWeight: '600' as const,
      letterSpacing: -0.3,
    },

    // 3. Isi / Nama Surah / Deskripsi (SF Pro Text Regular / Medium / Semibold)
    surahName: {
      fontFamily: Platform.select({ ios: 'System', default: 'System' }),
      fontSize: 17,
      fontWeight: '600' as const,
      letterSpacing: -0.2,
    },
    body: {
      fontFamily: Platform.select({ ios: 'System', default: 'System' }),
      fontSize: 17,
      fontWeight: '400' as const,
      letterSpacing: -0.2,
    },
    bodyMedium: {
      fontFamily: Platform.select({ ios: 'System', default: 'System' }),
      fontSize: 17,
      fontWeight: '500' as const,
      letterSpacing: -0.2,
    },
    bodySemibold: {
      fontFamily: Platform.select({ ios: 'System', default: 'System' }),
      fontSize: 17,
      fontWeight: '600' as const,
      letterSpacing: -0.2,
    },
    subhead: {
      fontFamily: Platform.select({ ios: 'System', default: 'System' }),
      fontSize: 15,
      fontWeight: '400' as const,
      letterSpacing: -0.1,
    },
    subheadMedium: {
      fontFamily: Platform.select({ ios: 'System', default: 'System' }),
      fontSize: 15,
      fontWeight: '500' as const,
      letterSpacing: -0.1,
    },
    subheadSemibold: {
      fontFamily: Platform.select({ ios: 'System', default: 'System' }),
      fontSize: 15,
      fontWeight: '600' as const,
      letterSpacing: -0.1,
    },
    footnote: {
      fontFamily: Platform.select({ ios: 'System', default: 'System' }),
      fontSize: 13,
      fontWeight: '400' as const,
      letterSpacing: 0,
    },
    footnoteMedium: {
      fontFamily: Platform.select({ ios: 'System', default: 'System' }),
      fontSize: 13,
      fontWeight: '500' as const,
      letterSpacing: 0,
    },
    footnoteSemibold: {
      fontFamily: Platform.select({ ios: 'System', default: 'System' }),
      fontSize: 13,
      fontWeight: '600' as const,
      letterSpacing: 0,
    },
    caption1: {
      fontFamily: Platform.select({ ios: 'System', default: 'System' }),
      fontSize: 12,
      fontWeight: '400' as const,
    },
    caption2: {
      fontFamily: Platform.select({ ios: 'System', default: 'System' }),
      fontSize: 11,
      fontWeight: '400' as const,
    },

    // 4. Angka, Durasi Audio (SF Pro Medium + Tabular Numbers)
    audioDuration: {
      fontFamily: Platform.select({ ios: 'System', default: 'System' }),
      fontSize: 12,
      fontWeight: '500' as const,
      fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
      letterSpacing: 0.1,
    },
    surahNumberBadge: {
      fontFamily: Platform.select({ ios: 'System', default: 'System' }),
      fontSize: 14,
      fontWeight: '600' as const,
      fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
    },
    timerDisplay: {
      fontFamily: Platform.select({ ios: 'System', default: 'System' }),
      fontSize: 48,
      fontWeight: '700' as const,
      fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
      letterSpacing: -1,
    },

    // 5. Arabic UI & Ayat Quran
    arabicUI: {
      fontFamily: Platform.select({ ios: 'System', default: 'System' }),
      fontSize: 16,
      fontWeight: '500' as const,
      textAlign: 'right' as const,
    },
    quranSurahTitle: {
      fontFamily: 'AmiriQuran',
      fontSize: 22,
      lineHeight: 34,
      textAlign: 'right' as const,
    },
    quranAyah: {
      fontFamily: 'AmiriQuran',
      fontSize: 26,
      lineHeight: 46,
      textAlign: 'right' as const,
    },
    display: {
      fontFamily: Platform.select({ ios: 'System', default: 'System' }),
      fontSize: 48,
      fontWeight: '700' as const,
      letterSpacing: -1,
    },
  },
} as const;
