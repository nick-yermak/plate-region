/**
 * Per-character advances of DINish Condensed Medium v4.007 in plate mm: font
 * advance × 115.87 / 1024 (cap height 80 mm) plus the 4 mm letter spacing;
 * default proportional digits; matches the Chromium measurement. Kerning is
 * ignored.
 */
const PLATE_CHAR_ADVANCE_MM: Readonly<Record<string, number>> = {
  '0': 50.85,
  '1': 36.48,
  '2': 49.61,
  '3': 50.62,
  '4': 52.55,
  '5': 50.4,
  '6': 49.96,
  '7': 46.56,
  '8': 50.85,
  '9': 49.96,
  A: 58.32,
  B: 57.89,
  C: 59,
  D: 58.67,
  E: 50.75,
  F: 50.52,
  G: 59,
  H: 58.67,
  I: 28,
  J: 34.55,
  K: 57.43,
  L: 48.36,
  M: 72.26,
  N: 61.03,
  O: 59,
  P: 54.71,
  Q: 59,
  R: 57.76,
  S: 53.34,
  T: 48.26,
  U: 58.77,
  V: 54.03,
  W: 80.61,
  X: 52.1,
  Y: 50.29,
  Z: 47.58,
  ' ': 24.25,
};

/** 458 mm box minus 2 mm for kerning that widens, measured up to +1.1 mm. */
export const PLATE_TEXT_FIT_MM = 456;

export function plateTextWidthMm(text: string): number {
  let width = 0;
  for (const char of text.toUpperCase()) {
    width += PLATE_CHAR_ADVANCE_MM[char] ?? PLATE_CHAR_ADVANCE_MM['W'];
  }
  return width;
}

export function plateFit(text: string): number {
  return Math.min(1, PLATE_TEXT_FIT_MM / plateTextWidthMm(text));
}
