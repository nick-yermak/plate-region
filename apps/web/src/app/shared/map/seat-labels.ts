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
export const COUNTRY_NARROW = { mapPx: 328, fontPx: 11 } as const;
export const COUNTRY_WIDE = { mapPx: 541, fontPx: 12 } as const;

export type SeatLabelTierConfig = {
  readonly mapPx: number;
  readonly fontPx: number;
};

export type CapitalOrder = 'radius' | 'shortest-full';

export type PlaceSeatLabelsOptions = {
  /** Default `radius` (dialog). Country uses `shortest-full`. */
  readonly capitalOrder?: CapitalOrder;
  /** Slide above/below into the map at the left/right edges (country only). */
  readonly horizontalClamp?: boolean;
  /**
   * How far a label may sit past the map edge in CSS px. Dialog default 8;
   * map of Poland uses 0 (no card padding below 768 px).
   */
  readonly mapMarginPx?: number;
};

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
  /**
   * Half-extent of the marker obstacle in CSS px. Dialog dots omit this and
   * use the seat-dot square (±4). Country: 9 selected / 7 capital.
   */
  readonly markerExtent?: number;
  /** Index in CountryMap.capitals for shortest-full ties. */
  readonly registryIndex?: number;
}

export interface SeatLabelPlacement {
  readonly tier: SeatLabelTier;
  readonly position: SeatLabelPosition;
  /** Selected code placed despite overlapping another area's tip. */
  readonly forced: boolean;
  /** Extra CSS px on dx for edge slide (above/below). */
  readonly slideDx: number;
}

type Box = {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
};

/** Default outside margin for the dialog map. */
const DIALOG_MAP_MARGIN_PX = 8;
/** Half-extent of a seat-dot obstacle square in CSS px (radius 3 + half of 2 px halo). */
const DOT_HALF_PX = DOT_RADIUS_PX + DOT_HALO_PX / 2;
/** Dialog reference extent (radius 3 + halo 2) for outward label shifts. */
const DIALOG_EXTENT_PX = 5;
const COLLISION_PAD_PX = 2;
const CLAMP_ANCHOR_INSET_PX = 4;

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

function outwardShift(markerExtent: number | undefined): number {
  if (markerExtent === undefined) {
    return 0;
  }
  return markerExtent - DIALOG_EXTENT_PX;
}

/** SVG dx/dy (user px) and text-anchor for a placed seat label. */
export function seatLabelSvgAttrs(
  position: SeatLabelPosition,
  markerExtent?: number,
  slideDx = 0,
): {
  readonly dx: number;
  readonly dy: number;
  readonly textAnchor: 'middle' | 'start' | 'end';
} {
  const shift = outwardShift(markerExtent);
  switch (position) {
    case 'above':
      return {
        dx: slideDx,
        dy: -(DOT_LABEL_BASELINE_PX + shift),
        textAnchor: 'middle',
      };
    case 'below':
      return {
        dx: slideDx,
        dy: DOT_LABEL_BELOW_BASELINE_PX + shift,
        textAnchor: 'middle',
      };
    case 'right':
      return {
        dx: DOT_LABEL_SIDE_GAP_PX + shift,
        dy: DOT_LABEL_SIDE_BASELINE_PX,
        textAnchor: 'start',
      };
    case 'left':
      return {
        dx: -(DOT_LABEL_SIDE_GAP_PX + shift),
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
  markerExtent?: number,
  slideDx = 0,
): Box {
  const m = textMetrics(text, fontPx);
  const width = m.width + LABEL_HALO_PX + 2 * COLLISION_PAD_PX;
  const { dx, dy, textAnchor } = seatLabelSvgAttrs(
    position,
    markerExtent,
    slideDx,
  );
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

function markerObstacleBox(
  cx: number,
  cy: number,
  markerExtent: number | undefined,
): Box {
  if (markerExtent === undefined) {
    return seatDotBox(cx, cy);
  }
  return {
    left: cx - markerExtent,
    right: cx + markerExtent,
    top: cy - markerExtent,
    bottom: cy + markerExtent,
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

function insideMap(
  box: Box,
  mapW: number,
  mapH: number,
  mapMarginPx: number,
): boolean {
  return (
    box.left >= -mapMarginPx &&
    box.right <= mapW + mapMarginPx &&
    box.top >= -mapMarginPx &&
    box.bottom <= mapH + mapMarginPx
  );
}

function applyHorizontalClamp(
  box: Box,
  cx: number,
  mapW: number,
  mapH: number,
  mapMarginPx: number,
): { ok: true; box: Box; slideDx: number } | { ok: false } {
  if (box.top < -mapMarginPx || box.bottom > mapH + mapMarginPx) {
    return { ok: false };
  }
  let left = box.left;
  let right = box.right;
  const crossedLeft = left < -mapMarginPx;
  const crossedRight = right > mapW + mapMarginPx;
  if (crossedLeft || crossedRight) {
    if (crossedLeft) {
      const slide = -mapMarginPx - left;
      left += slide;
      right += slide;
    }
    if (right > mapW + mapMarginPx) {
      const slide = right - (mapW + mapMarginPx);
      left -= slide;
      right -= slide;
    }
    if (left < -mapMarginPx) {
      return { ok: false };
    }
  }
  if (cx < left + CLAMP_ANCHOR_INSET_PX || cx > right - CLAMP_ANCHOR_INSET_PX) {
    return { ok: false };
  }
  return {
    ok: true,
    box: { left, right, top: box.top, bottom: box.bottom },
    slideDx: left - box.left,
  };
}

function fullLabelWidth(text: string, fontPx: number): number {
  return textMetrics(text, fontPx).width;
}

function orderAreas(
  areas: readonly SeatLabelArea[],
  capitalOrder: CapitalOrder,
  fontPx: number,
): SeatLabelArea[] {
  return [...areas].sort((a, b) => {
    if (a.selected !== b.selected) {
      return a.selected ? -1 : 1;
    }
    if (a.capital !== b.capital) {
      return a.capital ? -1 : 1;
    }
    if (capitalOrder === 'shortest-full') {
      const wa = fullLabelWidth(a.fullText, fontPx);
      const wb = fullLabelWidth(b.fullText, fontPx);
      if (wa !== wb) {
        return wa - wb;
      }
      return (a.registryIndex ?? 0) - (b.registryIndex ?? 0);
    }
    if (a.radius !== b.radius) {
      return b.radius - a.radius;
    }
    return a.id.localeCompare(b.id);
  });
}

/**
 * Places seat/code labels without overlaps at a fixed map width.
 * Defaults match the dialog (D-61 Update #161). Country options: shortest-full
 * order, marker extents, horizontal edge slide.
 */
export function placeSeatLabels(
  areas: readonly SeatLabelArea[],
  viewBox: MapViewBox,
  tier: SeatLabelTierConfig,
  options: PlaceSeatLabelsOptions = {},
): ReadonlyMap<string, SeatLabelPlacement> {
  const capitalOrder = options.capitalOrder ?? 'radius';
  const horizontalClamp = options.horizontalClamp ?? false;
  const mapMarginPx = options.mapMarginPx ?? DIALOG_MAP_MARGIN_PX;
  const scale = tier.mapPx / Math.max(viewBox.width, viewBox.height);
  const mapW = viewBox.width * scale;
  const mapH = viewBox.height * scale;
  const ordered = orderAreas(areas, capitalOrder, tier.fontPx);
  const markers = new Map(
    areas.map((area) => {
      const cx = area.x * scale;
      const cy = area.y * scale;
      return [area.id, markerObstacleBox(cx, cy, area.markerExtent)] as const;
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
    ): { slideDx: number } | undefined => {
      const raw = seatLabelBox(
        text,
        cx,
        cy,
        tier.fontPx,
        position,
        area.markerExtent,
      );
      let box = raw;
      let slideDx = 0;
      if (horizontalClamp && (position === 'above' || position === 'below')) {
        const clamped = applyHorizontalClamp(raw, cx, mapW, mapH, mapMarginPx);
        if (!clamped.ok) {
          return undefined;
        }
        box = clamped.box;
        slideDx = clamped.slideDx;
      } else if (!insideMap(raw, mapW, mapH, mapMarginPx)) {
        return undefined;
      }
      for (const [id, marker] of markers) {
        if (id === area.id) {
          continue;
        }
        if (boxesOverlap(box, marker)) {
          return undefined;
        }
      }
      for (const prior of placed) {
        if (boxesOverlap(box, prior)) {
          return undefined;
        }
      }
      placed.push(box);
      return { slideDx };
    };
    let chosen: SeatLabelPlacement | undefined;
    for (const position of SEAT_LABEL_POSITIONS) {
      const placedOk = tryPlace(area.fullText, position);
      if (placedOk !== undefined) {
        chosen = {
          tier: 'full',
          position,
          forced: false,
          slideDx: placedOk.slideDx,
        };
        break;
      }
    }
    if (chosen === undefined) {
      for (const position of SEAT_LABEL_POSITIONS) {
        const placedOk = tryPlace(area.codeText, position);
        if (placedOk !== undefined) {
          chosen = {
            tier: 'code',
            position,
            forced: false,
            slideDx: placedOk.slideDx,
          };
          break;
        }
      }
    }
    if (chosen === undefined && area.selected) {
      // Forced code stays above; may sit on a foreign tip.
      placed.push(
        seatLabelBox(
          area.codeText,
          cx,
          cy,
          tier.fontPx,
          'above',
          area.markerExtent,
        ),
      );
      chosen = {
        tier: 'code',
        position: 'above',
        forced: true,
        slideDx: 0,
      };
    }
    result.set(
      area.id,
      chosen ?? {
        tier: 'none',
        position: 'above',
        forced: false,
        slideDx: 0,
      },
    );
  }
  return result;
}
