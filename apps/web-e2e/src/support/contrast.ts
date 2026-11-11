export type Rgba = {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
};

export function parseCssColor(value: string): Rgba {
  const match = value.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
  );
  if (match === null) {
    throw new Error(`unsupported colour: ${value}`);
  }
  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
    a: match[4] === undefined ? 1 : Number(match[4]),
  };
}

/** Composes a possibly translucent colour over an opaque backdrop. */
export function composeOver(foreground: Rgba, background: Rgba): Rgba {
  const a = foreground.a + background.a * (1 - foreground.a);
  if (a === 0) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  return {
    r:
      (foreground.r * foreground.a +
        background.r * background.a * (1 - foreground.a)) /
      a,
    g:
      (foreground.g * foreground.a +
        background.g * background.a * (1 - foreground.a)) /
      a,
    b:
      (foreground.b * foreground.a +
        background.b * background.a * (1 - foreground.a)) /
      a,
    a,
  };
}

function channelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(color: Rgba): number {
  return (
    0.2126 * channelLuminance(color.r) +
    0.7152 * channelLuminance(color.g) +
    0.0722 * channelLuminance(color.b)
  );
}

export function contrastRatio(foreground: Rgba, background: Rgba): number {
  const composed = composeOver(foreground, background);
  const l1 = relativeLuminance(composed);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
