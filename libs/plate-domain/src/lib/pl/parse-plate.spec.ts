import { fullCodes, registry } from '@plate-region/plate-data';
import type { Region1, Region2 } from '@plate-region/plate-data';

import { PLATE_ALPHABET } from './alphabet';
import { parsePlate } from './parse-plate';
import type { ParseResult } from './parse-plate';
import type { PlateTypes } from './plate-type';

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
  plateTypes: PlateTypes,
): Extract<ParseResult, { status: 'resolved' }> => ({
  status: 'resolved',
  country: 'PL',
  region1,
  region2,
  plateTypes,
});

const region1Only = (
  region1: Region1,
  plateTypes: PlateTypes,
): Extract<ParseResult, { status: 'region1-only' }> => ({
  status: 'region1-only',
  country: 'PL',
  region1,
  plateTypes,
});

const ambiguous = (
  region1: Region1,
  withRegion2: { region2: Region2; plateTypes: PlateTypes },
  withoutPlateTypes: PlateTypes,
): Extract<ParseResult, { status: 'ambiguous' }> => ({
  status: 'ambiguous',
  country: 'PL',
  region1,
  withRegion2: {
    region2: withRegion2.region2,
    plateTypes: withRegion2.plateTypes,
  },
  withoutRegion2: { plateTypes: withoutPlateTypes },
});

const region2NotInRegistry = (
  region1: Region1,
  plateTypes: PlateTypes,
): Extract<ParseResult, { status: 'region2-not-in-registry' }> => ({
  status: 'region2-not-in-registry',
  country: 'PL',
  region1,
  plateTypes,
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

const ORDINARY = ['ordinary'] as const satisfies PlateTypes;
const VINTAGE = ['vintage'] as const satisfies PlateTypes;
const TEMPORARY = ['temporary'] as const satisfies PlateTypes;
const DIPLOMATIC = ['diplomatic'] as const satisfies PlateTypes;
const INDIVIDUAL = ['individual'] as const satisfies PlateTypes;
const REDUCED = [
  'ordinary',
  'vintage',
  'temporary',
] as const satisfies PlateTypes;

describe('parsePlate', () => {
  describe('prefix conflicts and plate families', () => {
    it.each([
      {
        input: 'DWL123',
        expected: resolved(
          region1ByName('dolnośląskie'),
          region2By('D', 'Wrocław'),
          ORDINARY,
        ),
        citation: '§ 30 ust. 2 pkt 3 lit. a tiret 5 (R-27)',
      },
      {
        input: 'DWRA12',
        expected: resolved(
          region1ByName('dolnośląskie'),
          region2By('D', 'Wrocław'),
          ORDINARY,
        ),
        citation: '§ 30 ust. 2 pkt 3 lit. a tiret 8 (R-27)',
      },
      {
        input: 'KRA123',
        expected: resolved(
          region1ByName('małopolskie'),
          region2By('K', 'Kraków'),
          ORDINARY,
        ),
        citation: '§ 30 ust. 2 pkt 3 lit. a tiret 5 (R-27)',
      },
      {
        input: 'WPR123',
        expected: resolved(
          region1ByName('mazowieckie'),
          region2By('W', 'Płock'),
          ORDINARY,
        ),
        citation: '§ 30 ust. 2 pkt 3 lit. a tiret 5 (R-27)',
      },
      {
        input: 'DWR12',
        expected: resolved(
          region1ByName('dolnośląskie'),
          region2By('D', 'wrocławski'),
          VINTAGE,
        ),
        citation: '§ 30 ust. 2 pkt 5 lit. b tiret 2 (R-31)',
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
        citation:
          '§ 31 ust. 1 (R-36) — letter B excluded from the vehicle part',
      },
      {
        input: 'WA12',
        expected: region1Only(region1ByName('mazowieckie'), REDUCED),
        citation: '§ 30 ust. 2 pkt 2 lit. d (R-26, R-35, R-43)',
      },
      {
        input: 'KRA1',
        expected: region1Only(region1ByName('małopolskie'), REDUCED),
        citation: '§ 30 ust. 2 pkt 2 lit. f (R-26, R-35, R-43)',
      },
      {
        input: 'DWR1',
        expected: region1Only(region1ByName('dolnośląskie'), REDUCED),
        citation: '§ 30 ust. 2 pkt 2 lit. f (R-26, R-35, R-43)',
      },
      {
        input: 'WAC1',
        expected: region1Only(region1ByName('mazowieckie'), REDUCED),
        citation: '§ 30 ust. 2 pkt 2 lit. f (R-26, R-35, R-43)',
      },
      {
        input: 'W012',
        expected: region1Only(region1ByName('mazowieckie'), REDUCED),
        citation: '§ 30 ust. 2 pkt 2 lit. a (R-26, R-35, R-43)',
      },
      {
        input: 'PK01234',
        expected: resolved(
          region1ByName('wielkopolskie'),
          region2By('P', 'Kalisz'),
          ORDINARY,
        ),
        citation: '§ 30 ust. 2 pkt 1 lit. a tiret 1 (R-24) (L1)',
      },
      {
        input: 'PKO1234',
        expected: resolved(
          region1ByName('wielkopolskie'),
          region2By('P', 'Kalisz'),
          ORDINARY,
        ),
        citation: '§ 30 ust. 2 pkt 1 lit. a tiret 1 (R-24) (L2)',
      },
      {
        input: 'SO1234',
        expected: resolved(
          region1ByName('śląskie'),
          region2By('S', 'Sosnowiec'),
          ORDINARY,
        ),
        citation: '§ 30 ust. 2 pkt 3 lit. a tiret 1 (R-27)',
      },
      {
        input: 'S01234',
        expected: region1Only(region1ByName('śląskie'), TEMPORARY),
        citation: '§ 30 ust. 2 pkt 6 (R-32)',
      },
      {
        input: 'SO12345',
        expected: resolved(
          region1ByName('śląskie'),
          region2By('S', 'Sosnowiec'),
          ORDINARY,
        ),
        citation: '§ 30 ust. 2 pkt 1 lit. a tiret 1 (R-24)',
      },
      {
        input: 'S012345',
        expected: region1Only(region1ByName('śląskie'), DIPLOMATIC),
        citation: '§ 30 ust. 2 pkt 7 (R-33)',
      },
      {
        input: 'SOAC12',
        expected: resolved(
          region1ByName('śląskie'),
          region2By('S', 'Sosnowiec'),
          ORDINARY,
        ),
        citation: '§ 30 ust. 2 pkt 3 lit. a tiret 8 (R-27)',
      },
      {
        input: 'S0AC12',
        expected: region1Only(region1ByName('śląskie'), INDIVIDUAL),
        citation: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 8 (R-29, R-44)',
      },
      {
        input: 'WOSAC12',
        expected: resolved(
          region1ByName('mazowieckie'),
          region2By('W', 'ostrołęcki'),
          ORDINARY,
        ),
        citation:
          '§ 30 ust. 2 pkt 1 lit. b tiret 6 (R-25) / pkt 3 lit. b tiret 6 (R-28)',
      },
      {
        input: 'W0SAC12',
        expected: region1Only(region1ByName('mazowieckie'), INDIVIDUAL),
        citation: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 4 (R-29, R-44)',
      },
      {
        input: 'WOS1A',
        expected: resolved(
          region1ByName('mazowieckie'),
          region2By('W', 'ostrołęcki'),
          VINTAGE,
        ),
        citation: '§ 30 ust. 2 pkt 5 lit. b tiret 1 (R-31)',
      },
      {
        input: 'W0S1A',
        expected: region1Only(region1ByName('mazowieckie'), INDIVIDUAL),
        citation: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 11 (R-29, R-44)',
      },
      {
        input: 'LBI11AC',
        expected: resolved(
          region1ByName('lubelskie'),
          region2By('L', 'bialski'),
          ORDINARY,
        ),
        citation:
          '§ 30 ust. 2 pkt 1 lit. b tiret 2 (R-25) / pkt 3 lit. b tiret 2 (R-28)',
      },
      {
        input: 'LB111AC',
        expected: resolved(
          region1ByName('lubelskie'),
          region2By('L', 'Biała Podlaska'),
          ORDINARY,
        ),
        citation: '§ 30 ust. 2 pkt 1 lit. a tiret 3 (R-24)',
      },
      {
        input: 'FZI12',
        expected: resolved(
          region1ByName('lubuskie'),
          region2By('F', 'zielonogórski'),
          VINTAGE,
        ),
        citation: '§ 30 ust. 2 pkt 5 lit. b tiret 2 (R-31)',
      },
      {
        input: 'FZ112',
        expected: resolved(
          region1ByName('lubuskie'),
          region2By('F', 'Zielona Góra'),
          VINTAGE,
        ),
        citation: '§ 30 ust. 2 pkt 5 lit. a tiret 2 (R-30)',
      },
      {
        input: 'II12345',
        expected: resolved(
          region1ByName('śląskie'),
          region2By('S', 'Siemianowice Śląskie'),
          ORDINARY,
        ),
        citation: '§ 30 ust. 2 pkt 1 lit. a tiret 1 (R-24)',
      },
      {
        input: 'I112345',
        expected: region1Only(region1ByName('śląskie'), DIPLOMATIC),
        citation: '§ 30 ust. 2 pkt 7 (R-33)',
      },
      {
        input: 'W123456',
        expected: region1Only(region1ByName('mazowieckie'), DIPLOMATIC),
        citation: '§ 30 ust. 2 pkt 7 (R-33)',
      },
      {
        input: 'DW12345',
        expected: resolved(
          region1ByName('dolnośląskie'),
          region2By('D', 'Wrocław'),
          ORDINARY,
        ),
        citation: '§ 30 ust. 2 pkt 1 lit. a tiret 1 (R-24)',
      },
      {
        input: 'DPL12345',
        expected: resolved(
          region1ByName('dolnośląskie'),
          region2By('D', 'polkowicki'),
          ORDINARY,
        ),
        citation: '§ 30 ust. 2 pkt 1 lit. b tiret 7 (R-25)',
      },
      {
        input: 'WPL12345',
        expected: resolved(
          region1ByName('mazowieckie'),
          region2By('W', 'płocki'),
          ORDINARY,
        ),
        citation: '§ 30 ust. 2 pkt 1 lit. b tiret 7 (R-25)',
      },
      {
        input: 'DA12345',
        expected: region2NotInRegistry(region1ByName('dolnośląskie'), ORDINARY),
        citation: '§ 30 ust. 2 pkt 1 lit. a tiret 1 (R-24); D-26',
      },
      {
        input: 'DA123',
        expected: region2NotInRegistry(region1ByName('dolnośląskie'), VINTAGE),
        citation: '§ 30 ust. 2 pkt 5 lit. a tiret 2 (R-30); D-26',
      },
      {
        input: 'D0ABCDE',
        expected: region1Only(region1ByName('dolnośląskie'), INDIVIDUAL),
        citation:
          '§ 30 ust. 2 pkt 4 (R-29); § 31 ust. 1 (R-36); § 32 ust. 2 (R-39)',
      },
      {
        input: 'S0I234',
        expected: region1Only(region1ByName('śląskie'), TEMPORARY),
        citation:
          'L2.1 temporary: S01234 § 30 ust. 2 pkt 6 (R-32); position 4 never swapped',
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
          {
            region2: region2By('W', 'Ostrołęka'),
            plateTypes: VINTAGE,
          },
          INDIVIDUAL,
        ),
        citation:
          'L2.1 ambiguous: WO01A § 30 ust. 2 pkt 5 lit. a tiret 1 (R-30) / W0O1A pkt 4 LDL (R-29)',
      },
      {
        input: 'WII22',
        expected: ambiguous(
          region1ByName('mazowieckie'),
          {
            region2: region2By('W', 'm.st. Warszawa'),
            plateTypes: VINTAGE,
          },
          INDIVIDUAL,
        ),
        citation:
          'L2.1 ambiguous: WI122 § 30 ust. 2 pkt 5 lit. a tiret 2 (R-30) / W1I22 pkt 4 LDD (R-29)',
      },
      {
        input: 'WIIK12',
        expected: ambiguous(
          region1ByName('mazowieckie'),
          {
            region2: region2By('W', 'm.st. Warszawa'),
            plateTypes: ORDINARY,
          },
          INDIVIDUAL,
        ),
        citation:
          'L2.1 ambiguous: WI1K12 § 30 ust. 2 pkt 3 lit. a tiret 4 (R-27) / W1IK12 pkt 4 LLDD (R-29)',
      },
      {
        input: 'WIIKK12',
        expected: ambiguous(
          region1ByName('mazowieckie'),
          {
            region2: region2By('W', 'm.st. Warszawa'),
            plateTypes: ORDINARY,
          },
          INDIVIDUAL,
        ),
        citation:
          'L2.1 ambiguous: WI1KK12 § 30 ust. 2 pkt 1 lit. a tiret 5 (R-24) / W1IKK12 pkt 4 LLLDD (R-29)',
      },
      {
        input: 'SOI234',
        expected: resolved(
          region1ByName('śląskie'),
          region2By('S', 'Sosnowiec'),
          ORDINARY,
        ),
        citation:
          'L2.1 resolved: SO1234 § 30 ust. 2 pkt 3 lit. a tiret 1 (R-27) (S01234 is L2.2)',
      },
      {
        input: 'DBI22',
        expected: resolved(
          region1ByName('dolnośląskie'),
          region2By('D', 'Wałbrzych'),
          VINTAGE,
        ),
        citation: 'L2.1 resolved: § 30 ust. 2 pkt 5 lit. a tiret 2 (R-30)',
      },
      {
        input: 'DO12345',
        expected: region1Only(region1ByName('dolnośląskie'), DIPLOMATIC),
        citation: 'L2.1 region1-only: D012345 § 30 ust. 2 pkt 7 (R-33)',
      },
      {
        input: 'W1I22AC',
        expected: resolved(
          region1ByName('mazowieckie'),
          region2By('W', 'm.st. Warszawa'),
          ORDINARY,
        ),
        citation:
          'L2.2 resolved: WI122AC § 30 ust. 2 pkt 1 lit. a tiret 3 (R-24) (one-sub empty)',
      },
      {
        input: 'SO0I2',
        expected: region1Only(region1ByName('śląskie'), INDIVIDUAL),
        citation:
          'L2.2 region1-only: S0OI2 § 30 ust. 2 pkt 4 LLD (R-29) (one-sub empty)',
      },
      {
        input: 'IA12345',
        expected: region2NotInRegistry(region1ByName('śląskie'), ORDINARY),
        citation:
          'L3: secondary letter I; § 30 ust. 2 pkt 1 lit. a tiret 1 (R-24)',
      },
      {
        input: '0P12345',
        expected: resolved(
          region1ByName('opolskie'),
          region2By('O', 'Opole'),
          ORDINARY,
        ),
        citation:
          'first-position look-alike #35; § 30 ust. 2 pkt 1 lit. a tiret 1 (R-24)',
      },
      {
        input: '1B12345',
        expected: resolved(
          region1ByName('śląskie'),
          region2By('S', 'Bielsko-Biała'),
          ORDINARY,
        ),
        citation:
          'first-position look-alike → IB; § 30 ust. 2 pkt 1 lit. a tiret 1 (R-24)',
      },
      {
        input: 'DW00000',
        expected: noMatchingFormat,
        citation: '§ 30 ust. 2 pkt 1 lit. a tiret 1 (R-34) — od 00001',
      },
      {
        input: 'W000000',
        expected: noMatchingFormat,
        citation: '§ 30 ust. 2 pkt 7 (R-34) — od 000001',
      },
    ])('$input → $expected.status ($citation)', ({ input, expected }) => {
      expect(parsePlate(input)).toEqual(expected);
    });

    it('same region2 via several suffixes: WA12345 and WY12345 → m.st. Warszawa by reference', () => {
      // § 30 ust. 2 pkt 1 lit. a tiret 1 (R-24)
      const warszawa = region2By('W', 'm.st. Warszawa');
      const mazowieckie = region1ByName('mazowieckie');
      const fromWA = parsePlate('WA12345');
      const fromWY = parsePlate('WY12345');
      expect(fromWA).toEqual(resolved(mazowieckie, warszawa, ORDINARY));
      expect(fromWY).toEqual(resolved(mazowieckie, warszawa, ORDINARY));
      expect(fromWA.status === 'resolved' && fromWA.region2).toBe(warszawa);
      expect(fromWY.status === 'resolved' && fromWY.region2).toBe(warszawa);
    });

    it('same region2 via several suffixes: WPP12345 and WPS12345 → pruszkowski by reference', () => {
      // § 30 ust. 2 pkt 1 lit. b tiret 7 (R-25)
      const pruszkowski = region2By('W', 'pruszkowski');
      const mazowieckie = region1ByName('mazowieckie');
      const fromWPP = parsePlate('WPP12345');
      const fromWPS = parsePlate('WPS12345');
      expect(fromWPP).toEqual(resolved(mazowieckie, pruszkowski, ORDINARY));
      expect(fromWPS).toEqual(resolved(mazowieckie, pruszkowski, ORDINARY));
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
        citation:
          '§ 30 ust. 2 pkt 1–7 (R-24–R-33) — no template starts with a digit',
      },
      {
        input: '9',
        citation:
          '§ 30 ust. 2 pkt 1–7 (R-24–R-33) — no template starts with a digit',
      },
      {
        input: 'DWL1234',
        citation: 'no matching vehicle-part template after DWL',
      },
    ])('$input → no-matching-format ($citation)', ({ input }) => {
      expect(parsePlate(input)).toEqual(noMatchingFormat);
    });

    it.each([
      // Final within Dz.U. 2024 poz. 1709; #60 may revisit (D-35, R-37, R-48).
      { input: 'HA12345' },
      { input: 'UA12345' },
      { input: 'H' },
      { input: 'H0' },
    ])('$input → not-in-registry (D-35)', ({ input }) => {
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
      '$input → empty',
      ({ input }) => {
        expect(parsePlate(input)).toEqual(empty);
      },
    );
  });

  describe('registry passes and properties', () => {
    it('every full code (689) plus a cited vehicle part → resolved with that region2 and region1 by reference', () => {
      // Length 2: § 30 ust. 2 pkt 1 lit. a tiret 1 (R-24) (DDDDD).
      // Length 3: § 30 ust. 2 pkt 1 lit. b tiret 7 (R-25) (DDDDD).
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
              result.region2 !== region2 ||
              result.plateTypes.join(',') !== 'ordinary'
            ) {
              violations.push(
                `${code}12345: expected resolved ordinary → ${region2.name}, got ${JSON.stringify(result)}`,
              );
            }
          }
        }
      }

      expect(codeCount).toBe(689);
      expect(violations).toEqual([]);
    });

    it('every column-4 letter (23) plus 123 → region1-only reduced by reference (§ 30 ust. 2 pkt 2 lit. a, R-26)', () => {
      const violations: string[] = [];
      let letterCount = 0;

      for (const region1 of registry.region1) {
        for (const letter of region1.letters) {
          letterCount += 1;
          const result = parsePlate(`${letter}123`);
          if (
            result.status !== 'region1-only' ||
            result.region1 !== region1 ||
            result.plateTypes.join(',') !== 'ordinary,vintage,temporary'
          ) {
            violations.push(
              `${letter}123: expected region1-only reduced → ${region1.name}, got ${JSON.stringify(result)}`,
            );
          }
        }
      }

      expect(letterCount).toBe(23);
      expect(violations).toEqual([]);
    });

    it('every column-6 code (230) plus 1234 → region1-only temporary by reference (§ 30 ust. 2 pkt 6, R-32)', () => {
      const violations: string[] = [];
      let codeCount = 0;

      for (const region1 of registry.region1) {
        for (const code of region1.letterDigitCodes) {
          codeCount += 1;
          const result = parsePlate(`${code}1234`);
          if (
            result.status !== 'region1-only' ||
            result.region1 !== region1 ||
            result.plateTypes.join(',') !== 'temporary'
          ) {
            violations.push(
              `${code}1234: expected region1-only temporary → ${region1.name}, got ${JSON.stringify(result)}`,
            );
          }
        }
      }

      expect(codeCount).toBe(230);
      expect(violations).toEqual([]);
    });

    it("alphabet letters outside column 4 are exactly ['H', 'U'] → not-in-registry (D-35)", () => {
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

    it('digits 2–9 as the first character → no-matching-format (§ 30 ust. 2 pkt 1–7, R-24–R-33)', () => {
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

    it('no region2 has a one-letter suffix that starts one of its own two-letter suffixes', () => {
      // Derived consequence 6: no region2 is read through both a 2-char and a 3-char code.
      const violations: string[] = [];
      for (const region2 of registry.region2) {
        const oneLetter = region2.suffixes.filter((s) => s.length === 1);
        const twoLetter = region2.suffixes.filter((s) => s.length === 2);
        for (const one of oneLetter) {
          for (const two of twoLetter) {
            if (two.startsWith(one)) {
              violations.push(
                `${region2.region1Letter}:${region2.name} suffixes ${one} / ${two}`,
              );
            }
          }
        }
      }
      expect(violations).toEqual([]);
    });

    it.each([
      {
        withSeparators: 'DW 12345',
        without: 'DW12345',
        expected: resolved(
          region1ByName('dolnośląskie'),
          region2By('D', 'Wrocław'),
          ORDINARY,
        ),
        citation: '§ 30 ust. 2 pkt 1 lit. a tiret 1 (R-24)',
      },
      {
        withSeparators: 'KR.A123',
        without: 'KRA123',
        expected: resolved(
          region1ByName('małopolskie'),
          region2By('K', 'Kraków'),
          ORDINARY,
        ),
        citation: '§ 30 ust. 2 pkt 3 lit. a tiret 5 (R-27)',
      },
      {
        withSeparators: 'W A12',
        without: 'WA12',
        expected: region1Only(region1ByName('mazowieckie'), REDUCED),
        citation: '§ 30 ust. 2 pkt 2 lit. d (R-26)',
      },
      {
        withSeparators: 'S0 1234',
        without: 'S01234',
        expected: region1Only(region1ByName('śląskie'), TEMPORARY),
        citation: '§ 30 ust. 2 pkt 6 (R-32)',
      },
      {
        withSeparators: 'DA-12345',
        without: 'DA12345',
        expected: region2NotInRegistry(region1ByName('dolnośląskie'), ORDINARY),
        citation: '§ 30 ust. 2 pkt 1 lit. a tiret 1 (R-24); D-26',
      },
      {
        withSeparators: 'DWL 123',
        without: 'DWL123',
        expected: resolved(
          region1ByName('dolnośląskie'),
          region2By('D', 'Wrocław'),
          ORDINARY,
        ),
        citation:
          '§ 30 ust. 2 pkt 3 lit. a tiret 5 (R-27); group boundary unused (D-31)',
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
