import { fullCodes, registry } from '@plate-region/plate-data';
import type { Region1, Region2 } from '@plate-region/plate-data';

import { PLATE_ALPHABET } from './alphabet';
import { candidatesFor } from './candidates';
import type { Candidate, CandidatesResult } from './candidates';
import type { PlateType } from './plate-type';

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

type PlateTypes = readonly [PlateType, ...PlateType[]];

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
const REDUCED_DIP = [
  'ordinary',
  'vintage',
  'temporary',
  'diplomatic',
] as const satisfies PlateTypes;
const TEMP_DIP = ['temporary', 'diplomatic'] as const satisfies PlateTypes;
const ALL_FIVE = [
  'ordinary',
  'individual',
  'vintage',
  'temporary',
  'diplomatic',
] as const satisfies PlateTypes;
const REDUCED_IND = [
  'ordinary',
  'individual',
  'vintage',
  'temporary',
] as const satisfies PlateTypes;
const ORDINARY_VINTAGE = ['ordinary', 'vintage'] as const satisfies PlateTypes;

function region2Entry(
  region2: Region2,
  codes: readonly [string, ...string[]],
  plateTypes: PlateTypes,
  completeAs: readonly PlateType[] = [],
): Candidate {
  return { kind: 'region2', region2, codes, plateTypes, completeAs };
}

function withoutRegion2(
  plateTypes: PlateTypes,
  completeAs: readonly PlateType[] = [],
): Candidate {
  return { kind: 'without-region2', plateTypes, completeAs };
}

function l3Entry(
  plateTypes: PlateTypes,
  completeAs: readonly PlateType[] = [],
): Candidate {
  return { kind: 'region2-not-in-registry', plateTypes, completeAs };
}

function candidates(
  region1: Region1,
  list: readonly [Candidate, ...Candidate[]],
): Extract<CandidatesResult, { status: 'candidates' }> {
  return { status: 'candidates', country: 'PL', region1, candidates: list };
}

const empty: Extract<CandidatesResult, { status: 'empty' }> = {
  status: 'empty',
  country: 'PL',
};

const notInRegistry: Extract<CandidatesResult, { status: 'not-in-registry' }> =
  {
    status: 'not-in-registry',
    country: 'PL',
  };

const noMatchingFormat: Extract<
  CandidatesResult,
  { status: 'invalid-input'; reason: 'no-matching-format' }
> = {
  status: 'invalid-input',
  country: 'PL',
  reason: 'no-matching-format',
};

/** Full codes of region2 that start with `prefix`, in plate-data `fullCodes` order. */
function codesStartingWith(
  region1: Region1,
  region2: Region2,
  prefix: string,
): readonly [string, ...string[]] {
  const matched = fullCodes(region1, region2).filter((code) =>
    code.startsWith(prefix),
  );
  const [head, ...tail] = matched;
  if (head === undefined) {
    throw new Error(`no codes of ${region2.name} start with ${prefix}`);
  }
  return [head, ...tail];
}

/** region2 of this region1 whose full codes start with `prefix`, Annex 13 order. */
function region2sWithPrefix(
  region1: Region1,
  prefix: string,
): readonly Region2[] {
  return registry.region2.filter(
    (region2) =>
      region2.region1Letter === region1.letters[0] &&
      fullCodes(region1, region2).some((code) => code.startsWith(prefix)),
  );
}

/**
 * Annex 13 column-4 letter → count of region2 with a full code starting with
 * that letter (oracle for C42; derived from the act table + secondary letters).
 */
const ANNEX13_REGION2_BY_FIRST_LETTER: Readonly<Record<string, number>> = {
  D: 30,
  V: 30,
  C: 23,
  L: 24,
  F: 14,
  E: 24,
  K: 22,
  J: 22,
  W: 42,
  A: 42,
  O: 12,
  R: 25,
  Y: 25,
  B: 17,
  G: 20,
  X: 20,
  S: 36,
  I: 36,
  T: 14,
  P: 35,
  M: 35,
  N: 21,
  Z: 21,
};

describe('candidatesFor', () => {
  describe('empty, invalid and not-in-registry', () => {
    it.each([
      { input: '', expected: empty, id: 'C01' },
      { input: ' -. ', expected: empty, id: 'C02' },
    ])('$id $input → empty', ({ input, expected }) => {
      expect(candidatesFor(input)).toEqual(expected);
    });

    it('C03 DW 1234Q → invalid-characters [Q] (R-23)', () => {
      expect(candidatesFor('DW 1234Q')).toEqual({
        status: 'invalid-input',
        country: 'PL',
        reason: 'invalid-characters',
        invalidCharacters: ['Q'],
      });
    });

    it.each([
      { input: 'H', id: 'C04' },
      { input: 'U', id: 'C05' },
    ])('$id $input → not-in-registry (R-37, R-48, D-35)', ({ input }) => {
      expect(candidatesFor(input)).toEqual(notInRegistry);
    });

    it('C06 2 → no-matching-format (R-24–R-33, D-32)', () => {
      expect(candidatesFor('2')).toEqual(noMatchingFormat);
    });
  });

  describe('single-letter prefixes', () => {
    it('C07 D → dolnośląskie: without-region2 then all 30 region2 (R-26, R-29, R-32, R-33, R-37)', () => {
      const region1 = region1ByName('dolnośląskie');
      const region2Entries = region2sWithPrefix(region1, 'D').map((region2) =>
        region2Entry(
          region2,
          codesStartingWith(region1, region2, 'D'),
          ORDINARY_VINTAGE,
        ),
      );
      expect(region2Entries).toHaveLength(30);
      const [head, ...tail] = region2Entries;
      expect(candidatesFor('D')).toEqual(
        candidates(region1, [withoutRegion2(ALL_FIVE), head, ...tail]),
      );
    });

    it('C08 V → same region2 set as codes starting with V (R-37, R-48)', () => {
      const region1 = region1ByName('dolnośląskie');
      const region2Entries = region2sWithPrefix(region1, 'V').map((region2) =>
        region2Entry(
          region2,
          codesStartingWith(region1, region2, 'V'),
          ORDINARY_VINTAGE,
        ),
      );
      expect(region2Entries).toHaveLength(30);
      const [head, ...tail] = region2Entries;
      expect(candidatesFor('V')).toEqual(
        candidates(region1, [withoutRegion2(ALL_FIVE), head, ...tail]),
      );
    });
  });

  describe('DW family and group boundaries', () => {
    const dolnoslaskie = () => region1ByName('dolnośląskie');
    const wroclaw = () => region2By('D', 'Wrocław');
    const wolowski = () => region2By('D', 'wołowski');
    const wroclawski = () => region2By('D', 'wrocławski');

    it('C09 DW → Wrocław, without-region2, wołowski, wrocławski (R-24–R-31, R-26)', () => {
      const region1 = dolnoslaskie();
      expect(candidatesFor('DW')).toEqual(
        candidates(region1, [
          region2Entry(wroclaw(), ['DW'], ORDINARY_VINTAGE),
          withoutRegion2(REDUCED),
          region2Entry(wolowski(), ['DWL'], ORDINARY_VINTAGE),
          region2Entry(wroclawski(), ['DWR', 'DWW'], ORDINARY_VINTAGE),
        ]),
      );
    });

    it('C10 DWW → wrocławski, without-region2, Wrocław (R-25, R-27, R-26)', () => {
      const region1 = dolnoslaskie();
      expect(candidatesFor('DWW')).toEqual(
        candidates(region1, [
          region2Entry(wroclawski(), ['DWW'], ORDINARY_VINTAGE),
          withoutRegion2(REDUCED),
          region2Entry(wroclaw(), ['DW'], ORDINARY),
        ]),
      );
    });

    it('C11 DW W → same set as C10, Wrocław first (D-39, D-31)', () => {
      const region1 = dolnoslaskie();
      expect(candidatesFor('DW W')).toEqual(
        candidates(region1, [
          region2Entry(wroclaw(), ['DW'], ORDINARY),
          withoutRegion2(REDUCED),
          region2Entry(wroclawski(), ['DWW'], ORDINARY_VINTAGE),
        ]),
      );
    });

    it('C12 D WW → same set as C10, without-region2 first (D-39, D-31)', () => {
      const region1 = dolnoslaskie();
      expect(candidatesFor('D WW')).toEqual(
        candidates(region1, [
          withoutRegion2(REDUCED),
          region2Entry(wroclaw(), ['DW'], ORDINARY),
          region2Entry(wroclawski(), ['DWW'], ORDINARY_VINTAGE),
        ]),
      );
    });

    it('C10–C12 share the same candidate set (D-31)', () => {
      const setOf = (input: string) => {
        const result = candidatesFor(input);
        expect(result.status).toBe('candidates');
        if (result.status !== 'candidates') {
          return new Set<string>();
        }
        return new Set(
          result.candidates.map((c) => {
            if (c.kind === 'region2') {
              return JSON.stringify({
                kind: c.kind,
                name: c.region2.name,
                codes: [...c.codes],
              });
            }
            return JSON.stringify({
              kind: c.kind,
              plateTypes: [...c.plateTypes],
            });
          }),
        );
      };
      expect(setOf('DWW')).toEqual(setOf('DW W'));
      expect(setOf('DWW')).toEqual(setOf('D WW'));
    });

    it('C13 DWL123 → Wrocław complete ordinary, wołowski completable (R-27, R-25)', () => {
      expect(candidatesFor('DWL123')).toEqual(
        candidates(dolnoslaskie(), [
          region2Entry(wroclaw(), ['DW'], ORDINARY, ORDINARY),
          region2Entry(wolowski(), ['DWL'], ORDINARY),
        ]),
      );
    });

    it('C14 DWL 123 → wołowski first (group equals DWL), then Wrocław complete (D-39)', () => {
      expect(candidatesFor('DWL 123')).toEqual(
        candidates(dolnoslaskie(), [
          region2Entry(wolowski(), ['DWL'], ORDINARY),
          region2Entry(wroclaw(), ['DW'], ORDINARY, ORDINARY),
        ]),
      );
    });
  });

  describe('issue examples and related prefixes', () => {
    it('C15 KR → Kraków, without-region2, krakowski (R-37, R-26)', () => {
      const region1 = region1ByName('małopolskie');
      expect(candidatesFor('KR')).toEqual(
        candidates(region1, [
          region2Entry(region2By('K', 'Kraków'), ['KR'], ORDINARY_VINTAGE),
          withoutRegion2(REDUCED),
          region2Entry(
            region2By('K', 'krakowski'),
            ['KRA', 'KRK'],
            ORDINARY_VINTAGE,
          ),
        ]),
      );
    });

    it('C16 S0 → only without-region2; no Sosnowiec (losing L2 code omitted; R-26, R-29, R-32, R-33, D-32)', () => {
      expect(candidatesFor('S0')).toEqual(
        candidates(region1ByName('śląskie'), [withoutRegion2(ALL_FIVE)]),
      );
    });

    it('C17 SO → only Sosnowiec (R-36, R-37)', () => {
      expect(candidatesFor('SO')).toEqual(
        candidates(region1ByName('śląskie'), [
          region2Entry(region2By('S', 'Sosnowiec'), ['SO'], ORDINARY_VINTAGE),
        ]),
      );
    });

    it('C18 WA1 → without-region2, Warszawa (R-26, R-24)', () => {
      expect(candidatesFor('WA1')).toEqual(
        candidates(region1ByName('mazowieckie'), [
          withoutRegion2(REDUCED),
          region2Entry(
            region2By('W', 'm.st. Warszawa'),
            ['WA'],
            ORDINARY_VINTAGE,
          ),
        ]),
      );
    });

    it('C19 WA12 → without-region2 complete reduced, Warszawa completable (R-26, D-27)', () => {
      expect(candidatesFor('WA12')).toEqual(
        candidates(region1ByName('mazowieckie'), [
          withoutRegion2(REDUCED, REDUCED),
          region2Entry(
            region2By('W', 'm.st. Warszawa'),
            ['WA'],
            ORDINARY_VINTAGE,
          ),
        ]),
      );
    });

    it('C20 DW12 → without-region2 complete reduced, Wrocław completable (R-26)', () => {
      expect(candidatesFor('DW12')).toEqual(
        candidates(region1ByName('dolnośląskie'), [
          withoutRegion2(REDUCED, REDUCED),
          region2Entry(region2By('D', 'Wrocław'), ['DW'], ORDINARY_VINTAGE),
        ]),
      );
    });

    it('C21 S012 → without-region2 complete reduced, diplomatic still possible (R-26, R-32, R-33)', () => {
      expect(candidatesFor('S012')).toEqual(
        candidates(region1ByName('śląskie'), [
          withoutRegion2(REDUCED_DIP, REDUCED),
        ]),
      );
    });

    it('C22 S012345 → without-region2 complete diplomatic only (R-33)', () => {
      expect(candidatesFor('S012345')).toEqual(
        candidates(region1ByName('śląskie'), [
          withoutRegion2(DIPLOMATIC, DIPLOMATIC),
        ]),
      );
    });

    it('C23 S01234 → without-region2 complete temporary, diplomatic completable (R-32, R-33)', () => {
      expect(candidatesFor('S01234')).toEqual(
        candidates(region1ByName('śląskie'), [
          withoutRegion2(TEMP_DIP, TEMPORARY),
        ]),
      );
    });
  });

  describe('complete plates, R-34 and look-alikes', () => {
    it('C24 DW12345 → Wrocław complete ordinary (R-24; agrees with parsePlate resolved)', () => {
      expect(candidatesFor('DW12345')).toEqual(
        candidates(region1ByName('dolnośląskie'), [
          region2Entry(region2By('D', 'Wrocław'), ['DW'], ORDINARY, ORDINARY),
        ]),
      );
    });

    it('C25 DWR1234 → wrocławski completable ordinary; parsePlate no-matching-format (R-25)', () => {
      expect(candidatesFor('DWR1234')).toEqual(
        candidates(region1ByName('dolnośląskie'), [
          region2Entry(region2By('D', 'wrocławski'), ['DWR'], ORDINARY),
        ]),
      );
    });

    it('C26 DWR01 → Wrocław completable, wrocławski complete vintage (R-27, R-31)', () => {
      expect(candidatesFor('DWR01')).toEqual(
        candidates(region1ByName('dolnośląskie'), [
          region2Entry(region2By('D', 'Wrocław'), ['DW'], ORDINARY),
          region2Entry(
            region2By('D', 'wrocławski'),
            ['DWR'],
            ORDINARY_VINTAGE,
            VINTAGE,
          ),
        ]),
      );
    });

    it('C27 DWR00 → Wrocław and wrocławski ordinary only; vintage DD excluded (R-34)', () => {
      expect(candidatesFor('DWR00')).toEqual(
        candidates(region1ByName('dolnośląskie'), [
          region2Entry(region2By('D', 'Wrocław'), ['DW'], ORDINARY),
          region2Entry(region2By('D', 'wrocławski'), ['DWR'], ORDINARY),
        ]),
      );
    });

    it('C28 DW0000 → Wrocław ordinary DDDDD only; open digit group (R-34)', () => {
      expect(candidatesFor('DW0000')).toEqual(
        candidates(region1ByName('dolnośląskie'), [
          region2Entry(region2By('D', 'Wrocław'), ['DW'], ORDINARY),
        ]),
      );
    });

    it('C29 DW00000 → no-matching-format (R-34; agrees with parsePlate)', () => {
      expect(candidatesFor('DW00000')).toEqual(noMatchingFormat);
    });

    it('C30 W00000 → without-region2 diplomatic completable (R-33, R-34)', () => {
      expect(candidatesFor('W00000')).toEqual(
        candidates(region1ByName('mazowieckie'), [withoutRegion2(DIPLOMATIC)]),
      );
    });

    it('C31 W000000 → no-matching-format (R-34)', () => {
      expect(candidatesFor('W000000')).toEqual(noMatchingFormat);
    });

    it('C32 WI12 → without-region2 complete at L2.1, Warszawa at L1 (D-32, D-39)', () => {
      expect(candidatesFor('WI12')).toEqual(
        candidates(region1ByName('mazowieckie'), [
          withoutRegion2(REDUCED, REDUCED),
          region2Entry(
            region2By('W', 'm.st. Warszawa'),
            ['WI'],
            ORDINARY_VINTAGE,
          ),
        ]),
      );
    });

    it('C33 WII2 → without-region2 (complete L2.2 + individual L2.1), Warszawa (D-32, R-29, R-39)', () => {
      expect(candidatesFor('WII2')).toEqual(
        candidates(region1ByName('mazowieckie'), [
          withoutRegion2(REDUCED_IND, REDUCED),
          region2Entry(
            region2By('W', 'm.st. Warszawa'),
            ['WI'],
            ORDINARY_VINTAGE,
          ),
        ]),
      );
    });

    it('C34 WOO1A → without-region2 individual, Ostrołęka vintage complete (D-27, D-32; agrees with parsePlate ambiguous)', () => {
      expect(candidatesFor('WOO1A')).toEqual(
        candidates(region1ByName('mazowieckie'), [
          withoutRegion2(INDIVIDUAL, INDIVIDUAL),
          region2Entry(
            region2By('W', 'Ostrołęka'),
            ['WO'],
            ORDINARY_VINTAGE,
            VINTAGE,
          ),
        ]),
      );
    });

    it('C47 AI0A → without-region2: complete reduced at L2.1 (A10A) + individual at completable L2.2 (A1OA; D-32, D-39, R-29)', () => {
      expect(candidatesFor('AI0A')).toEqual(
        candidates(region1ByName('mazowieckie'), [
          withoutRegion2(REDUCED_IND, REDUCED),
        ]),
      );
    });

    it('C41 DW1O → without-region2 complete reduced at L1c, Wrocław completable (D-42, R-26)', () => {
      expect(candidatesFor('DW1O')).toEqual(
        candidates(region1ByName('dolnośląskie'), [
          withoutRegion2(REDUCED, REDUCED),
          region2Entry(region2By('D', 'Wrocław'), ['DW'], ORDINARY_VINTAGE),
        ]),
      );
    });

    it('C50 DW1O2 → Wrocław complete vintage at L1c; ordinary still completable (D-42, R-30)', () => {
      expect(candidatesFor('DW1O2')).toEqual(
        candidates(region1ByName('dolnośląskie'), [
          region2Entry(
            region2By('D', 'Wrocław'),
            ['DW'],
            ORDINARY_VINTAGE,
            VINTAGE,
          ),
        ]),
      );
    });

    it('C51 DOA2I → oławski complete vintage at L1c; ordinary still completable (D-42, R-31)', () => {
      expect(candidatesFor('DOA2I')).toEqual(
        candidates(region1ByName('dolnośląskie'), [
          region2Entry(
            region2By('D', 'oławski'),
            ['DOA'],
            ORDINARY_VINTAGE,
            VINTAGE,
          ),
        ]),
      );
    });

    it('C52 W00I22 → without-region2 temporary complete at L1c, diplomatic completable (D-42, R-32, R-33)', () => {
      expect(candidatesFor('W00I22')).toEqual(
        candidates(region1ByName('mazowieckie'), [
          withoutRegion2(TEMP_DIP, TEMPORARY),
        ]),
      );
    });

    it('C53 WII2I → without-region2 individual complete at L2.1, Warszawa ordinary completable at L2.1c (D-42, R-29)', () => {
      expect(candidatesFor('WII2I')).toEqual(
        candidates(region1ByName('mazowieckie'), [
          withoutRegion2(INDIVIDUAL, INDIVIDUAL),
          region2Entry(region2By('W', 'm.st. Warszawa'), ['WI'], ORDINARY),
        ]),
      );
    });

    it('C54 WI0OOOO → without-region2 diplomatic complete at L2.1c (D-42, R-33)', () => {
      expect(candidatesFor('WI0OOOO')).toEqual(
        candidates(region1ByName('mazowieckie'), [
          withoutRegion2(DIPLOMATIC, DIPLOMATIC),
        ]),
      );
    });

    it('C55 W1IOIO → without-region2 individual complete at L1 (D-42, R-29; as typed)', () => {
      expect(candidatesFor('W1IOIO')).toEqual(
        candidates(region1ByName('mazowieckie'), [
          withoutRegion2(INDIVIDUAL, INDIVIDUAL),
        ]),
      );
    });

    it('C56 DBB2222I → L3c complete ordinary (D-42, R-25)', () => {
      expect(candidatesFor('DBB2222I')).toEqual(
        candidates(region1ByName('dolnośląskie'), [
          l3Entry(ORDINARY, ORDINARY),
        ]),
      );
    });

    it('C57 WIO000O → without-region2 diplomatic complete at L2.2c; L3c completable WIO + 0000 (D-42, R-33, R-25)', () => {
      expect(candidatesFor('WIO000O')).toEqual(
        candidates(region1ByName('mazowieckie'), [
          withoutRegion2(DIPLOMATIC, DIPLOMATIC),
          l3Entry(ORDINARY),
        ]),
      );
    });

    it('C58 DBA22I → Wałbrzych complete ordinary at L1c, wałbrzyski completable (D-42, R-27, R-25)', () => {
      expect(candidatesFor('DBA22I')).toEqual(
        candidates(region1ByName('dolnośląskie'), [
          region2Entry(region2By('D', 'Wałbrzych'), ['DB'], ORDINARY, ORDINARY),
          region2Entry(region2By('D', 'wałbrzyski'), ['DBA'], ORDINARY),
        ]),
      );
    });

    it('C59 WIIAI → without-region2 individual only at L2.1; no WI (D-42, R-29)', () => {
      expect(candidatesFor('WIIAI')).toEqual(
        candidates(region1ByName('mazowieckie'), [
          withoutRegion2(INDIVIDUAL, INDIVIDUAL),
        ]),
      );
    });

    it('C60 DBI22I → Wałbrzych complete ordinary at L2.1c (D-42, R-27)', () => {
      expect(candidatesFor('DBI22I')).toEqual(
        candidates(region1ByName('dolnośląskie'), [
          region2Entry(region2By('D', 'Wałbrzych'), ['DB'], ORDINARY, ORDINARY),
        ]),
      );
    });

    it('C61 W0I2IA → without-region2 temporary complete at L2.1c, Ostrołęka ordinary completable at L2.2c (D-42, R-32, R-24)', () => {
      expect(candidatesFor('W0I2IA')).toEqual(
        candidates(region1ByName('mazowieckie'), [
          withoutRegion2(TEMPORARY, TEMPORARY),
          region2Entry(region2By('W', 'Ostrołęka'), ['WO'], ORDINARY),
        ]),
      );
    });

    it('C62 DBB222I → L3c completable ordinary only (D-42, R-25)', () => {
      expect(candidatesFor('DBB222I')).toEqual(
        candidates(region1ByName('dolnośląskie'), [l3Entry(ORDINARY)]),
      );
    });

    it('C63 SO0I2 → Sosnowiec complete vintage at L1c; ordinary still completable (D-42, R-30)', () => {
      expect(candidatesFor('SO0I2')).toEqual(
        candidates(region1ByName('śląskie'), [
          region2Entry(
            region2By('S', 'Sosnowiec'),
            ['SO'],
            ORDINARY_VINTAGE,
            VINTAGE,
          ),
        ]),
      );
    });
  });

  describe('L3 unregistered shapes', () => {
    it('C35 DA → without-region2 only; no L3 (R-26 lit. d, f, g; D-32)', () => {
      expect(candidatesFor('DA')).toEqual(
        candidates(region1ByName('dolnośląskie'), [withoutRegion2(REDUCED)]),
      );
    });

    it('C36 DA1 → without-region2 only; no L3 (R-26 lit. d, g; D-32)', () => {
      expect(candidatesFor('DA1')).toEqual(
        candidates(region1ByName('dolnośląskie'), [withoutRegion2(REDUCED)]),
      );
    });

    it('C37 DA12 → without-region2 complete reduced, L3 completable (R-24, R-27, R-30; D-26)', () => {
      expect(candidatesFor('DA12')).toEqual(
        candidates(region1ByName('dolnośląskie'), [
          withoutRegion2(REDUCED, REDUCED),
          l3Entry(ORDINARY_VINTAGE),
        ]),
      );
    });

    it('C38 DA1234 → L3 complete ordinary (R-24, R-27; D-26)', () => {
      expect(candidatesFor('DA1234')).toEqual(
        candidates(region1ByName('dolnośląskie'), [
          l3Entry(ORDINARY, ORDINARY),
        ]),
      );
    });

    it('C39 DA12345 → L3 complete ordinary (R-24; D-26; agrees with parsePlate region2-not-in-registry)', () => {
      expect(candidatesFor('DA12345')).toEqual(
        candidates(region1ByName('dolnośląskie'), [
          l3Entry(ORDINARY, ORDINARY),
        ]),
      );
    });

    it('C45 DD → dzierżoniowski completable (DDZ prefix); no L3 (R-25, R-37)', () => {
      expect(candidatesFor('DD')).toEqual(
        candidates(region1ByName('dolnośląskie'), [
          region2Entry(
            region2By('D', 'dzierżoniowski'),
            ['DDZ'],
            ORDINARY_VINTAGE,
          ),
        ]),
      );
    });

    it('C46 CD → L3 only; half-typed two-letter suffix, groups 1 and 2 empty vehicle part → ordinary+vintage (R-36, D-32)', () => {
      // From plate-data: no full code starts with CD; second letter D is excluded
      // from the vehicle part (R-36) and is not a look-alike, so L1 and L2 are empty.
      expect(candidatesFor('CD')).toEqual(
        candidates(region1ByName('kujawsko-pomorskie'), [
          l3Entry(ORDINARY_VINTAGE),
        ]),
      );
    });
  });

  describe('two-row line break (D-40)', () => {
    it('C40 DW\\nL123 → same as DWL123 (R-41, D-40)', () => {
      expect(candidatesFor('DW\nL123')).toEqual(
        candidates(region1ByName('dolnośląskie'), [
          region2Entry(region2By('D', 'Wrocław'), ['DW'], ORDINARY, ORDINARY),
          region2Entry(region2By('D', 'wołowski'), ['DWL'], ORDINARY),
        ]),
      );
    });
  });

  describe('bounds and enumerations', () => {
    it('C42 region2 count by first code character matches Annex 13 table; max 42 (D-39)', () => {
      const byLetter = new Map<string, Set<Region2>>();
      for (const region1 of registry.region1) {
        for (const region2 of registry.region2.filter(
          (r) => r.region1Letter === region1.letters[0],
        )) {
          for (const code of fullCodes(region1, region2)) {
            const first = code.charAt(0);
            let set = byLetter.get(first);
            if (set === undefined) {
              set = new Set();
              byLetter.set(first, set);
            }
            set.add(region2);
          }
        }
      }

      const counted: Record<string, number> = {};
      let max = 0;
      for (const [letter, set] of byLetter) {
        counted[letter] = set.size;
        if (set.size > max) {
          max = set.size;
        }
      }
      expect(counted).toEqual(ANNEX13_REGION2_BY_FIRST_LETTER);
      expect(max).toBe(42);

      const letters = Object.keys(ANNEX13_REGION2_BY_FIRST_LETTER);
      for (const letter of letters) {
        const result = candidatesFor(letter);
        expect(result.status).toBe('candidates');
        if (result.status !== 'candidates') {
          continue;
        }
        const region2Count = result.candidates.filter(
          (c) => c.kind === 'region2',
        ).length;
        expect(region2Count).toBe(ANNEX13_REGION2_BY_FIRST_LETTER[letter]);
      }

      const alphabetLetters = [...PLATE_ALPHABET].filter((c) =>
        /[A-Z]/.test(c),
      );
      let checked = 0;
      for (const c1 of alphabetLetters) {
        if (!(c1 in ANNEX13_REGION2_BY_FIRST_LETTER)) {
          continue;
        }
        for (const c2 of PLATE_ALPHABET) {
          for (const c3 of ['', ...PLATE_ALPHABET]) {
            const input = c3 === '' ? c1 + c2 : c1 + c2 + c3;
            const result = candidatesFor(input);
            checked += 1;
            if (result.status !== 'candidates') {
              continue;
            }
            const region2Count = result.candidates.filter(
              (c) => c.kind === 'region2',
            ).length;
            expect(region2Count).toBeLessThanOrEqual(42);
            expect(result.candidates.length).toBeLessThanOrEqual(44);
          }
        }
      }
      // 23 letters × (1 + 35 + 35²) prefixes that start with a column-4 letter
      // is larger; this loop covers length 2–3 for the 23 column-4 letters.
      expect(checked).toBe(23 * 35 * 36);
    }, 15_000);

    it('C43 every prefix of each full code + 12345 contains that region2 (R-24, R-25, R-37)', () => {
      const violations: string[] = [];
      let checks = 0;
      for (const region1 of registry.region1) {
        for (const region2 of registry.region2.filter(
          (r) => r.region1Letter === region1.letters[0],
        )) {
          for (const code of fullCodes(region1, region2)) {
            const plate = `${code}12345`;
            for (let len = 1; len <= plate.length; len++) {
              checks += 1;
              const prefix = plate.slice(0, len);
              const result = candidatesFor(prefix);
              const ok =
                result.status === 'candidates' &&
                result.candidates.some(
                  (c) => c.kind === 'region2' && c.region2 === region2,
                );
              if (!ok) {
                violations.push(`${prefix} (of ${plate} → ${region2.name})`);
              }
            }
          }
        }
      }
      expect(checks).toBe(5_354);
      expect(violations).toEqual([]);
    }, 10_000);

    it('C44 every prefix of each column-6 code + 1234 has without-region2 with temporary (R-32, R-48)', () => {
      const violations: string[] = [];
      let checks = 0;
      for (const region1 of registry.region1) {
        for (const code of region1.letterDigitCodes) {
          const plate = `${code}1234`;
          for (let len = 1; len <= plate.length; len++) {
            checks += 1;
            const prefix = plate.slice(0, len);
            const result = candidatesFor(prefix);
            const ok =
              result.status === 'candidates' &&
              result.candidates.some(
                (c) =>
                  c.kind === 'without-region2' &&
                  c.plateTypes.includes('temporary'),
              );
            if (!ok) {
              violations.push(`${prefix} (of ${plate})`);
            }
          }
        }
      }
      expect(checks).toBe(1_380);
      expect(violations).toEqual([]);
    }, 10_000);
  });
});
