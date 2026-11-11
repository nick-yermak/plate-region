export const LABEL_FONT_PX = 11;
export const REFERENCE_MAP_SIZE_PX = 328;
export const INTER_UNITS_PER_EM = 2048;
export const INTER_CAP_HEIGHT = 1490;

// Advance widths of InterVariable.woff2 instanced at wght 600 (fontTools), units per em 2048.
export const INTER_600_ADVANCES: Readonly<Record<string, number>> = {
  A: 1490,
  B: 1350,
  C: 1509,
  D: 1479,
  E: 1240,
  F: 1204,
  G: 1534,
  H: 1527,
  I: 567,
  J: 1188,
  K: 1441,
  L: 1158,
  M: 1889,
  N: 1555,
  O: 1574,
  P: 1321,
  Q: 1583,
  R: 1336,
  S: 1332,
  T: 1352,
  U: 1507,
  V: 1490,
  W: 2089,
  X: 1474,
  Y: 1461,
  Z: 1336,
};

/** Every module is 1000 wide (D-60). */
export function labelFontSize(viewBoxHeight: number): number {
  return (
    (LABEL_FONT_PX * Math.max(1000, viewBoxHeight)) / REFERENCE_MAP_SIZE_PX
  );
}

export function labelFits(
  code: string,
  radius: number,
  fontSize: number,
): boolean {
  let sum = 0;
  for (const ch of code) {
    const advance = INTER_600_ADVANCES[ch];
    if (advance === undefined) {
      throw new Error(`no advance for ${ch}`);
    }
    sum += advance;
  }
  const width = (sum / INTER_UNITS_PER_EM) * fontSize;
  const height = (INTER_CAP_HEIGHT / INTER_UNITS_PER_EM) * fontSize;
  return Math.hypot(width / 2, height / 2) <= radius;
}
