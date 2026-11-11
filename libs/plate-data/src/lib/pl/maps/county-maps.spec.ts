import { registry } from '../registry';
import { loadCountryMap } from './country-map';
import { warsawDistricts } from '../warsaw-districts';
import { countyMapLoaders, loadWarsawDistrictMap } from './county-maps';
import type { CountyMap, MapViewBox, WarsawDistrictMap } from './model';

const PRIMARY_LETTERS = [
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'K',
  'L',
  'N',
  'O',
  'P',
  'R',
  'S',
  'T',
  'W',
  'Z',
] as const;

const VOIVODESHIP_PREFIX: Readonly<Record<string, string>> = {
  B: '20',
  C: '04',
  D: '02',
  E: '10',
  F: '08',
  G: '22',
  K: '12',
  L: '06',
  N: '28',
  O: '16',
  P: '30',
  R: '18',
  S: '24',
  T: '26',
  W: '14',
  Z: '32',
};

async function loadAllCountyMaps(): Promise<
  ReadonlyArray<{ letter: string; map: CountyMap }>
> {
  return Promise.all(
    PRIMARY_LETTERS.map(async (letter) => ({
      letter,
      map: await countyMapLoaders[letter](),
    })),
  );
}

async function loadWarsawMap(): Promise<WarsawDistrictMap> {
  return loadWarsawDistrictMap();
}

const PATH_GRAMMAR = /^[Mlz\d -]+$/;

/** Absolute points of a path written as `M x y`, `l dx dy …` and `z`, one or more rings. */
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

function expectInsideViewBox(path: string, viewBox: MapViewBox): void {
  const points = decodePath(path);
  expect(points.length).toBeGreaterThan(0);
  for (const [x, y] of points) {
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x).toBeLessThanOrEqual(viewBox.width);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(y).toBeLessThanOrEqual(viewBox.height);
  }
}

/** Absolute path area: |Σ per-ring shoelace|, rings split by `M`. */
function pathArea(path: string): number {
  let total = 0;
  for (const ringPath of path.match(/M[^M]*/g) ?? []) {
    const points = decodePath(ringPath);
    let sum = 0;
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i] as [number, number];
      const [x2, y2] = points[(i + 1) % points.length] as [number, number];
      sum += x1 * y2 - x2 * y1;
    }
    total += sum / 2;
  }
  return Math.abs(total);
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

function signedShoelace(
  ring: ReadonlyArray<readonly [number, number]>,
): number {
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i] as [number, number];
    const [x2, y2] = ring[(i + 1) % ring.length] as [number, number];
    sum += x1 * y2 - x2 * y1;
  }
  return sum / 2;
}

function outerRingsOf(
  rings: ReadonlyArray<ReadonlyArray<readonly [number, number]>>,
): Array<ReadonlyArray<readonly [number, number]>> {
  let dominantSign = 0;
  let largestAbs = -1;
  for (const ring of rings) {
    const area = signedShoelace(ring);
    const abs = Math.abs(area);
    if (abs > largestAbs) {
      largestAbs = abs;
      dominantSign = Math.sign(area);
    }
  }
  return rings.filter(
    (ring) => Math.sign(signedShoelace(ring)) === dominantSign,
  );
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

function labelOnNonLargestOuterRatio(
  path: string,
  label: { readonly x: number; readonly y: number },
): number | undefined {
  const outers = outerRingsOf(pathRingsAbsolute(path));
  if (outers.length <= 1) return undefined;
  let maxAbs = 0;
  let labelAbs = 0;
  let found = false;
  for (const ring of outers) {
    const abs = Math.abs(signedShoelace(ring));
    if (abs > maxAbs) maxAbs = abs;
    if (pointInRing([label.x, label.y], ring)) {
      labelAbs = abs;
      found = true;
    }
  }
  if (!found || maxAbs === 0) return undefined;
  const ratio = labelAbs / maxAbs;
  if (ratio >= 1) return undefined;
  return Math.round(ratio * 10_000) / 10_000;
}

async function multiPartLabelsOffLargest(): Promise<Record<string, number>> {
  const misses: Record<string, number> = {};
  const record = (
    map: string,
    code: string,
    ratio: number | undefined,
  ): void => {
    if (ratio === undefined) return;
    misses[`${map}:${code}`] = ratio;
  };
  for (const { letter, map } of await loadAllCountyMaps()) {
    for (const county of map.counties) {
      record(
        letter,
        county.region1Letter + county.firstSuffix,
        labelOnNonLargestOuterRatio(county.path, county.label),
      );
    }
  }
  const warsaw = await loadWarsawMap();
  for (const district of warsaw.districts) {
    record(
      'W-districts',
      district.name,
      labelOnNonLargestOuterRatio(district.path, district.label),
    );
  }
  const country = await loadCountryMap();
  for (const county of country.counties) {
    record(
      'country',
      county.region1Letter + county.firstSuffix,
      labelOnNonLargestOuterRatio(county.path, county.label),
    );
  }
  return misses;
}

/** Distinct vertices: per ring, drop the closing duplicate when last equals first. */
function ringVertexCount(path: string): number {
  let total = 0;
  for (const ringPath of path.match(/M[^M]*/g) ?? []) {
    const points = decodePath(ringPath);
    const first = points[0];
    const last = points[points.length - 1];
    if (first === undefined || last === undefined) continue;
    if (first[0] === last[0] && first[1] === last[1]) {
      total += points.length - 1;
    } else {
      total += points.length;
    }
  }
  return total;
}

const PATH_START = /^M/;
const TERYT_COUNTY = /^\d{4}$/;
const TERYT_WARSAW_DISTRICT = /^1465(0[2-9]|1\d)_8$/;

/** Literal label points pin the row order of the stored map: a misplaced row would carry another county's point. */
const CAPITAL_LABELS = [
  ['D', 'W', 295, 590],
  ['C', 'B', 396, 295],
  ['C', 'T', 444, 310],
  ['L', 'U', 808, 568],
  ['F', 'G', 138, 344],
  ['F', 'Z', 159, 460],
  ['E', 'L', 524, 495],
  ['K', 'R', 567, 753],
  ['W', 'A', 665, 430],
  ['O', 'P', 377, 659],
  ['R', 'Z', 765, 751],
  ['B', 'I', 848, 282],
  ['G', 'D', 445, 112],
  ['S', 'K', 480, 725],
  ['T', 'K', 628, 629],
  ['N', 'O', 607, 196],
  ['P', 'O', 292, 403],
  ['Z', 'S', 87, 236],
] as const;

describe('county maps', () => {
  it('has one loader per voivodeship, keyed by its primary letter', () => {
    expect(Object.keys(countyMapLoaders).sort()).toEqual([
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'K',
      'L',
      'N',
      'O',
      'P',
      'R',
      'S',
      'T',
      'W',
      'Z',
    ]);
  });

  it('lists the counties of each voivodeship in registry order', async () => {
    for (const r of registry.region1) {
      const map = await countyMapLoaders[r.letters[0]]();
      expect(map.counties.map((c) => c.region1Letter + c.firstSuffix)).toEqual(
        registry.region2
          .filter((c) => c.region1Letter === r.letters[0])
          .map((c) => c.region1Letter + c.suffixes[0]),
      );
    }
  });

  it('gives the 380 counties unique TERYT codes starting with their voivodeship prefix', async () => {
    const loaded = await loadAllCountyMaps();
    const counties = loaded.flatMap(({ map }) => map.counties);
    expect(counties).toHaveLength(380);
    expect(new Set(counties.map((c) => c.teryt)).size).toBe(380);
    for (const county of counties) {
      expect(county.teryt).toMatch(TERYT_COUNTY);
    }
    for (const { letter, map } of loaded) {
      for (const county of map.counties) {
        expect(county.teryt.slice(0, 2)).toBe(VOIVODESHIP_PREFIX[letter]);
      }
    }
  });

  it('keeps the PRG codes of known counties', async () => {
    const d = await countyMapLoaders['D']();
    const w = await countyMapLoaders['W']();
    expect(
      d.counties.find((c) => c.region1Letter === 'D' && c.firstSuffix === 'BL')
        ?.teryt,
    ).toBe('0201');
    expect(
      d.counties.find((c) => c.region1Letter === 'D' && c.firstSuffix === 'W')
        ?.teryt,
    ).toBe('0264');
    expect(
      w.counties.find((c) => c.region1Letter === 'W' && c.firstSuffix === 'A')
        ?.teryt,
    ).toBe('1465');
  });

  it('draws every county inside its view box', async () => {
    const loaded = await loadAllCountyMaps();
    for (const { map } of loaded) {
      expect(map.viewBox.width).toBe(1000);
      expect(map.viewBox.height).toBe(Math.round(map.viewBox.height));
      expect(map.viewBox.height).toBeGreaterThan(0);
      expect(map.outline).toMatch(PATH_START);
      expect(map.neighbours.length).toBeGreaterThan(0);
      expectInsideViewBox(map.outline, map.viewBox);
      for (const neighbour of map.neighbours) {
        expectInsideViewBox(neighbour, map.viewBox);
      }
      for (const county of map.counties) {
        expect(county.path).toMatch(PATH_START);
        expectInsideViewBox(county.path, map.viewBox);
        expect(county.label.x).toBeGreaterThanOrEqual(0);
        expect(county.label.x).toBeLessThanOrEqual(map.viewBox.width);
        expect(county.label.y).toBeGreaterThanOrEqual(0);
        expect(county.label.y).toBeLessThanOrEqual(map.viewBox.height);
        expect(county.label.radius).toBeGreaterThan(0);
      }
    }
  });

  it('puts the label of every multi-part county on its largest part', async () => {
    expect(await multiPartLabelsOffLargest()).toEqual({});
  });

  it('removes the internal sea waters from the coastal counties of Pomeranian', async () => {
    const map = await countyMapLoaders['G']();
    const byCode = new Map(
      map.counties.map((c) => [`${c.region1Letter}${c.firstSuffix}`, c]),
    );
    const gka = byCode.get('GKA');
    if (gka === undefined) throw new Error('GKA missing');
    const base = pathArea(gka.path);
    const ratios = Object.fromEntries(
      (['GKS', 'GPU', 'GD', 'GA'] as const).map((code) => {
        const county = byCode.get(code);
        if (county === undefined) throw new Error(`${code} missing`);
        return [code, Math.round((pathArea(county.path) / base) * 100) / 100];
      }),
    );
    expect(ratios).toEqual({ GKS: 1.04, GPU: 0.52, GD: 0.24, GA: 0.12 });
  });

  it('maps the 18 Warsaw districts named in D-57', async () => {
    const map = await loadWarsawMap();
    expect(map.districts).toHaveLength(18);
    expect(map.districts.map((d) => d.name).sort()).toEqual(
      [
        ...new Set(
          warsawDistricts.rows.flatMap((row) =>
            row.districts.map((d) => d.value),
          ),
        ),
      ].sort(),
    );
    expect(new Set(map.districts.map((d) => d.teryt)).size).toBe(18);
    for (const district of map.districts) {
      expect(district.teryt).toMatch(TERYT_WARSAW_DISTRICT);
    }
  });

  it('draws every Warsaw district inside its view box', async () => {
    const map = await loadWarsawMap();
    expect(map.viewBox.width).toBe(1000);
    expect(map.viewBox.height).toBe(Math.round(map.viewBox.height));
    expect(map.viewBox.height).toBeGreaterThan(0);
    expect(map.outline).toMatch(PATH_START);
    expect(map.neighbours.length).toBeGreaterThan(0);
    expectInsideViewBox(map.outline, map.viewBox);
    for (const neighbour of map.neighbours) {
      expectInsideViewBox(neighbour, map.viewBox);
    }
    for (const district of map.districts) {
      expect(district.path).toMatch(PATH_START);
      expectInsideViewBox(district.path, map.viewBox);
      expect(district.label.x).toBeGreaterThanOrEqual(0);
      expect(district.label.x).toBeLessThanOrEqual(map.viewBox.width);
      expect(district.label.y).toBeGreaterThanOrEqual(0);
      expect(district.label.y).toBeLessThanOrEqual(map.viewBox.height);
      expect(district.label.radius).toBeGreaterThan(0);
    }
  });
});

describe('country map', () => {
  it('decodes the 380 counties in registry order', async () => {
    const map = await loadCountryMap();
    expect(map.counties).toHaveLength(380);
    expect(map.counties.map((c) => c.region1Letter + c.firstSuffix)).toEqual(
      registry.region2.map((r) => r.region1Letter + r.suffixes[0]),
    );
  });

  it('keeps the label points of the 18 voivodeship capitals', async () => {
    const map = await loadCountryMap();
    expect(
      CAPITAL_LABELS.map(([letter, suffix]) => {
        const county = map.counties.find(
          (c) => c.region1Letter === letter && c.firstSuffix === suffix,
        );
        return [letter, suffix, county?.label.x, county?.label.y];
      }),
    ).toEqual(CAPITAL_LABELS);
  });

  it('lists the 18 voivodeship capitals in registry order with their county label points', async () => {
    const map = await loadCountryMap();
    expect(
      map.capitals.map((c) => [
        c.region1Letter,
        c.firstSuffix,
        c.label.x,
        c.label.y,
      ]),
    ).toEqual(CAPITAL_LABELS);
  });

  it('draws the outline, the borders and every county inside a 1000 by 938 view box', async () => {
    const map = await loadCountryMap();
    expect(map.viewBox).toEqual({ width: 1000, height: 938 });
    expect(map.outline).toMatch(PATH_START);
    expectInsideViewBox(map.outline, map.viewBox);
    expect(map.borders).toMatch(PATH_START);
    expectInsideViewBox(map.borders, map.viewBox);
    for (const county of map.counties) {
      expect(county.path).toMatch(PATH_START);
      expectInsideViewBox(county.path, map.viewBox);
      expect(county.label.x).toBeGreaterThanOrEqual(0);
      expect(county.label.x).toBeLessThanOrEqual(1000);
      expect(county.label.y).toBeGreaterThanOrEqual(0);
      expect(county.label.y).toBeLessThanOrEqual(938);
    }
  });

  it('stores integer label points', async () => {
    const map = await loadCountryMap();
    for (const county of map.counties) {
      expect(county.label.x).toBe(Math.round(county.label.x));
      expect(county.label.y).toBe(Math.round(county.label.y));
    }
  });

  it('keeps at least 5 vertices per county', async () => {
    const map = await loadCountryMap();
    const fewest = Math.min(
      ...map.counties.map((c) => ringVertexCount(c.path)),
    );
    expect(fewest).toBeGreaterThanOrEqual(5);
  });
});
