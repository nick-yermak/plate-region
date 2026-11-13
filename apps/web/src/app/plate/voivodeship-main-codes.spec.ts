import { registry } from '@plate-region/plate-data';

import { voivodeship } from './plate.testing';
import { voivodeshipMainCodes } from './voivodeship-main-codes';

describe('voivodeshipMainCodes', () => {
  it('lists G as GD, GA, GS, GSP, then land counties by code', () => {
    const codes = voivodeshipMainCodes(voivodeship('G')).map((row) => row.code);
    expect(codes.slice(0, 4)).toEqual(['GD', 'GA', 'GS', 'GSP']);
    expect(codes).toEqual([
      'GD',
      'GA',
      'GS',
      'GSP',
      'GBY',
      'GCH',
      'GCZ',
      'GDA',
      'GKA',
      'GKS',
      'GKW',
      'GLE',
      'GMB',
      'GND',
      'GPU',
      'GSL',
      'GST',
      'GSZ',
      'GTC',
      'GWE',
    ]);
  });

  it('names G cities and land counties by countyHeading', () => {
    const byCode = Object.fromEntries(
      voivodeshipMainCodes(voivodeship('G')).map((row) => [row.code, row.name]),
    );
    expect(byCode['GD']).toEqual({
      key: 'county.heading.city',
      params: { seat: 'Gdańsk' },
    });
    expect(byCode['GS']).toEqual({
      key: 'county.heading.cityShared',
      params: { seat: 'Słupsk' },
    });
    expect(byCode['GSL']).toEqual({
      key: 'county.heading.landShared',
      params: { seat: 'Słupsk' },
    });
    expect(byCode['GDA']).toEqual({
      key: 'county.heading.land',
      params: { seat: 'Pruszcz Gdański', name: 'gdański' },
    });
    expect(byCode['GMB']).toEqual({
      key: 'county.heading.land',
      params: { seat: 'Malbork', name: 'malborski' },
    });
  });

  it('lists C starting with CB, CT, then other cities, then land counties', () => {
    const codes = voivodeshipMainCodes(voivodeship('C')).map((row) => row.code);
    expect(codes.slice(0, 4)).toEqual(['CB', 'CT', 'CG', 'CW']);
    expect(codes).toEqual([
      'CB',
      'CT',
      'CG',
      'CW',
      'CAL',
      'CBR',
      'CBY',
      'CCH',
      'CGD',
      'CGR',
      'CIN',
      'CLI',
      'CMG',
      'CNA',
      'CRA',
      'CRY',
      'CSE',
      'CSW',
      'CTR',
      'CTU',
      'CWA',
      'CWL',
      'CZN',
    ]);
  });

  it('lists W starting with WA, then other cities with powiat rights, then land', () => {
    const codes = voivodeshipMainCodes(voivodeship('W')).map((row) => row.code);
    expect(codes.slice(0, 5)).toEqual(['WA', 'WO', 'WP', 'WR', 'WS']);
    expect(codes).toEqual([
      'WA',
      'WO',
      'WP',
      'WR',
      'WS',
      'WBR',
      'WCI',
      'WG',
      'WGM',
      'WGR',
      'WGS',
      'WKZ',
      'WL',
      'WLI',
      'WLS',
      'WM',
      'WMA',
      'WML',
      'WND',
      'WOR',
      'WOS',
      'WOT',
      'WPI',
      'WPL',
      'WPN',
      'WPR',
      'WPU',
      'WPY',
      'WPZ',
      'WRA',
      'WSC',
      'WSE',
      'WSI',
      'WSK',
      'WSZ',
      'WWE',
      'WWL',
      'WWY',
      'WZ',
      'WZU',
      'WZW',
      'WZY',
    ]);
    expect(
      voivodeshipMainCodes(voivodeship('W')).find((row) => row.code === 'WA')
        ?.name,
    ).toEqual({
      key: 'county.heading.city',
      params: { seat: 'Warszawa' },
    });
  });

  it('has distinct codes per voivodeship and 380 counties in total', () => {
    const violations: string[] = [];
    let total = 0;
    for (const region1 of registry.region1) {
      const rows = voivodeshipMainCodes(region1);
      const codes = rows.map((row) => row.code);
      if (new Set(codes).size !== codes.length) {
        violations.push(`${region1.letters[0]}: duplicate codes`);
      }
      total += rows.length;
    }
    expect(violations).toEqual([]);
    expect(total).toBe(380);
  });
});
