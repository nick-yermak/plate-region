import type { MapViewBox } from '@plate-region/plate-data';

import { INTER_600_GLYPHS } from './inter-600-glyphs';
import {
  DOT_HALO_PX,
  DOT_LABEL_BASELINE_PX,
  DOT_LABEL_BELOW_BASELINE_PX,
  DOT_LABEL_SIDE_BASELINE_PX,
  DOT_LABEL_SIDE_GAP_PX,
  DOT_RADIUS_PX,
  INTER_UNITS_PER_EM,
  LABEL_HALO_PX,
} from './map-labels';

export type SeatLabelTier = 'full' | 'code' | 'none';

export type SeatLabelPosition = 'above' | 'below' | 'right' | 'left';

export const SEAT_LABEL_POSITIONS: readonly SeatLabelPosition[] = [
  'above',
  'below',
  'right',
  'left',
] as const;

export const NARROW = { mapPx: 328, fontPx: 11 } as const;
export const WIDE = { mapPx: 560, fontPx: 12 } as const;

export type SeatLabelTierConfig = typeof NARROW | typeof WIDE;

export interface SeatLabelArea {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly fullText: string;
  readonly codeText: string;
  readonly selected: boolean;
  /** Voivodeship capital of this module (CountryMap.capitals). */
  readonly capital: boolean;
}

export interface SeatLabelPlacement {
  readonly tier: SeatLabelTier;
  readonly position: SeatLabelPosition;
  /** Selected code placed despite overlapping another area's dot. */
  readonly forced: boolean;
}

type Box = {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
};

const MAP_MARGIN_PX = 8;
/** Half-extent of a seat-dot obstacle square in CSS px (radius 3 + half of 2 px halo). */
const DOT_HALF_PX = DOT_RADIUS_PX + DOT_HALO_PX / 2;

function textMetrics(
  text: string,
  fontPx: number,
): { width: number; yMin: number; yMax: number } {
  let advance = 0;
  let yMin = Infinity;
  let yMax = -Infinity;
  for (const ch of text) {
    const glyph = INTER_600_GLYPHS[ch];
    if (glyph === undefined) {
      throw new Error(`no glyph for ${ch}`);
    }
    advance += glyph.advance;
    if (glyph.yMin < yMin) {
      yMin = glyph.yMin;
    }
    if (glyph.yMax > yMax) {
      yMax = glyph.yMax;
    }
  }
  if (!Number.isFinite(yMin)) {
    yMin = 0;
    yMax = 0;
  }
  const s = fontPx / INTER_UNITS_PER_EM;
  return { width: advance * s, yMin: yMin * s, yMax: yMax * s };
}

/** Extra CSS px so collision boxes cover browser text metrics (± stroke). */
const COLLISION_PAD_PX = 2;

/** SVG dx/dy (user px) and text-anchor for a placed seat label. */
export function seatLabelSvgAttrs(position: SeatLabelPosition): {
  readonly dx: number;
  readonly dy: number;
  readonly textAnchor: 'middle' | 'start' | 'end';
} {
  switch (position) {
    case 'above':
      return { dx: 0, dy: -DOT_LABEL_BASELINE_PX, textAnchor: 'middle' };
    case 'below':
      return { dx: 0, dy: DOT_LABEL_BELOW_BASELINE_PX, textAnchor: 'middle' };
    case 'right':
      return {
        dx: DOT_LABEL_SIDE_GAP_PX,
        dy: DOT_LABEL_SIDE_BASELINE_PX,
        textAnchor: 'start',
      };
    case 'left':
      return {
        dx: -DOT_LABEL_SIDE_GAP_PX,
        dy: DOT_LABEL_SIDE_BASELINE_PX,
        textAnchor: 'end',
      };
  }
}

/** Label collision box in CSS px for the given tip and position. */
export function seatLabelBox(
  text: string,
  cx: number,
  cy: number,
  fontPx: number,
  position: SeatLabelPosition = 'above',
): Box {
  const m = textMetrics(text, fontPx);
  const width = m.width + LABEL_HALO_PX + 2 * COLLISION_PAD_PX;
  const { dx, dy, textAnchor } = seatLabelSvgAttrs(position);
  const baselineX = cx + dx;
  const baselineY = cy + dy;
  const inkTop = baselineY - m.yMax;
  const inkBottom = baselineY - m.yMin;
  const height = inkBottom - inkTop + LABEL_HALO_PX + 2 * COLLISION_PAD_PX;
  const midY = (inkTop + inkBottom) / 2;
  let midX = baselineX;
  if (textAnchor === 'start') {
    midX = baselineX + m.width / 2;
  } else if (textAnchor === 'end') {
    midX = baselineX - m.width / 2;
  }
  return {
    left: midX - width / 2,
    right: midX + width / 2,
    top: midY - height / 2,
    bottom: midY + height / 2,
  };
}

export function seatDotBox(cx: number, cy: number): Box {
  return {
    left: cx - DOT_HALF_PX,
    right: cx + DOT_HALF_PX,
    top: cy - DOT_HALF_PX,
    bottom: cy + DOT_HALF_PX,
  };
}

export function boxesOverlap(a: Box, b: Box): boolean {
  // Edge contact is clear (gap ≥ 0); a tiny epsilon absorbs float noise on sides.
  const eps = 1e-6;
  return (
    a.left < b.right - eps &&
    a.right > b.left + eps &&
    a.top < b.bottom - eps &&
    a.bottom > b.top + eps
  );
}

function insideMap(box: Box, mapW: number, mapH: number): boolean {
  return (
    box.left >= -MAP_MARGIN_PX &&
    box.right <= mapW + MAP_MARGIN_PX &&
    box.top >= -MAP_MARGIN_PX &&
    box.bottom <= mapH + MAP_MARGIN_PX
  );
}

/**
 * Places seat/code labels without overlaps at a fixed map width.
 * Selected first, then voivodeship capitals, then radius descending, ties by
 * id. Each label tries above/below/right/left for full, then code. Own tip is
 * not an obstacle; every other area's dot square is. Only a selected forced
 * code (above) may meet a foreign tip.
 */
export function placeSeatLabels(
  areas: readonly SeatLabelArea[],
  viewBox: MapViewBox,
  tier: SeatLabelTierConfig,
): ReadonlyMap<string, SeatLabelPlacement> {
  // Box is square on the larger side (D-61); CSS px per view-box unit.
  const scale = tier.mapPx / Math.max(viewBox.width, viewBox.height);
  const mapW = viewBox.width * scale;
  const mapH = viewBox.height * scale;
  const ordered = [...areas].sort((a, b) => {
    if (a.selected !== b.selected) {
      return a.selected ? -1 : 1;
    }
    if (a.capital !== b.capital) {
      return a.capital ? -1 : 1;
    }
    if (a.radius !== b.radius) {
      return b.radius - a.radius;
    }
    return a.id.localeCompare(b.id);
  });
  const dots = new Map(
    areas.map((area) => {
      const cx = area.x * scale;
      const cy = area.y * scale;
      return [area.id, seatDotBox(cx, cy)] as const;
    }),
  );
  const placed: Box[] = [];
  const result = new Map<string, SeatLabelPlacement>();

  for (const area of ordered) {
    const cx = area.x * scale;
    const cy = area.y * scale;
    const tryPlace = (
      text: string,
      position: SeatLabelPosition,
      ignoreDots: boolean,
    ): boolean => {
      const box = seatLabelBox(text, cx, cy, tier.fontPx, position);
      if (!insideMap(box, mapW, mapH)) {
        return false;
      }
      if (!ignoreDots) {
        for (const [id, dot] of dots) {
          if (id === area.id) {
            continue;
          }
          if (boxesOverlap(box, dot)) {
            return false;
          }
        }
      }
      for (const prior of placed) {
        if (boxesOverlap(box, prior)) {
          return false;
        }
      }
      placed.push(box);
      return true;
    };
    let chosen: SeatLabelPlacement | undefined;
    for (const position of SEAT_LABEL_POSITIONS) {
      if (tryPlace(area.fullText, position, false)) {
        chosen = { tier: 'full', position, forced: false };
        break;
      }
    }
    if (chosen === undefined) {
      for (const position of SEAT_LABEL_POSITIONS) {
        if (tryPlace(area.codeText, position, false)) {
          chosen = { tier: 'code', position, forced: false };
          break;
        }
      }
    }
    if (chosen === undefined && area.selected) {
      // Forced code stays above; may sit on a foreign tip.
      placed.push(seatLabelBox(area.codeText, cx, cy, tier.fontPx, 'above'));
      chosen = { tier: 'code', position: 'above', forced: true };
    }
    result.set(
      area.id,
      chosen ?? { tier: 'none', position: 'above', forced: false },
    );
  }
  return result;
}
