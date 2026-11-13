import { fullCodes, registry, type Region2 } from '@plate-region/plate-data';

import { countyHeading, sharedSeatCountyPairs } from './county-heading';

function county(code: string): Region2 {
  for (const region1 of registry.region1) {
    for (const region2 of registry.region2) {
      if (region2.region1Letter !== region1.letters[0]) {
        continue;
      }
      if (fullCodes(region1, region2).includes(code)) {
        return region2;
      }
    }
  }
  throw new Error(`no county with code ${code}`);
}

describe('sharedSeatCountyPairs', () => {
  it('lists 45 land–city pairs that share a seat in the same voivodeship', () => {
    const pairs = sharedSeatCountyPairs();
    expect(pairs).toHaveLength(45);
    expect(
      pairs.map((pair) => [
        pair.region1Letter,
        pair.cityCode,
        pair.landCode,
        pair.seat,
      ]),
    ).toEqual([
      ['D', 'DJ', 'DJE', 'Jelenia Góra'],
      ['D', 'DL', 'DLE', 'Legnica'],
      ['D', 'DB', 'DBA', 'Wałbrzych'],
      ['D', 'DW', 'DWR', 'Wrocław'],
      ['C', 'CB', 'CBY', 'Bydgoszcz'],
      ['C', 'CG', 'CGR', 'Grudziądz'],
      ['C', 'CT', 'CTR', 'Toruń'],
      ['C', 'CW', 'CWL', 'Włocławek'],
      ['L', 'LB', 'LBI', 'Biała Podlaska'],
      ['L', 'LC', 'LCH', 'Chełm'],
      ['L', 'LU', 'LUB', 'Lublin'],
      ['L', 'LZ', 'LZA', 'Zamość'],
      ['F', 'FG', 'FGW', 'Gorzów Wielkopolski'],
      ['F', 'FZ', 'FZI', 'Zielona Góra'],
      ['E', 'EL', 'ELW', 'Łódź'],
      ['E', 'EP', 'EPI', 'Piotrków Trybunalski'],
      ['E', 'ES', 'ESK', 'Skierniewice'],
      ['K', 'KR', 'KRA', 'Kraków'],
      ['K', 'KN', 'KNS', 'Nowy Sącz'],
      ['K', 'KT', 'KTA', 'Tarnów'],
      ['W', 'WO', 'WOS', 'Ostrołęka'],
      ['W', 'WP', 'WPL', 'Płock'],
      ['W', 'WR', 'WRA', 'Radom'],
      ['W', 'WS', 'WSI', 'Siedlce'],
      ['O', 'OP', 'OPO', 'Opole'],
      ['R', 'RK', 'RKR', 'Krosno'],
      ['R', 'RP', 'RPR', 'Przemyśl'],
      ['R', 'RZ', 'RZE', 'Rzeszów'],
      ['R', 'RT', 'RTA', 'Tarnobrzeg'],
      ['B', 'BI', 'BIA', 'Białystok'],
      ['B', 'BL', 'BLM', 'Łomża'],
      ['B', 'BS', 'BSU', 'Suwałki'],
      ['G', 'GS', 'GSL', 'Słupsk'],
      ['S', 'SB', 'SBI', 'Bielsko-Biała'],
      ['S', 'SC', 'SCZ', 'Częstochowa'],
      ['S', 'SG', 'SGL', 'Gliwice'],
      ['S', 'SR', 'SRB', 'Rybnik'],
      ['T', 'TK', 'TKI', 'Kielce'],
      ['N', 'NE', 'NEB', 'Elbląg'],
      ['N', 'NO', 'NOL', 'Olsztyn'],
      ['P', 'PK', 'PKA', 'Kalisz'],
      ['P', 'PKO', 'PKN', 'Konin'],
      ['P', 'PL', 'PLE', 'Leszno'],
      ['P', 'PO', 'POZ', 'Poznań'],
      ['Z', 'ZK', 'ZKO', 'Koszalin'],
    ]);
  });
});

describe('countyHeading', () => {
  it('names a city without a shared land county by its seat', () => {
    expect(countyHeading(county('GD'))).toEqual({
      key: 'county.heading.city',
      params: { seat: 'Gdańsk' },
    });
  });

  it('names Warszawa by its seat, with a district when given', () => {
    expect(countyHeading(county('WA'))).toEqual({
      key: 'county.heading.city',
      params: { seat: 'Warszawa' },
    });
    expect(countyHeading(county('WA'), 'Mokotów')).toEqual({
      key: 'county.heading.cityWithDistrict',
      params: { seat: 'Warszawa', district: 'Mokotów' },
    });
  });

  it('disambiguates a shared seat for city and land', () => {
    expect(countyHeading(county('GS'))).toEqual({
      key: 'county.heading.cityShared',
      params: { seat: 'Słupsk' },
    });
    expect(countyHeading(county('GSL'))).toEqual({
      key: 'county.heading.landShared',
      params: { seat: 'Słupsk' },
    });
    expect(countyHeading(county('DW'))).toEqual({
      key: 'county.heading.cityShared',
      params: { seat: 'Wrocław' },
    });
  });

  it('names a land county alone as seat and act name', () => {
    expect(countyHeading(county('GMB'))).toEqual({
      key: 'county.heading.land',
      params: { seat: 'Malbork', name: 'malborski' },
    });
    expect(countyHeading(county('GDA'))).toEqual({
      key: 'county.heading.land',
      params: { seat: 'Pruszcz Gdański', name: 'gdański' },
    });
    expect(countyHeading(county('DJE'))).toEqual({
      key: 'county.heading.landShared',
      params: { seat: 'Jelenia Góra' },
    });
  });
});
