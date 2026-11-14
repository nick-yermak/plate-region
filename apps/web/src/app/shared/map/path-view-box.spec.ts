import { loadCountryMap } from '@plate-region/plate-data';

import { decodeMlzPath, pathViewBox } from './path-view-box';

describe('pathViewBox', () => {
  it('decodes M/l/z with glued negatives, implicit repeats and two subpaths', () => {
    // Subpath 1: (10,20) → (20,15) → (20,25) → close; subpath 2: (0,0) → (5,0) → (5,4).
    const path = 'M10 20l10-5 0 10zM0 0l5 0 0 4z';
    expect(decodeMlzPath(path)).toEqual([
      [10, 20],
      [20, 15],
      [20, 25],
      [0, 0],
      [5, 0],
      [5, 4],
    ]);
    // Bounds x 0–20, y 0–25 → size 20×25; 20% → pad 4×5.
    expect(pathViewBox(path)).toEqual({
      x: -4,
      y: -5,
      width: 28,
      height: 35,
    });
  });

  it('applies an explicit margin fraction', () => {
    expect(pathViewBox('M0 0l10 0 0 10-10 0z', 0.5)).toEqual({
      x: -5,
      y: -5,
      width: 20,
      height: 20,
    });
  });

  it('throws on an absolute L or a curve command', () => {
    expect(() => pathViewBox('M0 0L10 0L10 10Z')).toThrow(/PATH_GRAMMAR/);
    expect(() => pathViewBox('M0 0C1 1 2 2 3 3z')).toThrow(/PATH_GRAMMAR/);
  });

  it('returns a finite non-empty box inside the country viewBox for every voivodeship', async () => {
    const map = await loadCountryMap();
    expect(map.voivodeships).toHaveLength(16);
    for (const row of map.voivodeships) {
      const box = pathViewBox(row.path);
      expect(Number.isFinite(box.x)).toBe(true);
      expect(Number.isFinite(box.y)).toBe(true);
      expect(box.width).toBeGreaterThan(0);
      expect(box.height).toBeGreaterThan(0);
      expect(box.x).toBeGreaterThanOrEqual(-map.viewBox.width * 0.2);
      expect(box.y).toBeGreaterThanOrEqual(-map.viewBox.height * 0.2);
      expect(box.x + box.width).toBeLessThanOrEqual(map.viewBox.width * 1.2);
      expect(box.y + box.height).toBeLessThanOrEqual(map.viewBox.height * 1.2);
    }
  });
});
