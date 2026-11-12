import { registry } from './registry';
import type { Region2 } from './model';
import { countySeat, decodeCountySeats } from './county-seats';

function firstCode(region2: Region2): string {
  return `${region2.region1Letter}${region2.suffixes[0]}`;
}

function region2ByFirstCode(code: string): Region2 {
  const row = registry.region2.find((r) => firstCode(r) === code);
  if (row === undefined) {
    throw new Error(`registry has no region2 with first code ${code}`);
  }
  return row;
}

describe('countySeat', () => {
  it('returns the seat of known counties', () => {
    const expected: ReadonlyArray<readonly [string, string]> = [
      ['GMB', 'Malbork'],
      ['PO', 'Poznań'],
      ['POZ', 'Poznań'],
      ['DW', 'Wrocław'],
      ['DJE', 'Jelenia Góra'],
      ['WA', 'Warszawa'],
    ];
    expect(
      expected.map(([code]) => [code, countySeat(region2ByFirstCode(code))]),
    ).toEqual(expected);
  });

  it('returns a non-empty seat for every registry county', () => {
    const empty = registry.region2
      .map((r) => ({ code: firstCode(r), seat: countySeat(r) }))
      .filter((row) => row.seat === '');
    expect(empty).toEqual([]);
  });

  it('throws when the county is absent from the seat map', () => {
    const fake: Region2 = {
      country: 'PL',
      region1Letter: 'D',
      name: 'absent-county',
      kind: 'land',
      suffixes: ['QQ'],
    };
    expect(() => countySeat(fake)).toThrow('county seats: no seat for DQQ');
  });
});

describe('decodeCountySeats', () => {
  it('throws when one seat is missing', () => {
    const seats = registry.region2.slice(0, -1).map(() => 'Seat');
    expect(() => decodeCountySeats(seats, registry.region2)).toThrow(
      'county seats: 379 seats, the registry has 380 counties',
    );
  });

  it('throws when a seat is the empty string', () => {
    const seats = registry.region2.map((_, i) => (i === 0 ? '' : 'Seat'));
    expect(() => decodeCountySeats(seats, registry.region2)).toThrow(
      'county seats: empty seat for DJ',
    );
  });
});
