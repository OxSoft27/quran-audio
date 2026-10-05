/**
 * 8-point grid spacing scale
 *
 * All spacing values (margin, padding, gap) MUST use these tokens.
 * The 4px value is allowed only for tight optical adjustments (e.g. icon-to-label).
 */

export const Spacing = {
  /** 4px — optical micro-adjustment only */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px — 1.5× base, for compact gaps */
  md: 12,
  /** 16px — 2× base */
  lg: 16,
  /** 24px — 3× base, standard page margin */
  xl: 24,
  /** 32px — 4× base */
  '2xl': 32,
  /** 40px */
  '3xl': 40,
  /** 48px */
  '4xl': 48,
  /** 56px */
  '5xl': 56,
  /** 64px */
  '6xl': 64,
  /** 96px */
  '8xl': 96,

  /** Standard horizontal page padding */
  pagePadding: 24,
} as const;
