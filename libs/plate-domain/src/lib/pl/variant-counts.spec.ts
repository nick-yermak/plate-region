import { fullCodes, registry } from '@plate-region/plate-data';
import type { Region1, Region2 } from '@plate-region/plate-data';

import type { PlateType } from './plate-type';
import type { VariantCounts } from './variant-counts';
import {
  variantCountsForCode,
  variantCountsForRegion1,
} from './variant-counts';

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

type BucketPlateTypes = readonly [PlateType, ...PlateType[]];

const ORDINARY: BucketPlateTypes = ['ordinary'];
const REDUCED: BucketPlateTypes = ['ordinary', 'vintage', 'temporary'];
const INDIVIDUAL: BucketPlateTypes = ['individual'];
const VINTAGE: BucketPlateTypes = ['vintage'];
const TEMPORARY: BucketPlateTypes = ['temporary'];
const DIPLOMATIC: BucketPlateTypes = ['diplomatic'];

// Letters: 25 of § 30 ust. 1 (R-23) minus B, D, I, O, Z, § 31 ust. 1 (R-36).
const LETTERS = 20;
const LETTERS2 = LETTERS * LETTERS; // 400
const INDIVIDUAL_LETTERS = 25;
const INDIVIDUAL_LETTERS2 = INDIVIDUAL_LETTERS * INDIVIDUAL_LETTERS; // 625
const INDIVIDUAL_LETTERS3 = INDIVIDUAL_LETTERS2 * INDIVIDUAL_LETTERS; // 15 625
const INDIVIDUAL_LETTERS4 = INDIVIDUAL_LETTERS3 * INDIVIDUAL_LETTERS; // 390 625
const INDIVIDUAL_LETTERS5 = INDIVIDUAL_LETTERS4 * INDIVIDUAL_LETTERS; // 9 765 625

// Digit runs: 10^k − 1 — § 30 ust. 2 pkt 1–3, 5–7 (R-34).
const D1 = 9;
const D2 = 99;
const D3 = 999;
const D4 = 9_999;
const D5 = 99_999;
const D6 = 999_999;

// --- Ordinary, two-character code: § 30 ust. 2 pkt 1 lit. a (R-24) ---
// tiret 1 DDDDD: 10^5 − 1
const R24_T1 = D5;
// tiret 2 DDDDL: (10^4 − 1) * 20
const R24_T2 = D4 * LETTERS;
// tiret 3 DDDLL: (10^3 − 1) * 20^2
const R24_T3 = D3 * LETTERS2;
// tiret 4 DLDDD: 9 * 20 * (10^3 − 1)
const R24_T4 = D1 * LETTERS * D3;
// tiret 5 DLLDD: 9 * 20^2 * (10^2 − 1)
const R24_T5 = D1 * LETTERS2 * D2;
const R24 = R24_T1 + R24_T2 + R24_T3 + R24_T4 + R24_T5; // 1 235 799

// --- Ordinary motorcycle/moped, two-character: pkt 3 lit. a (R-27) ---
// tiret 1 DDDD
const R27_T1 = D4;
// tiret 2 DDDL
const R27_T2 = D3 * LETTERS;
// tiret 3 DDLD
const R27_T3 = D2 * LETTERS * D1;
// tiret 4 DLDD
const R27_T4 = D1 * LETTERS * D2;
// tiret 5 LDDD
const R27_T5 = LETTERS * D3;
// tiret 6 DDLL
const R27_T6 = D2 * LETTERS2;
// tiret 7 DLLD
const R27_T7 = D1 * LETTERS2 * D1;
// tiret 8 LLDD
const R27_T8 = LETTERS2 * D2;
const R27 =
  R27_T1 + R27_T2 + R27_T3 + R27_T4 + R27_T5 + R27_T6 + R27_T7 + R27_T8; // 197 199

const ORDINARY_LEN2 = R24 + R27; // 1 432 998

// --- Vintage, two-character: pkt 5 lit. a (R-30) ---
// tiret 1 DDL
const R30_T1 = D2 * LETTERS;
// tiret 2 DDD
const R30_T2 = D3;
const VINTAGE_LEN2 = R30_T1 + R30_T2; // 2 979

const TOTAL_LEN2 = ORDINARY_LEN2 + VINTAGE_LEN2; // 1 435 977

// Shared six layouts of pkt 1 lit. b and pkt 3 lit. b (R-25, R-28), counted once.
// tiret 1 LDDD
const SHARED_T1 = LETTERS * D3;
// tiret 2 DDLL
const SHARED_T2 = D2 * LETTERS2;
// tiret 3 DLDD
const SHARED_T3 = D1 * LETTERS * D2;
// tiret 4 DDLD
const SHARED_T4 = D2 * LETTERS * D1;
// tiret 5 DLLD
const SHARED_T5 = D1 * LETTERS2 * D1;
// tiret 6 LLDD
const SHARED_T6 = LETTERS2 * D2;
const SHARED_SIX =
  SHARED_T1 + SHARED_T2 + SHARED_T3 + SHARED_T4 + SHARED_T5 + SHARED_T6;

// --- Ordinary, three-character: pkt 1 lit. b (R-25) ---
// tiret 1–6 = SHARED_SIX; tiret 7 DDDDD; tiret 8 DDDDL; tiret 9 DDDLL
const R25_T7 = D5;
const R25_T8 = D4 * LETTERS;
const R25_T9 = D3 * LETTERS2;
const R25 = SHARED_SIX + R25_T7 + R25_T8 + R25_T9; // 866 799

// --- Ordinary motorcycle/moped, three-character: pkt 3 lit. b (R-28) ---
// tiret 1–6 already in SHARED_SIX; tiret 7 LDDL; tiret 8 LDLL
const R28_T7 = LETTERS * D2 * LETTERS;
const R28_T8 = LETTERS * D1 * LETTERS2;
const R28_EXTRA = R28_T7 + R28_T8; // 111 600

const ORDINARY_LEN3 = R25 + R28_EXTRA; // 978 399

// --- Vintage, three-character: pkt 5 lit. b (R-31) ---
// tiret 1 DL; tiret 2 DD; tiret 3 LD
const VINTAGE_LEN3 = D1 * LETTERS + D2 + LETTERS * D1; // 459

const TOTAL_LEN3 = ORDINARY_LEN3 + VINTAGE_LEN3; // 978 858

// --- Reduced, one column-4 letter: pkt 2 lit. a–g (R-26); shared count R-35 ---
// lit. a DDD; b DDL; c DLD; d LDD; e DLL; f LLD; g LDL
const R26_A = D3;
const R26_B = D2 * LETTERS;
const R26_C = D1 * LETTERS * D1;
const R26_D = LETTERS * D2;
const R26_E = D1 * LETTERS2;
const R26_F = LETTERS2 * D1;
const R26_G = LETTERS * D1 * LETTERS;
const REDUCED_PER_LETTER =
  R26_A + R26_B + R26_C + R26_D + R26_E + R26_F + R26_G; // 17 379

// --- Diplomatic, one column-4 letter: pkt 7 (R-33) ---
const DIPLOMATIC_PER_LETTER = D6; // 999 999

// --- Temporary, one column-6 code: pkt 6 (R-32), both issuance orders ---
const TEMPORARY_PER_COL6 = D4 + D3 * LETTERS; // 29 979

// --- Individual, one column-6 code: pkt 4 (R-29); Annex 12 Rys. 12, 13, 15 (R-44) ---
// Digits 10^k (R-29); letters 25^k (R-39).
const IND_P1 = INDIVIDUAL_LETTERS5; // LLLLL
const IND_P2 = INDIVIDUAL_LETTERS4 * 10; // LLLLD
const IND_P3 = INDIVIDUAL_LETTERS3 * 10 * INDIVIDUAL_LETTERS; // LLLDL
const IND_P4 = INDIVIDUAL_LETTERS3 * 100; // LLLDD
const IND_P5 = INDIVIDUAL_LETTERS4; // LLLL
const IND_P6 = INDIVIDUAL_LETTERS3 * 10; // LLLD
const IND_P7 = INDIVIDUAL_LETTERS2 * 10 * INDIVIDUAL_LETTERS; // LLDL
const IND_P8 = INDIVIDUAL_LETTERS2 * 100; // LLDD
const IND_P9 = INDIVIDUAL_LETTERS3; // LLL
const IND_P10 = INDIVIDUAL_LETTERS2 * 10; // LLD
const IND_P11 = INDIVIDUAL_LETTERS * 10 * INDIVIDUAL_LETTERS; // LDL
const IND_P12 = INDIVIDUAL_LETTERS * 100; // LDD
const INDIVIDUAL_PER_COL6 =
  IND_P1 +
  IND_P2 +
  IND_P3 +
  IND_P4 +
  IND_P5 +
  IND_P6 +
  IND_P7 +
  IND_P8 +
  IND_P9 +
  IND_P10 +
  IND_P11 +
  IND_P12; // 19 936 875

function expectCounts(
  actual: VariantCounts | undefined,
  ordinary: number,
  reduced: number,
  individual: number,
  vintage: number,
  temporary: number,
  diplomatic: number,
): void {
  expect(actual).toBeDefined();
  if (actual === undefined) {
    return;
  }
  const total =
    ordinary + reduced + individual + vintage + temporary + diplomatic;
  expect(actual).toEqual({
    buckets: [
      { plateTypes: ORDINARY, count: ordinary },
      { plateTypes: REDUCED, count: reduced },
      { plateTypes: INDIVIDUAL, count: individual },
      { plateTypes: VINTAGE, count: vintage },
      { plateTypes: TEMPORARY, count: temporary },
      { plateTypes: DIPLOMATIC, count: diplomatic },
    ],
    total,
  });
}

describe('variantCountsForCode', () => {
  it('counts a two-character primary code (TK = Kielce)', () => {
    const region1 = region1ByName('świętokrzyskie');
    const region2 = region2By('T', 'Kielce');
    expect([...fullCodes(region1, region2)]).toEqual(['TK']);

    expectCounts(
      variantCountsForCode('TK'),
      ORDINARY_LEN2,
      0,
      0,
      VINTAGE_LEN2,
      0,
      0,
    );
    expect(TOTAL_LEN2).toBe(1_435_977);
  });

  it('counts a three-character primary code (TBU = buski)', () => {
    const region1 = region1ByName('świętokrzyskie');
    const region2 = region2By('T', 'buski');
    expect([...fullCodes(region1, region2)]).toEqual(['TBU']);

    expectCounts(
      variantCountsForCode('TBU'),
      ORDINARY_LEN3,
      0,
      0,
      VINTAGE_LEN3,
      0,
      0,
    );
    expect(TOTAL_LEN3).toBe(978_858);
  });

  it('counts a two-character secondary-letter code (VJ = Jelenia Góra)', () => {
    const region1 = region1ByName('dolnośląskie');
    const region2 = region2By('D', 'Jelenia Góra');
    expect([...fullCodes(region1, region2)]).toEqual(['DJ', 'VJ']);

    expectCounts(
      variantCountsForCode('VJ'),
      ORDINARY_LEN2,
      0,
      0,
      VINTAGE_LEN2,
      0,
      0,
    );
  });

  it('returns undefined for a code not in the registry (HX)', () => {
    expect(variantCountsForCode('HX')).toBeUndefined();
  });
});

describe('variantCountsForRegion1', () => {
  it('sums świętokrzyskie (1 letter, 1 len-2, 16 len-3, 10 col-6)', () => {
    const region1 = region1ByName('świętokrzyskie');
    expect(region1.letters).toEqual(['T']);
    expect(region1.letterDigitCodes).toHaveLength(10);

    const actual = variantCountsForRegion1(region1);
    // 1 * TOTAL_LEN2 + 16 * TOTAL_LEN3 + 1 * COLUMN_4 + 10 * COLUMN_6
    expectCounts(
      actual,
      1 * ORDINARY_LEN2 + 16 * ORDINARY_LEN3,
      1 * REDUCED_PER_LETTER,
      10 * INDIVIDUAL_PER_COL6,
      1 * VINTAGE_LEN2 + 16 * VINTAGE_LEN3,
      10 * TEMPORARY_PER_COL6,
      1 * DIPLOMATIC_PER_LETTER,
    );
    expect(actual.total).toBe(217_783_623);
  });

  it('sums mazowieckie (2 letters, 48 len-2, 76 len-3, 20 col-6)', () => {
    const region1 = region1ByName('mazowieckie');
    expect(region1.letters).toEqual(['W', 'A']);
    expect(region1.letterDigitCodes).toHaveLength(20);

    const actual = variantCountsForRegion1(region1);
    expectCounts(
      actual,
      48 * ORDINARY_LEN2 + 76 * ORDINARY_LEN3,
      2 * REDUCED_PER_LETTER,
      20 * INDIVIDUAL_PER_COL6,
      48 * VINTAGE_LEN2 + 76 * VINTAGE_LEN3,
      20 * TEMPORARY_PER_COL6,
      2 * DIPLOMATIC_PER_LETTER,
    );
    expect(actual.total).toBe(544_691_940);
  });

  it('sums dolnośląskie (2 letters, 10 len-2, 54 len-3, 20 col-6)', () => {
    const region1 = region1ByName('dolnośląskie');
    expect(region1.letters).toEqual(['D', 'V']);
    expect(region1.letterDigitCodes).toHaveLength(20);

    const actual = variantCountsForRegion1(region1);
    expectCounts(
      actual,
      10 * ORDINARY_LEN2 + 54 * ORDINARY_LEN3,
      2 * REDUCED_PER_LETTER,
      20 * INDIVIDUAL_PER_COL6,
      10 * VINTAGE_LEN2 + 54 * VINTAGE_LEN3,
      20 * TEMPORARY_PER_COL6,
      2 * DIPLOMATIC_PER_LETTER,
    );
    expect(actual.total).toBe(468_589_938);
  });
});
