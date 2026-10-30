// Written by an agent that saw only the public JSDoc of plate-domain, the
// plate-data registry and excerpts of Dz.U. 2024 poz. 1709 (#41). Kept as
// written so they show what a reader of the contract alone expects: do not
// rewrite them to testing.mdc conventions (D-45).

import { describe, it, expect } from 'vitest';

import { variantCountsForCode } from '../../index';

/**
 * Letter-run size: 25 letters of § 30 ust. 1 (R-23) minus B, D, I, O, Z — § 31 ust. 1 (R-36)
 * → 20; digit-run size 10^k − 1 — § 30 ust. 2 pkt 1–3, 5–7 (R-34).
 * variantCountsForCode JSDoc — plate-domain/src/lib/pl/variant-counts.d.ts
 */
const L = 20;

/** Two-character code, ordinary cars — § 30 ust. 2 pkt 1 lit. a (R-24) */
const cars2 =
  10 ** 5 -
  1 + // 5 digits: 99999
  (10 ** 4 - 1) * L + // 4 digits + letter: 9999*20 = 199980
  (10 ** 3 - 1) * L ** 2 + // 3 digits + 2 letters: 999*400 = 399600
  9 * L * (10 ** 3 - 1) + // digit + letter + 3 digits: 9*20*999 = 179820
  9 * L ** 2 * (10 ** 2 - 1); // digit + 2 letters + 2 digits: 9*400*99 = 356400
// cars2 = 99999+199980+399600+179820+356400 = 1235799

/** Two-character code, motorcycle — § 30 ust. 2 pkt 3 lit. a (R-27); no lit.a share-dedupe in JSDoc */
const moto2 =
  10 ** 4 -
  1 + // 9999
  (10 ** 3 - 1) * L + // 999*20 = 19980
  (10 ** 2 - 1) * L * 9 + // 99*20*9 = 17820
  9 * L * (10 ** 2 - 1) + // 9*20*99 = 17820
  L * (10 ** 3 - 1) + // 20*999 = 19980
  (10 ** 2 - 1) * L ** 2 + // 99*400 = 39600
  9 * L ** 2 * 9 + // 9*400*9 = 32400
  L ** 2 * (10 ** 2 - 1); // 400*99 = 39600
// moto2 = 9999+19980+17820+17820+19980+39600+32400+39600 = 197199

/** ordinary bucket for 2-char codes */
const ordinary2 = cars2 + moto2; // 1235799+197199 = 1432998

/** Vintage 2-char — § 30 ust. 2 pkt 5 lit. a (R-30) */
const vintage2 =
  (10 ** 2 - 1) * L + // 99*20 = 1980
  (10 ** 3 - 1); // 999
// vintage2 = 2979

const total2 = ordinary2 + vintage2; // 1432998+2979 = 1435977

/** Three-character cars — § 30 ust. 2 pkt 1 lit. b (R-25) */
const cars3 =
  L * (10 ** 3 - 1) + // letter+3 digits: 20*999 = 19980
  (10 ** 2 - 1) * L ** 2 + // 2 digits+2 letters: 99*400 = 39600
  9 * L * (10 ** 2 - 1) + // digit+letter+2 digits: 9*20*99 = 17820
  (10 ** 2 - 1) * L * 9 + // 2 digits+letter+digit: 99*20*9 = 17820
  9 * L ** 2 * 9 + // digit+2 letters+digit: 9*400*9 = 32400
  L ** 2 * (10 ** 2 - 1) + // 2 letters+2 digits: 400*99 = 39600
  (10 ** 5 - 1) + // 5 digits: 99999
  (10 ** 4 - 1) * L + // 4 digits+letter: 9999*20 = 199980
  (10 ** 3 - 1) * L ** 2; // 3 digits+2 letters: 999*400 = 399600
// cars3 = 866799

/**
 * Moto-only layouts under pkt 3 lit. b (R-28) after shared layouts count once
 * (variantCountsForCode JSDoc: “Layouts shared by pkt 1 lit. b and pkt 3 lit. b count once”).
 * Shared: first six moto layouts ≡ first six car layouts.
 * Moto-only: letter+2 digits+letter = 20*99*20 = 39600;
 *            letter+digit+2 letters = 20*9*400 = 72000.
 */
const motoOnly3 = L * (10 ** 2 - 1) * L + L * 9 * L ** 2; // 39600+72000 = 111600

const ordinary3 = cars3 + motoOnly3; // 866799+111600 = 978399

/** Vintage 3-char — § 30 ust. 2 pkt 5 lit. b (R-31) */
const vintage3 =
  9 * L + // digit+letter: 180
  (10 ** 2 - 1) + // 2 digits: 99
  L * 9; // letter+digit: 180
// vintage3 = 459

const total3 = ordinary3 + vintage3; // 978399+459 = 978858

const emptyReducedIndividualTemporaryDiplomatic = [
  {
    // bucket ordinary+vintage+temporary — reduced shared; zero after column-4+5 code
    // variantCountsForCode JSDoc
    plateTypes: ['ordinary', 'vintage', 'temporary'] as const,
    count: 0,
  },
  {
    // individual zero after column-4+5 code — variantCountsForCode JSDoc
    plateTypes: ['individual'] as const,
    count: 0,
  },
  {
    // temporary zero after column-4+5 code — variantCountsForCode JSDoc
    plateTypes: ['temporary'] as const,
    count: 0,
  },
  {
    // diplomatic zero after column-4+5 code — variantCountsForCode JSDoc
    plateTypes: ['diplomatic'] as const,
    count: 0,
  },
] as const;

describe('variantCountsForCode', () => {
  it('returns six buckets for two-character registry code DW', () => {
    // variantCountsForCode JSDoc: always six buckets; DW = Wrocław (Annex 13 / registry)
    const result = variantCountsForCode('DW');
    expect(result?.buckets).toHaveLength(6);
  });

  it('counts ordinary variants for DW from pkt 1 lit. a and pkt 3 lit. a', () => {
    // Derivation: cars2=1235799 (R-24) + moto2=197199 (R-27) = 1432998 — see file header
    // bucket plateTypes ['ordinary'] — VariantCounts JSDoc
    expect(variantCountsForCode('DW')?.buckets[0]).toEqual({
      plateTypes: ['ordinary'],
      count: ordinary2,
    });
  });

  it('zeroes the reduced ordinary+vintage+temporary bucket for DW', () => {
    // variantCountsForCode JSDoc: “Reduced … are zero after a column-4+5 code”
    // tuple order ordinary, vintage, temporary — § 25 order within the shared set
    expect(variantCountsForCode('DW')?.buckets[1]).toEqual({
      plateTypes: ['ordinary', 'vintage', 'temporary'],
      count: 0,
    });
  });

  it('zeroes the individual bucket for DW', () => {
    // variantCountsForCode JSDoc: individual zero after column-4+5 code
    expect(variantCountsForCode('DW')?.buckets[2]).toEqual({
      plateTypes: ['individual'],
      count: 0,
    });
  });

  it('counts vintage variants for DW from pkt 5 lit. a', () => {
    // Derivation: 99*20 + 999 = 1980+999 = 2979 — § 30 ust. 2 pkt 5 lit. a (R-30)
    expect(variantCountsForCode('DW')?.buckets[3]).toEqual({
      plateTypes: ['vintage'],
      count: vintage2,
    });
  });

  it('zeroes the temporary bucket for DW', () => {
    // variantCountsForCode JSDoc: temporary zero after column-4+5 code
    expect(variantCountsForCode('DW')?.buckets[4]).toEqual({
      plateTypes: ['temporary'],
      count: 0,
    });
  });

  it('zeroes the diplomatic bucket for DW', () => {
    // variantCountsForCode JSDoc: diplomatic zero after column-4+5 code
    expect(variantCountsForCode('DW')?.buckets[5]).toEqual({
      plateTypes: ['diplomatic'],
      count: 0,
    });
  });

  it('sets total for DW to the sum of the six bucket counts', () => {
    // total = ordinary2 + 0 + 0 + vintage2 + 0 + 0 = 1432998+2979 = 1435977
    // VariantCounts.total JSDoc — variant-counts.d.ts
    expect(variantCountsForCode('DW')?.total).toBe(total2);
  });

  it('gives DX the same counts as DW (same two-character templates)', () => {
    // Annex 13 / registry: Wrocław suffixes W,X → DX; lit. a templates by code length — JSDoc
    expect(variantCountsForCode('DX')).toEqual(variantCountsForCode('DW'));
  });

  it('gives VW the same counts as DW (secondary letter, same length)', () => {
    // Annex 13 / registry: dolnośląskie secondary V; fullCodes secondary×suffix; lit. a by length
    expect(variantCountsForCode('VW')).toEqual(variantCountsForCode('DW'));
  });

  it('gives WA the same two-character counts as DW', () => {
    // Annex 13 / registry: m.st. Warszawa suffix A → WA; two-character → lit. a (R-24/R-27/R-30)
    expect(variantCountsForCode('WA')?.total).toBe(total2);
  });

  it('counts ordinary variants for DBL with shared lit. b layouts once', () => {
    // cars3=866799 (R-25) + motoOnly3=111600 (R-28 after share) = 978399
    // variantCountsForCode JSDoc share rule; Annex 13 / registry bolesławiecki BL → DBL
    expect(variantCountsForCode('DBL')?.buckets[0]).toEqual({
      plateTypes: ['ordinary'],
      count: ordinary3,
    });
  });

  it('counts vintage variants for DBL from pkt 5 lit. b', () => {
    // Derivation: 9*20 + 99 + 20*9 = 180+99+180 = 459 — § 30 ust. 2 pkt 5 lit. b (R-31)
    expect(variantCountsForCode('DBL')?.buckets[3]).toEqual({
      plateTypes: ['vintage'],
      count: vintage3,
    });
  });

  it('sets total for DBL to ordinary3 plus vintage3', () => {
    // 978399+459 = 978858; other buckets 0 after column-4+5 — JSDoc
    expect(variantCountsForCode('DBL')?.total).toBe(total3);
  });

  it('zeroes reduced, individual, temporary and diplomatic buckets for DBL', () => {
    // variantCountsForCode JSDoc: those four are zero after a column-4+5 code
    const result = variantCountsForCode('DBL');
    expect([
      result?.buckets[1],
      result?.buckets[2],
      result?.buckets[4],
      result?.buckets[5],
    ]).toEqual([...emptyReducedIndividualTemporaryDiplomatic]);
  });

  it('gives DWR the same three-character counts as DBL', () => {
    // Annex 13 / registry: wrocławski WR → DWR; three-character → lit. b templates
    expect(variantCountsForCode('DWR')?.total).toBe(total3);
  });

  it('returns undefined for WC which is not a registry full code', () => {
    // variantCountsForCode JSDoc: undefined when code is not a full code of the current registry
    // Annex 13 / registry: no WC under mazowieckie
    expect(variantCountsForCode('WC')).toBeUndefined();
  });

  it('returns undefined for a single column-4 letter', () => {
    // Not a column-4+5 full code — variantCountsForCode JSDoc
    expect(variantCountsForCode('D')).toBeUndefined();
  });

  it('returns undefined for a column-6 letter-digit code', () => {
    // W0 is Annex 13 column 6 (temporary/individual), not columns 4×5 — JSDoc / model.ts Region1
    expect(variantCountsForCode('W0')).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    // Not a full code of the current registry — variantCountsForCode JSDoc
    expect(variantCountsForCode('')).toBeUndefined();
  });

  it('uses the six plateTypes tuples in the documented bucket order for DW', () => {
    // VariantCounts.buckets JSDoc: ordinary; ordinary+vintage+temporary; individual;
    // vintage; temporary; diplomatic
    expect(
      variantCountsForCode('DW')?.buckets.map((b) => [...b.plateTypes]),
    ).toEqual([
      ['ordinary'],
      ['ordinary', 'vintage', 'temporary'],
      ['individual'],
      ['vintage'],
      ['temporary'],
      ['diplomatic'],
    ]);
  });
});
