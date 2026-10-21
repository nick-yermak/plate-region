import { fullCodes } from './full-codes';
import type { Registry, Region1, Region2 } from './model';
import { registry } from './registry';

// § 30 ust. 1 Dz.U. 2024 poz. 1709 — the 25 letters used to form registration numbers (no Q).
const ALPHABET = 'ABCDEFGHIJKLMNOPRSTUVWXYZ';

const EXPECTED_SOURCES = [
  { act: 'Dz.U. 2024 poz. 1709', provision: 'załącznik nr 13' },
  { act: 'Dz.U. 2025 poz. 939', provision: '§ 1 pkt 4' },
  { act: 'Dz.U. 2026 poz. 891', provision: '§ 1 pkt 9' },
] as const;

/** Annex 13 column 4, primary first, in Lp. order. */
const EXPECTED_LETTERS: readonly (readonly string[])[] = [
  ['D', 'V'],
  ['C'],
  ['L'],
  ['F'],
  ['E'],
  ['K', 'J'],
  ['W', 'A'],
  ['O'],
  ['R', 'Y'],
  ['B'],
  ['G', 'X'],
  ['S', 'I'],
  ['T'],
  ['N'],
  ['P', 'M'],
  ['Z'],
];

/** Annex 13 rows per Lp.: [ordinal, city, land], verified against the PDF. */
const EXPECTED_PER_ORDINAL: readonly [number, number, number][] = [
  [1, 4, 26],
  [2, 4, 19],
  [3, 4, 20],
  [4, 2, 12],
  [5, 3, 21],
  [6, 3, 19],
  [7, 5, 37],
  [8, 1, 11],
  [9, 4, 21],
  [10, 3, 14],
  [11, 4, 16],
  [12, 19, 17],
  [13, 1, 13],
  [14, 2, 19],
  [15, 4, 31],
  [16, 3, 18],
];

const AMENDMENT_CODES = [
  'DWW',
  'VWW',
  'LVB',
  'ONX',
  'CCE',
  'CCM',
  'STR',
  'ITR',
  'STN',
  'ITN',
  'NOZ',
  'NOP',
] as const;

const { provenance, region1, region2 }: Registry = registry;

function region1ByPrimary(letter: string): Region1 {
  const found = region1.find((r) => r.letters[0] === letter);
  if (found === undefined) {
    throw new Error(`no region1 with primary letter ${letter}`);
  }
  return found;
}

function findRegion2(region1Letter: string, name: string): Region2[] {
  return region2.filter(
    (r) => r.region1Letter === region1Letter && r.name === name,
  );
}

function letterDigitCodesFor(letters: readonly string[]): string[] {
  return letters.flatMap((letter) =>
    Array.from({ length: 10 }, (_, digit) => `${letter}${digit}`),
  );
}

describe('registry', () => {
  describe('counts', () => {
    it('has exactly 16 region1', () => {
      expect(region1).toHaveLength(16);
    });

    it('has exactly 380 region2', () => {
      expect(region2).toHaveLength(380);
    });

    it('has exactly 66 city region2', () => {
      expect(region2.filter((r) => r.kind === 'city')).toHaveLength(66);
    });

    it('has exactly 314 land region2', () => {
      expect(region2.filter((r) => r.kind === 'land')).toHaveLength(314);
    });

    it('has the Annex 13 city and land counts per voivodeship', () => {
      const actual = region1.map((r1) => {
        const rows = region2.filter((r2) => r2.region1Letter === r1.letters[0]);
        return [
          r1.ordinal,
          rows.filter((r) => r.kind === 'city').length,
          rows.filter((r) => r.kind === 'land').length,
        ] as const;
      });
      expect(actual).toEqual(EXPECTED_PER_ORDINAL);
    });
  });

  describe('region1', () => {
    it('has ordinals 1–16 in order', () => {
      expect(region1.map((r) => r.ordinal)).toEqual(
        Array.from({ length: 16 }, (_, i) => i + 1),
      );
    });

    it('has Annex 13 column-4 letters, primary first', () => {
      expect(region1.map((r) => [...r.letters])).toEqual(EXPECTED_LETTERS);
    });

    it('uses only letters from the § 30 ust. 1 alphabet', () => {
      const violations: string[] = [];
      for (const r of region1) {
        for (const letter of r.letters) {
          if (!ALPHABET.includes(letter) || letter.length !== 1) {
            violations.push(`${r.ordinal}:${letter}`);
          }
        }
      }
      expect(violations).toEqual([]);
    });

    it('has unique letters across the registry', () => {
      const seen = new Set<string>();
      const violations: string[] = [];
      for (const r of region1) {
        for (const letter of r.letters) {
          if (seen.has(letter)) {
            violations.push(letter);
          }
          seen.add(letter);
        }
      }
      expect(violations).toEqual([]);
    });

    it('has letterDigitCodes equal to each letter × digits 0–9', () => {
      const violations: string[] = [];
      for (const r of region1) {
        const expected = letterDigitCodesFor(r.letters);
        if (
          JSON.stringify([...r.letterDigitCodes]) !== JSON.stringify(expected)
        ) {
          violations.push(`${r.ordinal}`);
        }
      }
      expect(violations).toEqual([]);
    });
  });

  describe('region2', () => {
    it('has at least one 1–2 alphabet-letter suffix on every record', () => {
      const violations: string[] = [];
      for (const r of region2) {
        if (r.suffixes.length < 1) {
          violations.push(`${r.region1Letter}:${r.name}:empty`);
          continue;
        }
        for (const suffix of r.suffixes) {
          if (
            suffix.length < 1 ||
            suffix.length > 2 ||
            [...suffix].some((c) => !ALPHABET.includes(c))
          ) {
            violations.push(`${r.region1Letter}:${r.name}:${suffix}`);
          }
        }
      }
      expect(violations).toEqual([]);
    });

    it('has region1Letter equal to the primary letter of an existing region1', () => {
      const primaries = new Set(region1.map((r) => r.letters[0]));
      const violations: string[] = [];
      for (const r of region2) {
        if (!primaries.has(r.region1Letter)) {
          violations.push(`${r.region1Letter}:${r.name}`);
        }
      }
      expect(violations).toEqual([]);
    });

    it('has unique (region1Letter, name) pairs', () => {
      const seen = new Set<string>();
      const violations: string[] = [];
      for (const r of region2) {
        const key = `${r.region1Letter}\0${r.name}`;
        if (seen.has(key)) {
          violations.push(`${r.region1Letter}:${r.name}`);
        }
        seen.add(key);
      }
      expect(violations).toEqual([]);
    });

    it('has unique full codes across the registry', () => {
      const seen = new Map<string, string>();
      const violations: string[] = [];
      for (const r2 of region2) {
        const r1 = region1ByPrimary(r2.region1Letter);
        for (const code of fullCodes(r1, r2)) {
          const owner = seen.get(code);
          if (owner !== undefined) {
            violations.push(`${code}:${owner}:${r2.region1Letter}:${r2.name}`);
          } else {
            seen.set(code, `${r2.region1Letter}:${r2.name}`);
          }
        }
      }
      expect(violations).toEqual([]);
    });
  });

  describe('provenance', () => {
    it('has legalStateDate in ISO YYYY-MM-DD form', () => {
      expect(provenance.legalStateDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('has legalStateDate that is a real calendar date', () => {
      const [year, month, day] = provenance.legalStateDate
        .split('-')
        .map(Number) as [number, number, number];
      const date = new Date(Date.UTC(year, month - 1, day));
      expect([
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate(),
      ]).toEqual([year, month, day]);
    });

    it('has sources equal to the three D-26 entries in order', () => {
      expect(provenance.sources).toEqual(EXPECTED_SOURCES);
    });
  });

  describe('spot checks', () => {
    it('has Wrocław (D) as city with full codes DW, DX, VW, VX', () => {
      const rows = findRegion2('D', 'Wrocław');
      expect(rows.map((r) => r.kind)).toEqual(['city']);
      expect(
        rows.map((r) => [...fullCodes(region1ByPrimary(r.region1Letter), r)]),
      ).toEqual([['DW', 'DX', 'VW', 'VX']]);
    });

    it('has wrocławski (D) as land with full codes DWR, DWW, VWR, VWW', () => {
      const rows = findRegion2('D', 'wrocławski');
      expect(rows.map((r) => r.kind)).toEqual(['land']);
      expect(
        rows.map((r) => [...fullCodes(region1ByPrimary(r.region1Letter), r)]),
      ).toEqual([['DWR', 'DWW', 'VWR', 'VWW']]);
    });

    it('has pruszkowski (W) with suffixes PR, PP, PS', () => {
      expect(
        findRegion2('W', 'pruszkowski').map((r) => [...r.suffixes]),
      ).toEqual([['PR', 'PP', 'PS']]);
    });

    it('keeps polkowicki (D) and płocki (W) as distinct PL-suffix records', () => {
      expect(
        findRegion2('D', 'polkowicki').map((r) => [
          ...fullCodes(region1ByPrimary(r.region1Letter), r),
        ]),
      ).toEqual([['DPL', 'VPL']]);
      expect(
        findRegion2('W', 'płocki').map((r) => [
          ...fullCodes(region1ByPrimary(r.region1Letter), r),
        ]),
      ).toEqual([['WPL', 'APL']]);
    });

    it('has m.st. Warszawa (W) as city', () => {
      expect(findRegion2('W', 'm.st. Warszawa').map((r) => r.kind)).toEqual([
        'city',
      ]);
    });

    it('has m.st. Warszawa (W) suffixes in Annex 13 order', () => {
      expect(
        findRegion2('W', 'm.st. Warszawa').map((r) => [...r.suffixes]),
      ).toEqual([
        [
          'A',
          'B',
          'D',
          'E',
          'F',
          'H',
          'I',
          'J',
          'K',
          'N',
          'T',
          'U',
          'W',
          'X',
          'Y',
        ],
      ]);
    });

    it('has piaseczyński (W) suffixes PI, PA, PW, PX', () => {
      expect(
        findRegion2('W', 'piaseczyński').map((r) => [...r.suffixes]),
      ).toEqual([['PI', 'PA', 'PW', 'PX']]);
    });

    it('has warszawski zachodni (W) with suffix Z', () => {
      expect(
        findRegion2('W', 'warszawski zachodni').map((r) => [...r.suffixes]),
      ).toEqual([['Z']]);
    });

    it('has wołomiński (W) suffixes WL, V', () => {
      expect(
        findRegion2('W', 'wołomiński').map((r) => [...r.suffixes]),
      ).toEqual([['WL', 'V']]);
    });

    it('has kędzierzyńsko-kozielski (O) as one record with exactly one hyphen', () => {
      const rows = findRegion2('O', 'kędzierzyńsko-kozielski');
      expect(rows).toHaveLength(1);
      expect(rows[0]?.name.split('-')).toHaveLength(2);
    });

    it('has Opole (O, city) suffix P and brzeski (O) suffix B', () => {
      expect(
        findRegion2('O', 'Opole').map((r) => [r.kind, [...r.suffixes]]),
      ).toEqual([['city', ['P']]]);
      expect(findRegion2('O', 'brzeski').map((r) => [...r.suffixes])).toEqual([
        ['B'],
      ]);
    });

    it('has lubelski (L) suffixes UB, VB', () => {
      expect(findRegion2('L', 'lubelski').map((r) => [...r.suffixes])).toEqual([
        ['UB', 'VB'],
      ]);
    });

    it('has nyski (O) suffixes NY, NX', () => {
      expect(findRegion2('O', 'nyski').map((r) => [...r.suffixes])).toEqual([
        ['NY', 'NX'],
      ]);
    });

    it('has chełmiński (C) suffixes CH, CE, CM', () => {
      expect(
        findRegion2('C', 'chełmiński').map((r) => [...r.suffixes]),
      ).toEqual([['CH', 'CE', 'CM']]);
    });

    it('has tarnogórski (S) suffixes TA, TR, TN', () => {
      expect(
        findRegion2('S', 'tarnogórski').map((r) => [...r.suffixes]),
      ).toEqual([['TA', 'TR', 'TN']]);
    });

    it('has olsztyński (N) suffixes OL, OZ, OP', () => {
      expect(
        findRegion2('N', 'olsztyński').map((r) => [...r.suffixes]),
      ).toEqual([['OL', 'OZ', 'OP']]);
    });

    it('includes all 12 amendment codes among full codes', () => {
      const codes = new Set<string>();
      for (const r2 of region2) {
        for (const code of fullCodes(region1ByPrimary(r2.region1Letter), r2)) {
          codes.add(code);
        }
      }
      const missing = AMENDMENT_CODES.filter((code) => !codes.has(code));
      expect(missing).toEqual([]);
    });
  });
});
