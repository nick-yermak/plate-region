import { registry } from '../registry';
import type { Region2 } from '../model';
import type { CountryMapModule } from './model';
import { countryMapModule } from './country-map-data';
import { decodeCountryMap, loadCountryMap } from './country-map';

const WROCLAW: Region2 = {
  country: 'PL',
  region1Letter: 'D',
  name: 'Wrocław',
  kind: 'city',
  suffixes: ['W', 'X'],
};

const PRIMARY_LETTERS = [
  'D',
  'C',
  'L',
  'F',
  'E',
  'K',
  'W',
  'O',
  'R',
  'B',
  'G',
  'S',
  'T',
  'N',
  'P',
  'Z',
] as const;

const PATH_GRAMMAR = /^[Mlz\d -]+$/;

function moduleWith(
  capitals: CountryMapModule['capitals'],
  voivodeships: CountryMapModule['voivodeships'] = [],
): CountryMapModule {
  return {
    viewBox: { width: 1000, height: 938 },
    outline: 'M0 0l1 0 0 1z',
    borders: 'M0 0l1 1',
    counties: [['M0 0l1 0 0 1z', 0, 0]],
    capitals,
    voivodeships,
  };
}

function decodePath(path: string): Array<readonly [number, number]> {
  expect(path).toMatch(PATH_GRAMMAR);
  const points: Array<readonly [number, number]> = [];
  let x = 0;
  let y = 0;
  for (const part of path.match(/[Mlz][^Mlz]*/g) ?? []) {
    const numbers = (part.slice(1).match(/-?\d+/g) ?? []).map(Number);
    if (part.startsWith('M')) {
      x = numbers[0] as number;
      y = numbers[1] as number;
      points.push([x, y]);
    } else {
      for (let i = 0; i < numbers.length; i += 2) {
        x += numbers[i] as number;
        y += numbers[i + 1] as number;
        points.push([x, y]);
      }
    }
  }
  return points;
}

function pathRingsAbsolute(
  path: string,
): Array<Array<readonly [number, number]>> {
  const rings: Array<Array<readonly [number, number]>> = [];
  for (const ringPath of path.match(/M[^M]*/g) ?? []) {
    const points = decodePath(ringPath);
    if (points.length < 3) continue;
    const first = points[0];
    const last = points[points.length - 1];
    if (
      first !== undefined &&
      last !== undefined &&
      first[0] === last[0] &&
      first[1] === last[1]
    ) {
      points.pop();
    }
    if (points.length >= 3) rings.push(points);
  }
  return rings;
}

function pointInRing(
  point: readonly [number, number],
  ring: ReadonlyArray<readonly [number, number]>,
): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i] as [number, number];
    const [xj, yj] = ring[j] as [number, number];
    const crosses =
      yi > point[1] !== yj > point[1] &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

/** Even-odd containment for a multi-ring SVG path. */
function pointInPathEvenOdd(
  point: readonly [number, number],
  path: string,
): boolean {
  let inside = false;
  for (const ring of pathRingsAbsolute(path)) {
    if (pointInRing(point, ring)) inside = !inside;
  }
  return inside;
}

describe('decodeCountryMap', () => {
  it('throws when the stored rows and the registry differ in length', () => {
    expect(() => decodeCountryMap(moduleWith([]), [], [])).toThrow(
      'country map has 1 counties, the registry has 0',
    );
  });

  it('throws when a capital is not a county of the map', () => {
    expect(() =>
      decodeCountryMap(moduleWith([['D', 'X']]), [WROCLAW], []),
    ).toThrow('capital DX is not a county of the map');
  });

  it('exposes the 16 voivodeship outlines in registry.region1 order', () => {
    const map = decodeCountryMap(
      countryMapModule,
      registry.region2,
      registry.region1,
    );
    expect(map.voivodeships.map((v) => v.region1Letter)).toEqual([
      ...PRIMARY_LETTERS,
    ]);
  });

  it('throws when the module has 15 voivodeship outlines', () => {
    const outlines = Array.from({ length: 15 }, () => 'M0 0l1 0 0 1z');
    expect(() =>
      decodeCountryMap(
        { ...countryMapModule, voivodeships: outlines },
        registry.region2,
        registry.region1,
      ),
    ).toThrow('country map has 15 voivodeships, the registry has 16');
  });

  it('puts every county label inside its own voivodeship and no other', async () => {
    const map = await loadCountryMap();
    const violations: string[] = [];
    for (const county of map.counties) {
      const point = [county.label.x, county.label.y] as const;
      const inside = map.voivodeships.filter((v) =>
        pointInPathEvenOdd(point, v.path),
      );
      const own = inside.filter(
        (v) => v.region1Letter === county.region1Letter,
      );
      const others = inside.filter(
        (v) => v.region1Letter !== county.region1Letter,
      );
      if (own.length !== 1 || others.length !== 0) {
        violations.push(
          `${county.region1Letter}${county.firstSuffix} own=${own.length} others=${others.map((v) => v.region1Letter).join(',')}`,
        );
      }
    }
    expect(violations).toEqual([]);
  });
});
