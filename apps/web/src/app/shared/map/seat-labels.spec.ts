import {
  countyMapLoaders,
  countySeat,
  fullCodes,
  loadCountryMap,
  loadWarsawDistrictMap,
  registry,
  warsawDistricts,
  type CountyMap,
  type MapViewBox,
  type Region1,
  type WarsawDistrictMap,
} from '@plate-region/plate-data';

import {
  boxesOverlap,
  NARROW,
  placeSeatLabels,
  seatDotBox,
  seatLabelBox,
  WIDE,
  type SeatLabelArea,
  type SeatLabelPlacement,
  type SeatLabelPosition,
  type SeatLabelTier,
  type SeatLabelTierConfig,
} from './seat-labels';

function region1ByLetter(letter: string): Region1 {
  const found = registry.region1.find((region) => region.letters[0] === letter);
  if (found === undefined) {
    throw new Error(`no region1 ${letter}`);
  }
  return found;
}

function visibleText(
  area: SeatLabelArea,
  tier: SeatLabelTier,
): string | undefined {
  if (tier === 'full') {
    return area.fullText;
  }
  if (tier === 'code') {
    return area.codeText;
  }
  return undefined;
}

function overlapViolations(
  areas: readonly SeatLabelArea[],
  viewBox: MapViewBox,
  tier: SeatLabelTierConfig,
  placement: ReadonlyMap<string, SeatLabelPlacement>,
): string[] {
  const scale = tier.mapPx / Math.max(viewBox.width, viewBox.height);
  const visible: { id: string; box: ReturnType<typeof seatLabelBox> }[] = [];
  const violations: string[] = [];
  for (const area of areas) {
    const placed = placement.get(area.id) ?? {
      tier: 'none',
      position: 'above',
      forced: false,
      slideDx: 0,
    };
    const text = visibleText(area, placed.tier);
    if (text === undefined) {
      continue;
    }
    const box = seatLabelBox(
      text,
      area.x * scale,
      area.y * scale,
      tier.fontPx,
      placed.position,
      area.markerExtent,
      placed.slideDx,
    );
    // Only a forced selected code may meet a foreign tip.
    if (!placed.forced) {
      for (const other of areas) {
        if (other.id === area.id) {
          continue;
        }
        const obstacle = seatDotBox(other.x * scale, other.y * scale);
        if (boxesOverlap(box, obstacle)) {
          violations.push(`${area.id} label overlaps dot ${other.id}`);
        }
      }
    }
    for (const prior of visible) {
      if (boxesOverlap(box, prior.box)) {
        violations.push(`${area.id} label overlaps label ${prior.id}`);
      }
    }
    visible.push({ id: area.id, box });
  }
  return violations;
}

const capitalIdsByLetter = new Map<string, ReadonlySet<string>>();

function capitalIdsFor(letter: string): ReadonlySet<string> {
  return capitalIdsByLetter.get(letter) ?? new Set();
}

async function ensureCapitals(): Promise<void> {
  if (capitalIdsByLetter.size > 0) {
    return;
  }
  const country = await loadCountryMap();
  for (const region1 of registry.region1) {
    const letter = region1.letters[0];
    const ids = new Set<string>();
    for (const capital of country.capitals) {
      if (capital.region1Letter !== letter) {
        continue;
      }
      const region2 = registry.region2.find(
        (row) =>
          row.region1Letter === letter &&
          row.suffixes[0] === capital.firstSuffix,
      );
      if (region2 === undefined) {
        throw new Error(
          `no region2 for capital ${letter}${capital.firstSuffix}`,
        );
      }
      ids.add(fullCodes(region1, region2)[0]);
    }
    capitalIdsByLetter.set(letter, ids);
  }
}

function voivodeshipSeatAreas(
  map: CountyMap,
  region1: Region1,
  selectedId: string | undefined,
): SeatLabelArea[] {
  const capitals = capitalIdsFor(region1.letters[0]);
  return map.counties.map((county) => {
    const region2 = registry.region2.find(
      (row) =>
        row.region1Letter === region1.letters[0] &&
        row.suffixes[0] === county.firstSuffix,
    );
    if (region2 === undefined) {
      throw new Error(
        `no region2 for ${region1.letters[0]}${county.firstSuffix}`,
      );
    }
    const codes = fullCodes(region1, region2) as [string, ...string[]];
    const codeText = codes[0];
    return {
      id: codeText,
      x: county.label.x,
      y: county.label.y,
      radius: county.label.radius,
      fullText: `${countySeat(region2)} (${codeText})`,
      codeText,
      selected: selectedId === codeText,
      capital: capitals.has(codeText),
    };
  });
}

async function warsawSeatAreas(selectedId: string | undefined): Promise<{
  areas: SeatLabelArea[];
  viewBox: MapViewBox;
}> {
  const map: WarsawDistrictMap = await loadWarsawDistrictMap();
  const region1 = region1ByLetter('W');
  const areas = map.districts.map((district) => {
    const row = warsawDistricts.rows.find((entry) =>
      entry.districts.some((item) => item.value === district.name),
    );
    if (row === undefined) {
      throw new Error(`no Warsaw row for ${district.name}`);
    }
    const codeText = `${region1.letters[0]}${row.suffix}`;
    return {
      id: district.name,
      x: district.label.x,
      y: district.label.y,
      radius: district.label.radius,
      fullText: `${district.name} (${codeText})`,
      codeText,
      selected: selectedId === district.name,
      capital: false,
    };
  });
  return { areas, viewBox: map.viewBox };
}

function countTiers(placement: ReadonlyMap<string, SeatLabelPlacement>): {
  full: number;
  code: number;
  none: number;
} {
  let full = 0;
  let code = 0;
  let none = 0;
  for (const placed of placement.values()) {
    if (placed.tier === 'full') {
      full += 1;
    } else if (placed.tier === 'code') {
      code += 1;
    } else {
      none += 1;
    }
  }
  return { full, code, none };
}

function countPositions(
  placement: ReadonlyMap<string, SeatLabelPlacement>,
): Record<SeatLabelPosition, number> {
  const counts: Record<SeatLabelPosition, number> = {
    above: 0,
    below: 0,
    right: 0,
    left: 0,
  };
  for (const placed of placement.values()) {
    if (placed.tier !== 'none') {
      counts[placed.position] += 1;
    }
  }
  return counts;
}

describe('placeSeatLabels', () => {
  beforeAll(async () => {
    await ensureCapitals();
  });

  it('G module at WIDE: GMB is full with Malbork (GMB)', async () => {
    const map = await countyMapLoaders['G']();
    const region1 = region1ByLetter('G');
    const areas = voivodeshipSeatAreas(map, region1, undefined);
    const gmb = areas.find((area) => area.id === 'GMB');
    expect(gmb?.fullText).toBe('Malbork (GMB)');
    const placement = placeSeatLabels(areas, map.viewBox, WIDE);
    expect(placement.get('GMB')?.tier).toBe('full');
  });

  it('no visible label boxes overlap each other or another area dot', async () => {
    const violations: string[] = [];
    for (const letter of Object.keys(countyMapLoaders).sort()) {
      const loader = countyMapLoaders[letter];
      if (loader === undefined) {
        throw new Error(`no loader for ${letter}`);
      }
      const map = await loader();
      const region1 = region1ByLetter(letter);
      const base = voivodeshipSeatAreas(map, region1, undefined);
      const selectedIds = [undefined, ...base.map((area) => area.id)];
      for (const selectedId of selectedIds) {
        const areas = voivodeshipSeatAreas(map, region1, selectedId);
        for (const tier of [NARROW, WIDE] as const) {
          const placement = placeSeatLabels(areas, map.viewBox, tier);
          violations.push(
            ...overlapViolations(areas, map.viewBox, tier, placement),
          );
        }
      }
    }
    const warsaw = await warsawSeatAreas(undefined);
    const warsawSelected = [undefined, ...warsaw.areas.map((a) => a.id)];
    for (const selectedId of warsawSelected) {
      const { areas, viewBox } = await warsawSeatAreas(selectedId);
      for (const tier of [NARROW, WIDE] as const) {
        const placement = placeSeatLabels(areas, viewBox, tier);
        violations.push(...overlapViolations(areas, viewBox, tier, placement));
      }
    }
    expect(violations).toEqual([]);
  });

  it('selected area is full or code, never none, for all 380 counties at both tiers', async () => {
    const bad: string[] = [];
    for (const letter of Object.keys(countyMapLoaders).sort()) {
      const loader = countyMapLoaders[letter];
      if (loader === undefined) {
        throw new Error(`no loader for ${letter}`);
      }
      const map = await loader();
      const region1 = region1ByLetter(letter);
      const ids = voivodeshipSeatAreas(map, region1, undefined).map(
        (a) => a.id,
      );
      for (const selectedId of ids) {
        const areas = voivodeshipSeatAreas(map, region1, selectedId);
        for (const tier of [NARROW, WIDE] as const) {
          const placement = placeSeatLabels(areas, map.viewBox, tier);
          const choice = placement.get(selectedId)?.tier;
          if (choice !== 'full' && choice !== 'code') {
            bad.push(`${selectedId}@${tier.mapPx}=${String(choice)}`);
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('totals over 380 counties and Warsaw match the regression table', async () => {
    let wideFull = 0;
    let wideCode = 0;
    let wideNone = 0;
    let narrowFull = 0;
    let narrowCode = 0;
    let narrowNone = 0;
    for (const letter of Object.keys(countyMapLoaders).sort()) {
      const loader = countyMapLoaders[letter];
      if (loader === undefined) {
        throw new Error(`no loader for ${letter}`);
      }
      const map = await loader();
      const region1 = region1ByLetter(letter);
      const areas = voivodeshipSeatAreas(map, region1, undefined);
      const wide = countTiers(placeSeatLabels(areas, map.viewBox, WIDE));
      const narrow = countTiers(placeSeatLabels(areas, map.viewBox, NARROW));
      wideFull += wide.full;
      wideCode += wide.code;
      wideNone += wide.none;
      narrowFull += narrow.full;
      narrowCode += narrow.code;
      narrowNone += narrow.none;
    }
    // Literals filled from the first green run (four positions).
    expect({ full: wideFull, code: wideCode, none: wideNone }).toEqual({
      full: 319,
      code: 53,
      none: 8,
    });
    expect({ full: narrowFull, code: narrowCode, none: narrowNone }).toEqual({
      full: 173,
      code: 151,
      none: 56,
    });

    const warsaw = await warsawSeatAreas(undefined);
    expect(
      countTiers(placeSeatLabels(warsaw.areas, warsaw.viewBox, WIDE)),
    ).toEqual({ full: 18, code: 0, none: 0 });
    expect(
      countTiers(placeSeatLabels(warsaw.areas, warsaw.viewBox, NARROW)),
    ).toEqual({ full: 13, code: 5, none: 0 });
  });

  it('every visible label box clears its own dot square', async () => {
    const violations: string[] = [];
    for (const letter of Object.keys(countyMapLoaders).sort()) {
      const loader = countyMapLoaders[letter];
      if (loader === undefined) {
        throw new Error(`no loader for ${letter}`);
      }
      const map = await loader();
      const region1 = region1ByLetter(letter);
      const areas = voivodeshipSeatAreas(map, region1, undefined);
      for (const tier of [NARROW, WIDE] as const) {
        const placement = placeSeatLabels(areas, map.viewBox, tier);
        const scale =
          tier.mapPx / Math.max(map.viewBox.width, map.viewBox.height);
        for (const area of areas) {
          const placed = placement.get(area.id) ?? {
            tier: 'none' as const,
            position: 'above' as const,
            forced: false,
            slideDx: 0,
          };
          const text = visibleText(area, placed.tier);
          if (text === undefined) {
            continue;
          }
          const cx = area.x * scale;
          const cy = area.y * scale;
          const box = seatLabelBox(text, cx, cy, tier.fontPx, placed.position);
          const own = seatDotBox(cx, cy);
          if (boxesOverlap(box, own)) {
            violations.push(
              `${area.id}@${tier.mapPx}@${placed.position} overlaps own dot`,
            );
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('forced label counts over 380 selected counties match the regression table', async () => {
    const wideForced: string[] = [];
    const narrowForced: string[] = [];
    for (const letter of Object.keys(countyMapLoaders).sort()) {
      const loader = countyMapLoaders[letter];
      if (loader === undefined) {
        throw new Error(`no loader for ${letter}`);
      }
      const map = await loader();
      const region1 = region1ByLetter(letter);
      const ids = voivodeshipSeatAreas(map, region1, undefined).map(
        (a) => a.id,
      );
      for (const selectedId of ids) {
        const areas = voivodeshipSeatAreas(map, region1, selectedId);
        for (const [tier, bag] of [
          [WIDE, wideForced],
          [NARROW, narrowForced],
        ] as const) {
          const placement = placeSeatLabels(areas, map.viewBox, tier);
          if (placement.get(selectedId)?.forced === true) {
            bag.push(selectedId);
          }
        }
      }
    }
    // Literals filled from the first green run.
    expect({ count: wideForced.length, codes: wideForced }).toEqual({
      count: 2,
      codes: ['SH', 'SW'],
    });
    expect({ count: narrowForced.length, codes: narrowForced }).toEqual({
      count: 19,
      codes: [
        'PCH',
        'PGS',
        'PLE',
        'PSE',
        'SY',
        'SH',
        'SK',
        'SM',
        'SRS',
        'SI',
        'SW',
        'ST',
        'SZ',
        'SZO',
        'SMI',
        'WGM',
        'WPI',
        'WPR',
        'WSI',
      ],
    });
  });

  it('the 18 capitals match the regression table with no selection', async () => {
    const country = await loadCountryMap();
    const table: Record<
      string,
      { wide: SeatLabelTier; narrow: SeatLabelTier }
    > = {};
    for (const capital of country.capitals) {
      const letter = capital.region1Letter;
      const loader = countyMapLoaders[letter];
      if (loader === undefined) {
        throw new Error(`no loader for ${letter}`);
      }
      const map = await loader();
      const region1 = region1ByLetter(letter);
      const areas = voivodeshipSeatAreas(map, region1, undefined);
      const region2 = registry.region2.find(
        (row) =>
          row.region1Letter === letter &&
          row.suffixes[0] === capital.firstSuffix,
      );
      if (region2 === undefined) {
        throw new Error(
          `no region2 for capital ${letter}${capital.firstSuffix}`,
        );
      }
      const id = fullCodes(region1, region2)[0];
      const wide = placeSeatLabels(areas, map.viewBox, WIDE).get(id)?.tier;
      const narrow = placeSeatLabels(areas, map.viewBox, NARROW).get(id)?.tier;
      table[id] = {
        wide: wide ?? 'none',
        narrow: narrow ?? 'none',
      };
    }
    // Literals filled from the first green run.
    expect(table).toEqual({
      DW: { wide: 'full', narrow: 'full' },
      CB: { wide: 'full', narrow: 'full' },
      CT: { wide: 'full', narrow: 'full' },
      LU: { wide: 'full', narrow: 'full' },
      FG: { wide: 'full', narrow: 'full' },
      FZ: { wide: 'full', narrow: 'full' },
      EL: { wide: 'full', narrow: 'full' },
      KR: { wide: 'full', narrow: 'full' },
      WA: { wide: 'full', narrow: 'code' },
      OP: { wide: 'full', narrow: 'full' },
      RZ: { wide: 'full', narrow: 'code' },
      BI: { wide: 'full', narrow: 'full' },
      GD: { wide: 'full', narrow: 'full' },
      SK: { wide: 'code', narrow: 'none' },
      TK: { wide: 'full', narrow: 'full' },
      NO: { wide: 'full', narrow: 'full' },
      PO: { wide: 'full', narrow: 'code' },
      ZS: { wide: 'full', narrow: 'full' },
    });
  });

  it('label position counts match the regression table with no selection', async () => {
    const wideCounts: Record<SeatLabelPosition, number> = {
      above: 0,
      below: 0,
      right: 0,
      left: 0,
    };
    const narrowCounts: Record<SeatLabelPosition, number> = {
      above: 0,
      below: 0,
      right: 0,
      left: 0,
    };
    for (const letter of Object.keys(countyMapLoaders).sort()) {
      const loader = countyMapLoaders[letter];
      if (loader === undefined) {
        throw new Error(`no loader for ${letter}`);
      }
      const map = await loader();
      const region1 = region1ByLetter(letter);
      const areas = voivodeshipSeatAreas(map, region1, undefined);
      const wide = countPositions(placeSeatLabels(areas, map.viewBox, WIDE));
      const narrow = countPositions(
        placeSeatLabels(areas, map.viewBox, NARROW),
      );
      for (const key of Object.keys(wideCounts) as SeatLabelPosition[]) {
        wideCounts[key] += wide[key];
        narrowCounts[key] += narrow[key];
      }
    }
    // Literals filled from the first green run.
    expect(wideCounts).toEqual({
      above: 248,
      below: 70,
      right: 29,
      left: 25,
    });
    expect(narrowCounts).toEqual({
      above: 166,
      below: 78,
      right: 47,
      left: 33,
    });
  });

  it.each([
    {
      name: '328/11',
      tier: { mapPx: 328, fontPx: 11 },
      expected: {
        capitals: { full: 5817, code: 977, none: 46 },
        selected: { full: 272, code: 104, forced: 4 },
      },
    },
    {
      name: '541/12',
      tier: { mapPx: 541, fontPx: 12 },
      expected: {
        capitals: { full: 6767, code: 67, none: 6 },
        selected: { full: 373, code: 7, forced: 0 },
      },
    },
  ] as const)(
    'country map totals match the stage 4 probe at $name',
    async ({ tier, expected }) => {
      const country = await loadCountryMap();
      const capitalIds = country.capitals.map(
        (c) => `${c.region1Letter}${c.firstSuffix}`,
      );
      type CountryPlaceOptions = {
        readonly capitalOrder: 'shortest-full';
        readonly horizontalClamp: boolean;
      };
      const options: CountryPlaceOptions = {
        capitalOrder: 'shortest-full',
        horizontalClamp: true,
      };

      let capitalsFull = 0;
      let capitalsCode = 0;
      let capitalsNone = 0;
      let selectedFull = 0;
      let selectedCode = 0;
      let selectedForced = 0;
      for (const selected of registry.region2) {
        const selectedId = `${selected.region1Letter}${selected.suffixes[0]}`;
        const selectedCounty = country.counties.find(
          (c) => `${c.region1Letter}${c.firstSuffix}` === selectedId,
        );
        if (selectedCounty === undefined) {
          throw new Error(`no county ${selectedId}`);
        }
        const capitalSet = new Set(capitalIds);
        const areas: SeatLabelArea[] = [];
        const push = (
          county: (typeof country.counties)[number],
          opts: {
            selected: boolean;
            capital: boolean;
            markerExtent: number;
          },
        ) => {
          const region1 = region1ByLetter(county.region1Letter);
          const region2 = registry.region2.find(
            (r) =>
              r.region1Letter === county.region1Letter &&
              r.suffixes[0] === county.firstSuffix,
          );
          if (region2 === undefined) {
            throw new Error(`no region2 for ${county.region1Letter}`);
          }
          const codeText = fullCodes(region1, region2)[0];
          areas.push({
            id: codeText,
            x: county.label.x,
            y: county.label.y,
            radius: 0,
            fullText: `${countySeat(region2)} (${codeText})`,
            codeText,
            selected: opts.selected,
            capital: opts.capital,
            markerExtent: opts.markerExtent,
          } as SeatLabelArea);
        };
        if (capitalSet.has(selectedId)) {
          for (const capital of country.capitals) {
            const id = `${capital.region1Letter}${capital.firstSuffix}`;
            push(capital, {
              selected: id === selectedId,
              capital: true,
              markerExtent: id === selectedId ? 9 : 7,
            });
          }
        } else {
          push(selectedCounty, {
            selected: true,
            capital: false,
            markerExtent: 9,
          });
          for (const capital of country.capitals) {
            push(capital, {
              selected: false,
              capital: true,
              markerExtent: 7,
            });
          }
        }
        const placement = (
          placeSeatLabels as (
            areas: readonly SeatLabelArea[],
            viewBox: MapViewBox,
            tierConfig: { readonly mapPx: number; readonly fontPx: number },
            opts?: CountryPlaceOptions,
          ) => ReadonlyMap<string, SeatLabelPlacement>
        )(areas, country.viewBox, tier, options);
        const sel = placement.get(selectedId);
        if (sel === undefined) {
          throw new Error(`no placement ${selectedId}`);
        }
        if (sel.tier === 'full') {
          selectedFull += 1;
        } else if (sel.forced) {
          selectedForced += 1;
        } else if (sel.tier === 'code') {
          selectedCode += 1;
        } else {
          selectedForced += 1;
        }
        for (const id of capitalIds) {
          const p = placement.get(id);
          if (p === undefined) {
            throw new Error(`no capital ${id}`);
          }
          if (p.tier === 'full') {
            capitalsFull += 1;
          } else if (p.tier === 'code') {
            capitalsCode += 1;
          } else {
            capitalsNone += 1;
          }
        }
      }
      expect({
        capitals: {
          full: capitalsFull,
          code: capitalsCode,
          none: capitalsNone,
        },
        selected: {
          full: selectedFull,
          code: selectedCode,
          forced: selectedForced,
        },
      }).toEqual(expected);
    },
  );
});
