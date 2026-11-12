import type { Page } from '@playwright/test';

export type CssRect = {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
};

export function overlapBothAxes(a: CssRect, b: CssRect): boolean {
  const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return ox > 0.5 && oy > 0.5;
}

/** One plate per region1 primary letter, plus Warsaw WW (stableExamplePlateForCode). */
export const MAP_DIALOG_LABEL_PLATES = [
  'BI 4UM92',
  'CB 2Y348',
  'DJ 890VX',
  'EL 094TN',
  'FG 1YN1',
  'GD 16743',
  'KR 6L251',
  'LB 407CM',
  'NE 907AM',
  'OP 7CE46',
  'PK 104SM',
  'RK 4K21',
  'SB 170FC',
  'TK 765UH',
  'WO 291UA',
  'ZK 61WU',
  'WW 4PN15',
  'SK 404NM',
  'WPI 772LX',
] as const;

export async function labelGeometryViolations(page: Page): Promise<string[]> {
  return page.locator('.ant-modal').evaluate((modal) => {
    type Rect = {
      left: number;
      right: number;
      top: number;
      bottom: number;
    };
    const overlap = (a: Rect, b: Rect): boolean => {
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      return ox > 0.5 && oy > 0.5;
    };
    const toRect = (el: Element): Rect => {
      const r = el.getBoundingClientRect();
      return {
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
      };
    };
    const seatsRoot =
      modal.querySelector('svg.labels.seats') ??
      modal.querySelector('svg.labels');
    if (seatsRoot === null) {
      return ['missing svg.labels'];
    }
    const seats = new Map<string, { id: string; dot: Rect; labels: Rect[] }>();
    for (const child of Array.from(seatsRoot.children)) {
      const areaId = child.getAttribute('data-area-id');
      if (areaId === null) {
        continue;
      }
      if (
        child instanceof SVGCircleElement &&
        child.classList.contains('seat-dot')
      ) {
        seats.set(areaId, { id: areaId, dot: toRect(child), labels: [] });
        continue;
      }
      if (
        child instanceof SVGTextElement &&
        child.classList.contains('seat-label') &&
        getComputedStyle(child).display !== 'none'
      ) {
        const seat = seats.get(areaId);
        if (seat === undefined) {
          return [`label without seat-dot for ${areaId}`];
        }
        // Forced selected codes may sit on a foreign tip (G1).
        if (child.getAttribute('data-forced') === 'true') {
          continue;
        }
        seat.labels.push(toRect(child));
      }
    }
    const violations: string[] = [];
    const visibleLabels: { seatId: string; box: Rect }[] = [];
    for (const seat of seats.values()) {
      for (const box of seat.labels) {
        if (overlap(box, seat.dot)) {
          violations.push(`${seat.id} label overlaps own dot`);
        }
        for (const other of seats.values()) {
          if (other.id === seat.id) {
            continue;
          }
          if (overlap(box, other.dot)) {
            violations.push(`${seat.id} label overlaps ${other.id}`);
          }
        }
        for (const prior of visibleLabels) {
          if (overlap(box, prior.box)) {
            violations.push(`${seat.id} label overlaps label ${prior.seatId}`);
          }
        }
        visibleLabels.push({ seatId: seat.id, box });
      }
    }
    return violations;
  });
}
