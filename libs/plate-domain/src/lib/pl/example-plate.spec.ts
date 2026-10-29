import { registry } from '@plate-region/plate-data';
import type { Region1, Region2 } from '@plate-region/plate-data';
import { describe, expect, it, vi } from 'vitest';

import { examplePlateForCode, examplePlateForRegion1 } from './example-plate';
import { parsePlate } from './parse-plate';

function region1ByName(name: string): Region1 {
  const found = registry.region1.find((r) => r.name === name);
  if (found === undefined) {
    throw new Error(`region1 not found: ${name}`);
  }
  return found;
}

function region2By(region1Letter: string, name: string): Region2 {
  const found = registry.region2.find(
    (r) => r.region1Letter === region1Letter && r.name === name,
  );
  if (found === undefined) {
    throw new Error(`region2 not found: ${region1Letter}:${name}`);
  }
  return found;
}

function plateOrThrow(plate: string | undefined): string {
  if (plate === undefined) {
    throw new Error('expected a plate');
  }
  return plate;
}

const T_LEN2 = 1_435_977;
const T_LEN3 = 978_858;
/** TK + 16 three-character codes of świętokrzyskie. */
const T_SW = T_LEN2 + 16 * T_LEN3;
/** dolnośląskie: 5 one-character suffixes × 2 letters, 27 two-character suffixes × 2 letters. */
const T_DS = 10 * T_LEN2 + 54 * T_LEN3;
const LAST = 1 - 2 ** -53;

const rAt = (i: number, t: number): number => (i + 0.5) / t;

describe('examplePlateForCode', () => {
  it('B1 TK first index → TK 00001 (DDDDD, R-24)', () => {
    expect(examplePlateForCode('TK', () => rAt(0, T_LEN2))).toBe('TK 00001');
  });

  it('B2 TK last index → TK 999 (DDD, R-30, R-45)', () => {
    const plate = plateOrThrow(examplePlateForCode('TK', () => LAST));
    expect(plate).toBe('TK 999');
    expect(parsePlate(plate)).toEqual({
      status: 'resolved',
      country: 'PL',
      region1: region1ByName('świętokrzyskie'),
      region2: region2By('T', 'Kielce'),
      plateTypes: ['vintage'],
    });
  });

  it('B3 TBU first index → TBU A001 (LDDD, R-25)', () => {
    const plate = plateOrThrow(
      examplePlateForCode('TBU', () => rAt(0, T_LEN3)),
    );
    expect(plate).toBe('TBU A001');
    expect(parsePlate(plate)).toEqual({
      status: 'resolved',
      country: 'PL',
      region1: region1ByName('świętokrzyskie'),
      region2: region2By('T', 'buski'),
      plateTypes: ['ordinary'],
    });
  });

  it('B4 TBU last index → TBU Y9 (LD, R-31, R-45)', () => {
    const plate = plateOrThrow(examplePlateForCode('TBU', () => LAST));
    expect(plate).toBe('TBU Y9');
    expect(parsePlate(plate)).toEqual({
      status: 'resolved',
      country: 'PL',
      region1: region1ByName('świętokrzyskie'),
      region2: region2By('T', 'buski'),
      plateTypes: ['vintage'],
    });
  });

  it('B5 TK first of second layout → TK 0001A (DDDDL, R-24)', () => {
    // Capacity of DDDDD — § 30 ust. 2 pkt 1 lit. a tiret 1 (R-24).
    expect(examplePlateForCode('TK', () => rAt(10 ** 5 - 1, T_LEN2))).toBe(
      'TK 0001A',
    );
  });

  it('B6 TBU first of second layout → TBU 01AA (DDLL, R-25)', () => {
    // Capacity of LDDD — § 30 ust. 2 pkt 1 lit. b tiret 1 (R-25).
    const plate = plateOrThrow(
      examplePlateForCode('TBU', () => rAt(20 * 999, T_LEN3)),
    );
    expect(plate).toBe('TBU 01AA');
    expect(parsePlate(plate)).toEqual({
      status: 'resolved',
      country: 'PL',
      region1: region1ByName('świętokrzyskie'),
      region2: region2By('T', 'buski'),
      plateTypes: ['ordinary'],
    });
  });

  it('B7 TK inside DLDDD → TK 2C003 (R-24)', () => {
    // Start of DLDDD + run digits 1, letter 1, digits 2.
    const plate = plateOrThrow(
      examplePlateForCode('TK', () =>
        rAt(
          10 ** 5 -
            1 +
            (10 ** 4 - 1) * 20 +
            (10 ** 3 - 1) * 20 ** 2 +
            1 * (20 * 999) +
            1 * 999 +
            2,
          T_LEN2,
        ),
      ),
    );
    expect(plate).toBe('TK 2C003');
    expect(parsePlate(plate)).toEqual({
      status: 'resolved',
      country: 'PL',
      region1: region1ByName('świętokrzyskie'),
      region2: region2By('T', 'Kielce'),
      plateTypes: ['ordinary'],
    });
  });

  it('B10 unknown code QQ → undefined', () => {
    expect(examplePlateForCode('QQ', () => rAt(0, T_LEN2))).toBeUndefined();
  });

  it('B11 NaN throws RangeError', () => {
    expect(() => examplePlateForCode('TK', () => Number.NaN)).toThrow(
      RangeError,
    );
  });

  it('B11 −0.1 throws RangeError', () => {
    expect(() => examplePlateForCode('TK', () => -0.1)).toThrow(RangeError);
  });

  it('B11 1 throws RangeError', () => {
    expect(() => examplePlateForCode('TK', () => 1)).toThrow(RangeError);
  });

  it('B12 same source twice → TK 00001', () => {
    const source = () => rAt(0, T_LEN2);
    expect(examplePlateForCode('TK', source)).toBe('TK 00001');
    expect(examplePlateForCode('TK', source)).toBe('TK 00001');
  });

  it('B13 r = 0 → TK 00001', () => {
    expect(examplePlateForCode('TK', () => 0)).toBe('TK 00001');
  });

  it('B15 random called once for a full code', () => {
    const source = vi.fn(() => rAt(0, T_LEN2));
    expect(examplePlateForCode('TK', source)).toBe('TK 00001');
    expect(source).toHaveBeenCalledTimes(1);
  });

  it('B16 column-6 code T0 → undefined', () => {
    expect(examplePlateForCode('T0', () => rAt(0, T_LEN2))).toBeUndefined();
  });
});

describe('examplePlateForRegion1', () => {
  const sw = () => region1ByName('świętokrzyskie');
  const ds = () => region1ByName('dolnośląskie');

  it('B8 last plate of TK → TK 999', () => {
    expect(examplePlateForRegion1(sw(), () => rAt(T_LEN2 - 1, T_SW))).toBe(
      'TK 999',
    );
  });

  it('B8 first plate of TBU → TBU A001', () => {
    expect(examplePlateForRegion1(sw(), () => rAt(T_LEN2, T_SW))).toBe(
      'TBU A001',
    );
  });

  it('B9 last plate of świętokrzyskie → TLW Y9', () => {
    const plate = plateOrThrow(examplePlateForRegion1(sw(), () => LAST));
    expect(plate).toBe('TLW Y9');
    expect(parsePlate(plate)).toEqual({
      status: 'resolved',
      country: 'PL',
      region1: region1ByName('świętokrzyskie'),
      region2: region2By('T', 'włoszczowski'),
      plateTypes: ['vintage'],
    });
  });

  it('B14 NaN throws RangeError', () => {
    expect(() => examplePlateForRegion1(sw(), () => Number.NaN)).toThrow(
      RangeError,
    );
  });

  it('B15 random called once for a region1', () => {
    const source = vi.fn(() => rAt(0, T_LEN2));
    expect(examplePlateForRegion1(sw(), source)).toBe('TK 00006');
    expect(source).toHaveBeenCalledTimes(1);
  });

  it('B17 last plate of DX → DX 999', () => {
    // DJ, VJ, DL, VL, DB, VB, DW, DX before VW.
    const plate = plateOrThrow(
      examplePlateForRegion1(ds(), () => rAt(8 * T_LEN2 - 1, T_DS)),
    );
    expect(plate).toBe('DX 999');
    expect(parsePlate(plate)).toEqual({
      status: 'resolved',
      country: 'PL',
      region1: region1ByName('dolnośląskie'),
      region2: region2By('D', 'Wrocław'),
      plateTypes: ['vintage'],
    });
  });

  it('B17 first plate of VW → VW 00001', () => {
    expect(examplePlateForRegion1(ds(), () => rAt(8 * T_LEN2, T_DS))).toBe(
      'VW 00001',
    );
  });
});
