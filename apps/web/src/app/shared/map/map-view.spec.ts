import {
  countyMapLoaders,
  loadCountryMap,
  loadWarsawDistrictMap,
  registry,
  type CountryMap,
  type Region1,
  type Region2,
} from '@plate-region/plate-data';

import { INTER_600_ADVANCES } from './map-labels';
import { countryMapView, voivodeshipMapView, warsawMapView } from './map-view';

function region1ByLetter(letter: string): Region1 {
  const found = registry.region1.find((region) => region.letters[0] === letter);
  if (found === undefined) {
    throw new Error(`no region1 with letter ${letter}`);
  }
  return found;
}

function region2ByName(name: string, region1Letter: string): Region2 {
  const found = registry.region2.find(
    (region) => region.name === name && region.region1Letter === region1Letter,
  );
  if (found === undefined) {
    throw new Error(`no region2 ${name} under ${region1Letter}`);
  }
  return found;
}

type TestBox = {
  readonly x: number;
  readonly y: number;
  readonly hw: number;
  readonly hh: number;
};

type TestLabel = {
  readonly code: string;
  readonly x: number;
  readonly y: number;
  readonly wideOnly: boolean;
  readonly aboveMarker: boolean;
};

function emSize(code: string): { width: number; height: number } {
  let sum = 0;
  for (const ch of code) {
    const advance = INTER_600_ADVANCES[ch];
    if (advance === undefined) {
      throw new Error(`no advance for ${ch}`);
    }
    sum += advance;
  }
  return { width: sum / 2048, height: 1490 / 2048 };
}

function centeredBox(
  code: string,
  x: number,
  y: number,
  mapWidthPx: number,
  fontPx: number,
): TestBox {
  const em = emSize(code);
  const scale = 1000 / mapWidthPx;
  const wPx = em.width * fontPx + 3;
  const hPx = em.height * fontPx + 3;
  return { x, y, hw: (wPx * scale) / 2, hh: (hPx * scale) / 2 };
}

function selectedBoxes(
  code: string,
  x: number,
  y: number,
  mapWidthPx: number,
  fontPx: number,
): readonly [TestBox, TestBox] {
  const em = emSize(code);
  const scale = 1000 / mapWidthPx;
  const ringHalf = 9 * scale;
  const wPx = em.width * fontPx + 3;
  const hPx = em.height * fontPx + 3;
  const labelCenterY = y - (12 + (em.height * fontPx) / 2) * scale;
  return [
    { x, y, hw: ringHalf, hh: ringHalf },
    { x, y: labelCenterY, hw: (wPx * scale) / 2, hh: (hPx * scale) / 2 },
  ];
}

function boxesOf(
  label: TestLabel,
  mapWidthPx: number,
  fontPx: number,
): readonly TestBox[] {
  if (label.aboveMarker) {
    return selectedBoxes(label.code, label.x, label.y, mapWidthPx, fontPx);
  }
  return [centeredBox(label.code, label.x, label.y, mapWidthPx, fontPx)];
}

function boxesOverlap(a: TestBox, b: TestBox): boolean {
  return Math.abs(a.x - b.x) < a.hw + b.hw && Math.abs(a.y - b.y) < a.hh + b.hh;
}

function labelsOverlap(
  a: TestLabel,
  b: TestLabel,
  mapWidthPx: number,
  fontPx: number,
): boolean {
  return boxesOf(a, mapWidthPx, fontPx).some((boxA) =>
    boxesOf(b, mapWidthPx, fontPx).some((boxB) => boxesOverlap(boxA, boxB)),
  );
}

describe('map-view', () => {
  it('labels 248 of the 380 counties', async () => {
    const expected: Record<string, number> = {
      D: 17,
      C: 17,
      L: 18,
      F: 12,
      E: 19,
      K: 20,
      W: 10,
      O: 11,
      R: 19,
      B: 14,
      G: 17,
      S: 13,
      T: 14,
      N: 17,
      P: 11,
      Z: 19,
    };
    const actual: Record<string, number> = {};
    for (const [letter, load] of Object.entries(countyMapLoaders)) {
      const map = await load();
      const view = voivodeshipMapView(
        map,
        region1ByLetter(letter),
        undefined,
        'en',
      );
      actual[letter] = view.areas.filter((area) => area.label.visible).length;
    }
    expect(actual).toEqual(expected);
  });

  it('labels all 18 Warsaw districts with their W codes', async () => {
    const map = await loadWarsawDistrictMap();
    const view = warsawMapView(map, region1ByLetter('W'), ['Mokotów'], 'en');
    expect(view.areas.filter((area) => area.label.visible)).toHaveLength(18);
    expect(view.areas.find((area) => area.id === 'Mokotów')?.label.text).toBe(
      'WE',
    );
    expect(view.areas.find((area) => area.id === 'Wilanów')?.label.text).toBe(
      'WW',
    );
    expect(view.areas.find((area) => area.id === 'Żoliborz')?.label.text).toBe(
      'WX',
    );
  });

  it('fills only Wrocław on the Lower Silesian map', async () => {
    const map = await countyMapLoaders['D']();
    const view = voivodeshipMapView(
      map,
      region1ByLetter('D'),
      region2ByName('Wrocław', 'D'),
      'en',
    );
    expect(
      view.areas.filter((area) => area.filled).map((area) => area.id),
    ).toEqual(['DW']);
  });

  it('gives Wrocław its codes, heading and table link', async () => {
    const map = await countyMapLoaders['D']();
    const view = voivodeshipMapView(
      map,
      region1ByLetter('D'),
      region2ByName('Wrocław', 'D'),
      'en',
    );
    const area = view.areas.find((entry) => entry.id === 'DW');
    expect(area?.codes).toEqual(['DW', 'DX', 'VW', 'VX']);
    expect(area?.heading).toEqual({
      key: 'county.heading.city',
      params: { name: 'Wrocław' },
    });
    expect(area?.link).toEqual({ slug: 'dolnoslaskie', fragment: 'DW' });
  });

  it('names the voivodeship and the filled county in the aria label', async () => {
    const map = await countyMapLoaders['D']();
    const filled = region2ByName('Wrocław', 'D');
    const region1 = region1ByLetter('D');
    expect(voivodeshipMapView(map, region1, filled, 'en').ariaLabel).toEqual({
      key: 'map.aria.city',
      params: { voivodeship: 'Lower Silesian', name: 'Wrocław' },
    });
    expect(voivodeshipMapView(map, region1, filled, 'pl').ariaLabel).toEqual({
      key: 'map.aria.city',
      params: { voivodeship: 'dolnośląskie', name: 'Wrocław' },
    });
  });

  it('names only the voivodeship without a filled county', async () => {
    const map = await countyMapLoaders['D']();
    expect(
      voivodeshipMapView(map, region1ByLetter('D'), undefined, 'en').ariaLabel,
    ).toEqual({
      key: 'map.aria.voivodeship',
      params: { voivodeship: 'Lower Silesian' },
    });
  });

  it('uses the land key for a land county', async () => {
    const map = await countyMapLoaders['C']();
    const view = voivodeshipMapView(
      map,
      region1ByLetter('C'),
      region2ByName('golubsko-dobrzyński', 'C'),
      'en',
    );
    expect(view.ariaLabel).toEqual({
      key: 'map.aria.land',
      params: {
        voivodeship: 'Kuyavian-Pomeranian',
        name: 'golubsko-dobrzyński',
      },
    });
  });

  it('gives Mokotów its W and A codes and the district heading', async () => {
    const map = await loadWarsawDistrictMap();
    const view = warsawMapView(map, region1ByLetter('W'), ['Mokotów'], 'en');
    const area = view.areas.find((entry) => entry.id === 'Mokotów');
    expect(area?.codes).toEqual(['WE', 'AE']);
    expect(area?.heading).toEqual({
      key: 'map.district',
      params: { name: 'Mokotów' },
    });
    expect(area?.link).toEqual({ slug: 'mazowieckie', fragment: 'WE' });
    expect(area?.filled).toBe(true);
    expect(view.ariaLabel).toEqual({
      key: 'map.aria.warsaw',
      params: { districts: 'Mokotów' },
    });
  });

  it('fills the three WW districts', async () => {
    const map = await loadWarsawDistrictMap();
    const view = warsawMapView(
      map,
      region1ByLetter('W'),
      ['Rembertów', 'Wilanów', 'Włochy'],
      'en',
    );
    expect(
      view.areas
        .filter((area) => area.filled)
        .map((area) => area.id)
        .sort(),
    ).toEqual(['Rembertów', 'Wilanów', 'Włochy'].sort());
  });

  it('keeps the label point as the label position', async () => {
    const map = await countyMapLoaders['D']();
    const view = voivodeshipMapView(map, region1ByLetter('D'), undefined, 'en');
    const area = view.areas.find((entry) => entry.id === 'DW');
    expect(area?.label.x).toBe(721.9);
    expect(area?.label.y).toBe(389.1);
  });

  describe('country map', () => {
    let map: CountryMap;

    beforeAll(async () => {
      map = await loadCountryMap();
    });

    it('country map tints the 30 Lower Silesian counties', () => {
      const view = countryMapView(
        map,
        region1ByLetter('D'),
        region2ByName('Wrocław', 'D'),
        'en',
      );
      expect(view.areas.filter((area) => area.tinted)).toHaveLength(30);
    });

    it('country map fills only Wrocław', () => {
      const view = countryMapView(
        map,
        region1ByLetter('D'),
        region2ByName('Wrocław', 'D'),
        'en',
      );
      expect(
        view.areas.filter((area) => area.filled).map((area) => area.id),
      ).toEqual(['DW']);
    });

    it('country map labels the 18 capitals when Wrocław is selected', () => {
      const view = countryMapView(
        map,
        region1ByLetter('D'),
        region2ByName('Wrocław', 'D'),
        'en',
      );
      expect(
        view.areas.filter((area) => area.label.visible).map((area) => area.id),
      ).toEqual([
        'DW',
        'CB',
        'CT',
        'LU',
        'FG',
        'FZ',
        'EL',
        'KR',
        'WA',
        'OP',
        'RZ',
        'BI',
        'GD',
        'SK',
        'TK',
        'NO',
        'PO',
        'ZS',
      ]);
    });

    it('country map labels Kłodzko county and the 18 capitals', () => {
      const filled = registry.region2.find(
        (region) => region.region1Letter === 'D' && region.suffixes[0] === 'KL',
      );
      if (filled === undefined) {
        throw new Error('no DKL');
      }
      const view = countryMapView(map, region1ByLetter('D'), filled, 'en');
      expect(
        view.areas
          .filter((area) => area.label.visible)
          .map((area) => area.id)
          .sort(),
      ).toEqual(
        [
          'DW',
          'CB',
          'CT',
          'LU',
          'FG',
          'FZ',
          'EL',
          'KR',
          'WA',
          'OP',
          'RZ',
          'BI',
          'GD',
          'SK',
          'TK',
          'NO',
          'PO',
          'ZS',
          'DKL',
        ].sort(),
      );
    });

    it('country map hides DW under the marker of DDZ', () => {
      const filled = registry.region2.find(
        (region) => region.region1Letter === 'D' && region.suffixes[0] === 'DZ',
      );
      if (filled === undefined) {
        throw new Error('no DDZ');
      }
      const view = countryMapView(map, region1ByLetter('D'), filled, 'en');
      const visible = view.areas
        .filter((area) => area.label.visible)
        .map((area) => area.id);
      expect(visible).toContain('DDZ');
      expect(visible).not.toContain('DW');
    });

    it('country map keeps visible label boxes apart for all 380 selections at 328 and 650 px', () => {
      const selections = registry.region2.map((filled) => {
        const view = countryMapView(
          map,
          region1ByLetter(filled.region1Letter),
          filled,
          'en',
        );
        return view.areas
          .filter((area) => area.label.visible)
          .map(
            (area): TestLabel => ({
              code: area.id,
              x: area.label.x,
              y: area.label.y,
              wideOnly: area.label.wideOnly,
              aboveMarker: area.label.aboveMarker,
            }),
          );
      });
      const offending328 = selections.flatMap((visible) => {
        const narrow = visible.filter((label) => !label.wideOnly);
        return narrow.flatMap((a, i) =>
          narrow
            .slice(i + 1)
            .filter((b) => labelsOverlap(a, b, 328, 11))
            .map((b) => `${a.code}/${b.code}`),
        );
      });
      const offending650 = selections.flatMap((visible) =>
        visible.flatMap((a, i) =>
          visible
            .slice(i + 1)
            .filter((b) => labelsOverlap(a, b, 650, 12))
            .map((b) => `${a.code}/${b.code}`),
        ),
      );
      expect(offending328).toEqual([]);
      expect(offending650).toEqual([]);
    });

    it('country map names the county and the voivodeship in the aria label', () => {
      expect(
        countryMapView(
          map,
          region1ByLetter('D'),
          region2ByName('Wrocław', 'D'),
          'en',
        ).ariaLabel,
      ).toEqual({
        key: 'map.aria.countryCity',
        params: { name: 'Wrocław', voivodeship: 'Lower Silesian' },
      });
    });

    it('country map names only the voivodeship without a county', () => {
      expect(
        countryMapView(map, region1ByLetter('D'), undefined, 'en').ariaLabel,
      ).toEqual({
        key: 'map.aria.country',
        params: { voivodeship: 'Lower Silesian' },
      });
    });

    it('country map links a county to its own voivodeship table', () => {
      const view = countryMapView(
        map,
        region1ByLetter('D'),
        region2ByName('Wrocław', 'D'),
        'en',
      );
      expect(view.areas.find((area) => area.id === 'KR')?.link).toEqual({
        slug: 'malopolskie',
        fragment: 'KR',
      });
    });

    it('country map draws the borders without neighbours', () => {
      const view = countryMapView(
        map,
        region1ByLetter('D'),
        region2ByName('Wrocław', 'D'),
        'en',
      );
      expect(view.borders).toBe(
        map.voivodeships.map((row) => row.path).join(''),
      );
      expect(view.outline).toBeUndefined();
      expect(view.neighbours).toEqual([]);
      expect(view.labelHalo).toBe(true);
    });

    it('country map draws CT only from 768 px', () => {
      const view = countryMapView(
        map,
        region1ByLetter('D'),
        region2ByName('Wrocław', 'D'),
        'en',
      );
      const visible = view.areas.filter((area) => area.label.visible);
      expect(visible.find((area) => area.id === 'CT')?.label.wideOnly).toBe(
        true,
      );
      expect(
        visible
          .filter((area) => area.id !== 'CT')
          .every((area) => area.label.wideOnly === false),
      ).toBe(true);
    });

    it('country map puts a marker at the selected county and its label above it', () => {
      const withCounty = countryMapView(
        map,
        region1ByLetter('D'),
        region2ByName('Wrocław', 'D'),
        'en',
      );
      expect(withCounty.marker).toEqual({ x: 295, y: 590 });
      expect(
        withCounty.areas.find((area) => area.id === 'DW')?.label.aboveMarker,
      ).toBe(true);
      expect(
        withCounty.areas
          .filter((area) => area.id !== 'DW')
          .every((area) => area.label.aboveMarker === false),
      ).toBe(true);
      expect(
        countryMapView(map, region1ByLetter('D'), undefined, 'en').marker,
      ).toBeUndefined();
    });
  });
});
