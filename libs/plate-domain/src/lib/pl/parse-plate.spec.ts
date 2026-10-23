import { fullCodes, registry } from '@plate-region/plate-data';
import type { Region1, Region2 } from '@plate-region/plate-data';

import { PLATE_ALPHABET } from './alphabet';
import { parsePlate } from './parse-plate';
import type { ParseResult } from './parse-plate';

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

const resolved = (
  region1: Region1,
  region2: Region2,
): Extract<ParseResult, { status: 'resolved' }> => ({
  status: 'resolved',
  country: 'PL',
  region1,
  region2,
});

const region1Only = (
  region1: Region1,
): Extract<ParseResult, { status: 'region1-only' }> => ({
  status: 'region1-only',
  country: 'PL',
  region1,
});

const ambiguous = (
  region1: Region1,
  region2: Region2,
): Extract<ParseResult, { status: 'ambiguous' }> => ({
  status: 'ambiguous',
  country: 'PL',
  region1,
  region2,
});

const region2NotInRegistry = (
  region1: Region1,
): Extract<ParseResult, { status: 'region2-not-in-registry' }> => ({
  status: 'region2-not-in-registry',
  country: 'PL',
  region1,
});

const notInRegistry: Extract<ParseResult, { status: 'not-in-registry' }> = {
  status: 'not-in-registry',
  country: 'PL',
};

const noMatchingFormat: Extract<
  ParseResult,
  { status: 'invalid-input'; reason: 'no-matching-format' }
> = {
  status: 'invalid-input',
  country: 'PL',
  reason: 'no-matching-format',
};

const empty: Extract<ParseResult, { status: 'empty' }> = {
  status: 'empty',
  country: 'PL',
};

describe('parsePlate', () => {
  describe('prefix conflicts and plate families', () => {
    it.each([
      {
        input: 'DWL123',
        expected: resolved(
          region1ByName('dolnośląskie'),
          region2By('D', 'Wrocław'),
        ),
        citation: '§ 30 ust. 2 pkt 3 lit. a tiret 5',
      },
      {
        input: 'DWRA12',
        expected: resolved(
          region1ByName('dolnośląskie'),
          region2By('D', 'Wrocław'),
        ),
        citation: '§ 30 ust. 2 pkt 3 lit. a tiret 8',
      },
      {
        input: 'KRA123',
        expected: resolved(
          region1ByName('małopolskie'),
          region2By('K', 'Kraków'),
        ),
        citation: '§ 30 ust. 2 pkt 3 lit. a tiret 5',
      },
      {
        input: 'WPR123',
        expected: resolved(
          region1ByName('mazowieckie'),
          region2By('W', 'Płock'),
        ),
        citation: '§ 30 ust. 2 pkt 3 lit. a tiret 5',
      },
      {
        input: 'DWR12',
        expected: resolved(
          region1ByName('dolnośląskie'),
          region2By('D', 'wrocławski'),
        ),
        citation: '§ 30 ust. 2 pkt 5 lit. b tiret 2',
      },
      {
        input: 'DWR1234',
        expected: noMatchingFormat,
        citation:
          '§ 30 ust. 2 pkt 1/3/5 lit. b — no DDDD after a 3-character code',
      },
      {
        input: 'DWB123',
        expected: noMatchingFormat,
        citation: '§ 31 ust. 1 — letter B excluded from the vehicle part',
      },
      {
        input: 'WA12',
        expected: region1Only(region1ByName('mazowieckie')),
        citation: '§ 30 ust. 2 pkt 2 lit. d',
      },
      {
        input: 'KRA1',
        expected: region1Only(region1ByName('małopolskie')),
        citation: '§ 30 ust. 2 pkt 2 lit. f',
      },
      {
        input: 'DWR1',
        expected: region1Only(region1ByName('dolnośląskie')),
        citation: '§ 30 ust. 2 pkt 2 lit. f',
      },
      {
        input: 'WAC1',
        expected: region1Only(region1ByName('mazowieckie')),
        citation: '§ 30 ust. 2 pkt 2 lit. f',
      },
      {
        input: 'W012',
        expected: region1Only(region1ByName('mazowieckie')),
        citation: '§ 30 ust. 2 pkt 2 lit. a',
      },
      {
        input: 'PK01234',
        expected: resolved(
          region1ByName('wielkopolskie'),
          region2By('P', 'Kalisz'),
        ),
        citation: '§ 30 ust. 2 pkt 1 lit. a tiret 1 (L1)',
      },
      {
        input: 'PKO1234',
        expected: resolved(
          region1ByName('wielkopolskie'),
          region2By('P', 'Kalisz'),
        ),
        citation: '§ 30 ust. 2 pkt 1 lit. a tiret 1 (L2)',
      },
      {
        input: 'SO1234',
        expected: resolved(
          region1ByName('śląskie'),
          region2By('S', 'Sosnowiec'),
        ),
        citation: '§ 30 ust. 2 pkt 3 lit. a tiret 1',
      },
      {
        input: 'S01234',
        expected: region1Only(region1ByName('śląskie')),
        citation: '§ 30 ust. 2 pkt 6',
      },
      {
        input: 'SO12345',
        expected: resolved(
          region1ByName('śląskie'),
          region2By('S', 'Sosnowiec'),
        ),
        citation: '§ 30 ust. 2 pkt 1 lit. a tiret 1',
      },
      {
        input: 'S012345',
        expected: region1Only(region1ByName('śląskie')),
        citation: '§ 30 ust. 2 pkt 7',
      },
      {
        input: 'SOAC12',
        expected: resolved(
          region1ByName('śląskie'),
          region2By('S', 'Sosnowiec'),
        ),
        citation: '§ 30 ust. 2 pkt 3 lit. a tiret 8',
      },
      {
        input: 'S0AC12',
        expected: region1Only(region1ByName('śląskie')),
        citation: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 8',
      },
      {
        input: 'WOSAC12',
        expected: resolved(
          region1ByName('mazowieckie'),
          region2By('W', 'ostrołęcki'),
        ),
        citation: '§ 30 ust. 2 pkt 1 lit. b tiret 6',
      },
      {
        input: 'W0SAC12',
        expected: region1Only(region1ByName('mazowieckie')),
        citation: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 4',
      },
      {
        input: 'WOS1A',
        expected: resolved(
          region1ByName('mazowieckie'),
          region2By('W', 'ostrołęcki'),
        ),
        citation: '§ 30 ust. 2 pkt 5 lit. b tiret 1',
      },
      {
        input: 'W0S1A',
        expected: region1Only(region1ByName('mazowieckie')),
        citation: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 11',
      },
      {
        input: 'LBI11AC',
        expected: resolved(
          region1ByName('lubelskie'),
          region2By('L', 'bialski'),
        ),
        citation: '§ 30 ust. 2 pkt 1 lit. b tiret 2',
      },
      {
        input: 'LB111AC',
        expected: resolved(
          region1ByName('lubelskie'),
          region2By('L', 'Biała Podlaska'),
        ),
        citation: '§ 30 ust. 2 pkt 1 lit. a tiret 3',
      },
      {
        input: 'FZI12',
        expected: resolved(
          region1ByName('lubuskie'),
          region2By('F', 'zielonogórski'),
        ),
        citation: '§ 30 ust. 2 pkt 5 lit. b tiret 2',
      },
      {
        input: 'FZ112',
        expected: resolved(
          region1ByName('lubuskie'),
          region2By('F', 'Zielona Góra'),
        ),
        citation: '§ 30 ust. 2 pkt 5 lit. a tiret 2',
      },
      {
        input: 'II12345',
        expected: resolved(
          region1ByName('śląskie'),
          region2By('S', 'Siemianowice Śląskie'),
        ),
        citation: '§ 30 ust. 2 pkt 1 lit. a tiret 1',
      },
      {
        input: 'I112345',
        expected: region1Only(region1ByName('śląskie')),
        citation: '§ 30 ust. 2 pkt 7',
      },
      {
        input: 'W123456',
        expected: region1Only(region1ByName('mazowieckie')),
        citation: '§ 30 ust. 2 pkt 7',
      },
      {
        input: 'DW12345',
        expected: resolved(
          region1ByName('dolnośląskie'),
          region2By('D', 'Wrocław'),
        ),
        citation: '§ 30 ust. 2 pkt 1 lit. a tiret 1',
      },
      {
        input: 'DPL12345',
        expected: resolved(
          region1ByName('dolnośląskie'),
          region2By('D', 'polkowicki'),
        ),
        citation: '§ 30 ust. 2 pkt 1 lit. b tiret 7',
      },
      {
        input: 'WPL12345',
        expected: resolved(
          region1ByName('mazowieckie'),
          region2By('W', 'płocki'),
        ),
        citation: '§ 30 ust. 2 pkt 1 lit. b tiret 7',
      },
      {
        input: 'DA12345',
        expected: region2NotInRegistry(region1ByName('dolnośląskie')),
        citation: '§ 30 ust. 2 pkt 1 lit. a tiret 1; D-26',
      },
    ])('$input → $expected.status ($citation)', ({ input, expected }) => {
      expect(parsePlate(input)).toEqual(expected);
    });
  });

  describe('levels, normalisation and restrictions', () => {
    it.each([
      {
        input: 'WOO1A',
        expected: ambiguous(
          region1ByName('mazowieckie'),
          region2By('W', 'Ostrołęka'),
        ),
        citation:
          'L2.1 ambiguous: WO01A § 30 ust. 2 pkt 5 lit. a tiret 1 / W0O1A pkt 4 LDL',
      },
      {
        input: 'WII22',
        expected: ambiguous(
          region1ByName('mazowieckie'),
          region2By('W', 'm.st. Warszawa'),
        ),
        citation:
          'L2.1 ambiguous: WI122 § 30 ust. 2 pkt 5 lit. a tiret 2 / W1I22 pkt 4 LDD',
      },
      {
        input: 'SOI234',
        expected: resolved(
          region1ByName('śląskie'),
          region2By('S', 'Sosnowiec'),
        ),
        citation:
          'L2.1 resolved: SO1234 § 30 ust. 2 pkt 3 lit. a tiret 1 (S01234 is L2.2)',
      },
      {
        input: 'DBI22',
        expected: resolved(
          region1ByName('dolnośląskie'),
          region2By('D', 'Wałbrzych'),
        ),
        citation: 'L2.1 resolved: § 30 ust. 2 pkt 5 lit. a tiret 2',
      },
      {
        input: 'DO12345',
        expected: region1Only(region1ByName('dolnośląskie')),
        citation: 'L2.1 region1-only: D012345 § 30 ust. 2 pkt 7',
      },
      {
        input: 'W1I22AC',
        expected: resolved(
          region1ByName('mazowieckie'),
          region2By('W', 'm.st. Warszawa'),
        ),
        citation:
          'L2.2 resolved: WI122AC § 30 ust. 2 pkt 1 lit. a tiret 3 (one-sub empty)',
      },
      {
        input: 'SO0I2',
        expected: region1Only(region1ByName('śląskie')),
        citation:
          'L2.2 region1-only: S0OI2 § 30 ust. 2 pkt 4 LLD (one-sub empty)',
      },
      {
        input: 'IA12345',
        expected: region2NotInRegistry(region1ByName('śląskie')),
        citation: 'L3: secondary letter I; § 30 ust. 2 pkt 1 lit. a tiret 1',
      },
      {
        input: '0P12345',
        expected: resolved(region1ByName('opolskie'), region2By('O', 'Opole')),
        citation:
          'first-position look-alike #35; § 30 ust. 2 pkt 1 lit. a tiret 1',
      },
      {
        input: '1B12345',
        expected: resolved(
          region1ByName('śląskie'),
          region2By('S', 'Bielsko-Biała'),
        ),
        citation:
          'first-position look-alike → IB; § 30 ust. 2 pkt 1 lit. a tiret 1',
      },
      {
        input: 'D0ABCDE',
        expected: region1Only(region1ByName('dolnośląskie')),
        citation:
          '§ 30 ust. 2 pkt 4; § 32 ust. 2 as amended by Dz.U. 2025 poz. 939 § 1 pkt 3',
      },
      {
        input: 'DW00000',
        expected: noMatchingFormat,
        citation: '§ 30 ust. 2 pkt 1 lit. a tiret 1 — od 00001',
      },
      {
        input: 'W000000',
        expected: noMatchingFormat,
        citation: '§ 30 ust. 2 pkt 7 — od 000001',
      },
    ])('$input → $expected.status ($citation)', ({ input, expected }) => {
      expect(parsePlate(input)).toEqual(expected);
    });

    it('same region2 via several suffixes: WA12345 and WY12345 → m.st. Warszawa by reference', () => {
      // § 30 ust. 2 pkt 1 lit. a tiret 1
      const warszawa = region2By('W', 'm.st. Warszawa');
      const mazowieckie = region1ByName('mazowieckie');
      const fromWA = parsePlate('WA12345');
      const fromWY = parsePlate('WY12345');
      expect(fromWA).toEqual(resolved(mazowieckie, warszawa));
      expect(fromWY).toEqual(resolved(mazowieckie, warszawa));
      expect(fromWA.status === 'resolved' && fromWA.region2).toBe(warszawa);
      expect(fromWY.status === 'resolved' && fromWY.region2).toBe(warszawa);
    });

    it('same region2 via several suffixes: WPP12345 and WPS12345 → pruszkowski by reference', () => {
      // § 30 ust. 2 pkt 1 lit. b tiret 7
      const pruszkowski = region2By('W', 'pruszkowski');
      const mazowieckie = region1ByName('mazowieckie');
      const fromWPP = parsePlate('WPP12345');
      const fromWPS = parsePlate('WPS12345');
      expect(fromWPP).toEqual(resolved(mazowieckie, pruszkowski));
      expect(fromWPS).toEqual(resolved(mazowieckie, pruszkowski));
      expect(fromWPP.status === 'resolved' && fromWPP.region2).toBe(
        pruszkowski,
      );
      expect(fromWPS.status === 'resolved' && fromWPS.region2).toBe(
        pruszkowski,
      );
    });
  });

  describe('incomplete and invalid input', () => {
    it.each([
      { input: 'D', citation: 'incomplete; candidates while typing are #39' },
      { input: 'DW', citation: 'incomplete; candidates while typing are #39' },
      { input: 'WA1', citation: 'incomplete; candidates while typing are #39' },
      { input: 'KR', citation: 'incomplete; candidates while typing are #39' },
      { input: 'S0', citation: 'incomplete; candidates while typing are #39' },
      { input: 'D2', citation: 'incomplete; candidates while typing are #39' },
      {
        input: '2A12345',
        citation: '§ 30 ust. 2 pkt 1–7 — no template starts with a digit',
      },
      {
        input: '9',
        citation: '§ 30 ust. 2 pkt 1–7 — no template starts with a digit',
      },
      {
        input: 'DWL1234',
        citation: 'no matching vehicle-part template after DWL',
      },
    ])('$input → no-matching-format ($citation)', ({ input }) => {
      expect(parsePlate(input)).toEqual(noMatchingFormat);
    });

    it.each([
      // Provisional until #38 replaces these expectations.
      { input: 'HA12345' },
      { input: 'UA12345' },
      { input: 'H' },
      { input: 'H0' },
    ])('$input → not-in-registry (provisional for #38)', ({ input }) => {
      expect(parsePlate(input)).toEqual(notInRegistry);
    });

    it.each([
      {
        input: 'DW 1234Q',
        expected: {
          status: 'invalid-input' as const,
          country: 'PL' as const,
          reason: 'invalid-characters' as const,
          invalidCharacters: ['Q'],
        },
      },
      {
        input: 'WA Ł12',
        expected: {
          status: 'invalid-input' as const,
          country: 'PL' as const,
          reason: 'invalid-characters' as const,
          invalidCharacters: ['Ł'],
        },
      },
    ])('$input → invalid-characters', ({ input, expected }) => {
      expect(parsePlate(input)).toEqual(expected);
    });

    it.each([{ input: '' }, { input: ' -. ' }])(
      '$input → empty (passes on the TDD stub)',
      ({ input }) => {
        expect(parsePlate(input)).toEqual(empty);
      },
    );
  });

  describe('registry passes and properties', () => {
    it('every full code (689) plus a cited vehicle part → resolved with that region2 and region1 by reference', () => {
      // Length 2: § 30 ust. 2 pkt 1 lit. a tiret 1 (DDDDD).
      // Length 3: § 30 ust. 2 pkt 1 lit. b tiret 7 (DDDDD).
      const violations: string[] = [];
      let codeCount = 0;

      for (const region1 of registry.region1) {
        for (const region2 of registry.region2.filter(
          (r) => r.region1Letter === region1.letters[0],
        )) {
          for (const code of fullCodes(region1, region2)) {
            codeCount += 1;
            const result = parsePlate(`${code}12345`);
            if (
              result.status !== 'resolved' ||
              result.region1 !== region1 ||
              result.region2 !== region2
            ) {
              violations.push(
                `${code}12345: expected resolved → ${region2.name}, got ${JSON.stringify(result)}`,
              );
            }
          }
        }
      }

      expect(codeCount).toBe(689);
      expect(violations).toEqual([]);
    });

    it('every column-4 letter (23) plus 123 → region1-only by reference (§ 30 ust. 2 pkt 2 lit. a)', () => {
      // Replaces #36 "23 letters" pass.
      const violations: string[] = [];
      let letterCount = 0;

      for (const region1 of registry.region1) {
        for (const letter of region1.letters) {
          letterCount += 1;
          const result = parsePlate(`${letter}123`);
          if (result.status !== 'region1-only' || result.region1 !== region1) {
            violations.push(
              `${letter}123: expected region1-only → ${region1.name}, got ${JSON.stringify(result)}`,
            );
          }
        }
      }

      expect(letterCount).toBe(23);
      expect(violations).toEqual([]);
    });

    it('every column-6 code (230) plus 1234 → region1-only by reference (§ 30 ust. 2 pkt 6)', () => {
      // Replaces #36 "230 codes" pass.
      const violations: string[] = [];
      let codeCount = 0;

      for (const region1 of registry.region1) {
        for (const code of region1.letterDigitCodes) {
          codeCount += 1;
          const result = parsePlate(`${code}1234`);
          if (result.status !== 'region1-only' || result.region1 !== region1) {
            violations.push(
              `${code}1234: expected region1-only → ${region1.name}, got ${JSON.stringify(result)}`,
            );
          }
        }
      }

      expect(codeCount).toBe(230);
      expect(violations).toEqual([]);
    });

    it("alphabet letters outside column 4 are exactly ['H', 'U'] → not-in-registry (provisional for #38)", () => {
      // Transferred from #36.
      const column4Letters = new Set<string>(
        registry.region1.flatMap((r) => [...r.letters]),
      );
      const outside = [...PLATE_ALPHABET].filter(
        (char) => !/\d/.test(char) && !column4Letters.has(char),
      );
      expect(outside).toEqual(['H', 'U']);

      const violations = outside.flatMap((letter) => {
        const result = parsePlate(letter);
        return result.status === 'not-in-registry'
          ? []
          : [
              `${letter}: expected not-in-registry, got ${JSON.stringify(result)}`,
            ];
      });
      expect(violations).toEqual([]);
    });

    it('digits 2–9 as the first character → no-matching-format (§ 30 ust. 2 pkt 1–7)', () => {
      // Transferred from #36 (was not-in-registry).
      const violations = ['2', '3', '4', '5', '6', '7', '8', '9'].flatMap(
        (digit) => {
          const result = parsePlate(digit);
          return result.status === 'invalid-input' &&
            result.reason === 'no-matching-format'
            ? []
            : [
                `${digit}: expected no-matching-format, got ${JSON.stringify(result)}`,
              ];
        },
      );
      expect(violations).toEqual([]);
    });

    it.each([
      {
        withSeparators: 'DW 12345',
        without: 'DW12345',
        expected: resolved(
          region1ByName('dolnośląskie'),
          region2By('D', 'Wrocław'),
        ),
        citation: '§ 30 ust. 2 pkt 1 lit. a tiret 1',
      },
      {
        withSeparators: 'KR.A123',
        without: 'KRA123',
        expected: resolved(
          region1ByName('małopolskie'),
          region2By('K', 'Kraków'),
        ),
        citation: '§ 30 ust. 2 pkt 3 lit. a tiret 5',
      },
      {
        withSeparators: 'W A12',
        without: 'WA12',
        expected: region1Only(region1ByName('mazowieckie')),
        citation: '§ 30 ust. 2 pkt 2 lit. d',
      },
      {
        withSeparators: 'S0 1234',
        without: 'S01234',
        expected: region1Only(region1ByName('śląskie')),
        citation: '§ 30 ust. 2 pkt 6',
      },
      {
        withSeparators: 'DA-12345',
        without: 'DA12345',
        expected: region2NotInRegistry(region1ByName('dolnośląskie')),
        citation: '§ 30 ust. 2 pkt 1 lit. a tiret 1; D-26',
      },
      {
        withSeparators: 'DWL 123',
        without: 'DWL123',
        expected: resolved(
          region1ByName('dolnośląskie'),
          region2By('D', 'Wrocław'),
        ),
        citation:
          '§ 30 ust. 2 pkt 3 lit. a tiret 5; group boundary unused (D-31)',
      },
    ])(
      'separator property: $withSeparators = $without → $expected.status ($citation)',
      ({ withSeparators, without, expected }) => {
        expect(parsePlate(withSeparators)).toEqual(expected);
        expect(parsePlate(without)).toEqual(expected);
      },
    );
  });
});
