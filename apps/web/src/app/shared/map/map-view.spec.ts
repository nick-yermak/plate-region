import {
  countyMapLoaders,
  loadCountryMap,
  loadWarsawDistrictMap,
  registry,
  type CountryMap,
  type Region1,
  type Region2,
} from '@plate-region/plate-data';

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
      key: 'county.heading.cityShared',
      params: { seat: 'Wrocław' },
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

    it('country map places seat tiers for Wrocław and the 18 capitals', () => {
      const view = countryMapView(
        map,
        region1ByLetter('D'),
        region2ByName('Wrocław', 'D'),
        'en',
      );
      const labelled = view.areas
        .filter(
          (area) =>
            area.label.tiers.narrow !== 'none' ||
            area.label.tiers.wide !== 'none',
        )
        .map((area) => area.id)
        .sort();
      expect(labelled).toEqual(
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
        ].sort(),
      );
      expect(view.areas.every((area) => area.label.visible === false)).toBe(
        true,
      );
    });

    it('country map places seat tiers for Kłodzko county and the 18 capitals', () => {
      const filled = registry.region2.find(
        (region) => region.region1Letter === 'D' && region.suffixes[0] === 'KL',
      );
      if (filled === undefined) {
        throw new Error('no DKL');
      }
      const view = countryMapView(map, region1ByLetter('D'), filled, 'en');
      const labelled = view.areas
        .filter(
          (area) =>
            area.label.tiers.narrow !== 'none' ||
            area.label.tiers.wide !== 'none',
        )
        .map((area) => area.id)
        .sort();
      expect(labelled).toEqual(
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

    it('country map keeps a seat tier for DDZ when it is selected', () => {
      const filled = registry.region2.find(
        (region) => region.region1Letter === 'D' && region.suffixes[0] === 'DZ',
      );
      if (filled === undefined) {
        throw new Error('no DDZ');
      }
      const view = countryMapView(map, region1ByLetter('D'), filled, 'en');
      const ddz = view.areas.find((area) => area.id === 'DDZ');
      expect(ddz?.label.tiers.narrow).not.toBe('none');
      expect(ddz?.label.tiers.wide).not.toBe('none');
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

    it('country map uses seat labels with no wide-only capitals', () => {
      const view = countryMapView(
        map,
        region1ByLetter('D'),
        region2ByName('Wrocław', 'D'),
        'en',
      );
      const dw = view.areas.find((area) => area.id === 'DW');
      expect(dw?.label.text).toBe('Wrocław (DW)');
      expect(dw?.label.codeText).toBe('DW');
      expect(dw?.label.tiers.narrow).not.toBe('none');
      expect(view.dots).toBe(true);
      expect(
        view.areas
          .filter((area) => area.label.visible)
          .every((area) => area.label.wideOnly === false),
      ).toBe(true);
    });

    it('country map marks capitals and keeps the selected ring only on the selection', () => {
      const withCounty = countryMapView(
        map,
        region1ByLetter('D'),
        region2ByName('Wrocław', 'D'),
        'en',
      );
      expect(withCounty.marker).toEqual({ x: 295, y: 590 });
      expect(withCounty.capitalMarkers?.length).toBe(17);
      expect(
        withCounty.capitalMarkers?.some((m) => m.x === 295 && m.y === 590),
      ).toBe(false);
      const land = countryMapView(
        map,
        region1ByLetter('D'),
        region2ByName('kłodzki', 'D'),
        'en',
      );
      expect(land.capitalMarkers?.length).toBe(18);
      expect(
        countryMapView(map, region1ByLetter('D'), undefined, 'en').marker,
      ).toBeUndefined();
    });
  });
});
