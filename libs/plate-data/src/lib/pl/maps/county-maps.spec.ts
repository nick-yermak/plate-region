import { registry } from '../registry';
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

const PATH_START = /^M/;
const TERYT_COUNTY = /^\d{4}$/;
const TERYT_WARSAW_DISTRICT = /^1465(0[2-9]|1\d)_8$/;

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
