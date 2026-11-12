export const LABEL_FONT_PX = 11;
export const REFERENCE_MAP_SIZE_PX = 328;
export const INTER_UNITS_PER_EM = 2048;
export const INTER_CAP_HEIGHT = 1490;
export const LABEL_HALO_PX = 3;
export const MARKER_RADIUS_PX = 7;
export const MARKER_STROKE_PX = 2;
export const MARKER_HALO_PX = 4;
// Radius 7 + half the 4 px halo = 9 px edge, + 3 px gap.
export const MARKER_LABEL_BASELINE_PX = 12;

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

export function labelSizeEm(code: string): {
  width: number;
  height: number;
} {
  let sum = 0;
  for (const ch of code) {
    const advance = INTER_600_ADVANCES[ch];
    if (advance === undefined) {
      throw new Error(`no advance for ${ch}`);
    }
    sum += advance;
  }
  return {
    width: sum / INTER_UNITS_PER_EM,
    height: INTER_CAP_HEIGHT / INTER_UNITS_PER_EM,
  };
}

export function labelFits(
  code: string,
  radius: number,
  fontSize: number,
): boolean {
  const { width, height } = labelSizeEm(code);
  return Math.hypot((width * fontSize) / 2, (height * fontSize) / 2) <= radius;
}
