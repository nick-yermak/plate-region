import { fullCodes, registry } from '@plate-region/plate-data';

import { PLATE_ALPHABET } from './alphabet';
import { parsePlate } from './parse-plate';
import type { ParseResult } from './parse-plate';
import { groupForFullCode, lookAlikeVariants, readingsOf } from './readings';

/**
 * Representative domain for the readings invariant (D-32 counts).
 *
 * region2 depends only on positions 1–3: the longest column-4+5 distinguisher is
 * three characters. Representatives D = '2', L = 'A' satisfy every character
 * restriction (A is outside B/D/I/O/Z and allowed on individual plates; 2 makes
 * every digit group non-zero). For any concrete string with the same prefix and
 * the same D/L pattern on positions 4+, its readings are a subset of the
 * representative's; positions 2–3 are enumerated fully. "No two region2s" and
 * "no mixed readings" therefore survive the subset. L2 checks the union of all
 * look-alike variants — a superset of any ranked selection. Lengths 1–5 after
 * the prefix cover total lengths 4–8 and every § 30 ust. 2 template.
 *
 * Narrowed to the 6 258 length-3 prefixes for which at least one look-alike
 * variant has a length-2 or length-3 full code: a multi-region2 or mixed
 * violation needs a region2 reading, which needs a full code in some variant.
 * Full domain was 1 746 850 strings (~11 s under Vitest+coverage); narrowed is
 * 387 996. Counts below are strings of this representative domain, not plates.
 */
const COLUMN_4_LETTERS = [
  ...new Set(registry.region1.flatMap((r) => [...r.letters])),
];

const FULL_CODE_SET: ReadonlySet<string> = (() => {
  const set = new Set<string>();
  for (const region1 of registry.region1) {
    for (const region2 of registry.region2.filter(
      (r) => r.region1Letter === region1.letters[0],
    )) {
      for (const code of fullCodes(region1, region2)) {
        set.add(code);
      }
    }
  }
  return set;
})();

function fills(): string[] {
  const result: string[] = [];
  for (let length = 1; length <= 5; length++) {
    for (let mask = 0; mask < 1 << length; mask++) {
      let fill = '';
      for (let i = 0; i < length; i++) {
        fill += (mask >> i) & 1 ? 'A' : '2';
      }
      result.push(fill);
    }
  }
  return result;
}

const LOOK_ALIKE_PARTNERS: ReadonlyMap<string, string> = new Map([
  ['0', 'O'],
  ['O', '0'],
  ['1', 'I'],
  ['I', '1'],
]);

/** Character plus its 0↔O / 1↔I partner when it has one — independent of readings.ts. */
function lookAlikeChoices(char: string): readonly string[] {
  const partner = LOOK_ALIKE_PARTNERS.get(char);
  return partner === undefined ? [char] : [char, partner];
}

/**
 * True when some combination of look-alike choices at positions 2–3 yields a
 * length-2 or length-3 full code. Local to the spec so the narrowed domain does
 * not depend on lookAlikeVariants.
 */
function prefixHasFullCode(prefix: string): boolean {
  const c1 = prefix.charAt(0);
  for (const c2 of lookAlikeChoices(prefix.charAt(1))) {
    for (const c3 of lookAlikeChoices(prefix.charAt(2))) {
      const variant = c1 + c2 + c3;
      if (
        FULL_CODE_SET.has(variant.slice(0, 2)) ||
        FULL_CODE_SET.has(variant)
      ) {
        return true;
      }
    }
  }
  return false;
}

/** Length-3 prefixes that can yield a region2 reading in some look-alike variant. */
function relevantPrefixes(): string[] {
  const prefixes: string[] = [];
  for (const letter of COLUMN_4_LETTERS) {
    for (const c2 of PLATE_ALPHABET) {
      for (const c3 of PLATE_ALPHABET) {
        const prefix = letter + c2 + c3;
        if (prefixHasFullCode(prefix)) {
          prefixes.push(prefix);
        }
      }
    }
  }
  return prefixes;
}

function classify(readings: ReturnType<typeof readingsOf>): {
  multiRegion2: boolean;
  mixed: boolean;
} {
  const region2s = new Set(
    readings.flatMap((r) => (r.region2 !== undefined ? [r.region2] : [])),
  );
  const hasRegion1Only = readings.some((r) => r.region2 === undefined);
  return {
    multiRegion2: region2s.size > 1,
    mixed: region2s.size >= 1 && hasRegion1Only,
  };
}

function typeKey(result: ParseResult): string {
  switch (result.status) {
    case 'ambiguous':
      return `ambiguous ${result.withRegion2.plateTypes.join('+')} | ${result.withoutRegion2.plateTypes.join('+')}`;
    case 'resolved':
    case 'region1-only':
    case 'region2-not-in-registry':
      return `${result.status} ${result.plateTypes.join('+')}`;
    case 'invalid-input':
      return `invalid-input ${result.reason}`;
    default:
      return result.status;
  }
}

describe('groupForFullCode', () => {
  it('throws on a full-code length other than 2 or 3 (module-build guard)', () => {
    expect(() => groupForFullCode('A')).toThrow(
      /full code length must be 2 or 3/,
    );
    expect(() => groupForFullCode('ABCD')).toThrow(
      /full code length must be 2 or 3/,
    );
  });
});

describe('readings invariant', () => {
  // ~2 s locally / ~5.5 s on the CI runner under coverage with other affected
  // tasks in parallel — Vitest's 5 s default is too tight.
  it('enumerates the narrowed representative domain: 0 multi-region2 on L1 and L2, 0 mixed on L1, and the literal L1/ambiguous and typeCounts', () => {
    const fillList = fills();
    const prefixes = relevantPrefixes();
    let total = 0;
    let l1WithReadings = 0;
    let l1MultiRegion2 = 0;
    let l1Mixed = 0;
    let l2MultiRegion2 = 0;
    let ambiguousCount = 0;
    const typeCounts: Record<string, number> = {};

    for (const prefix of prefixes) {
      for (const fill of fillList) {
        const compact = prefix + fill;
        total += 1;

        const l1 = readingsOf(compact);
        if (l1.length > 0) {
          l1WithReadings += 1;
          const c = classify(l1);
          if (c.multiRegion2) {
            l1MultiRegion2 += 1;
          }
          if (c.mixed) {
            l1Mixed += 1;
          }
        } else {
          const [one, two] = lookAlikeVariants(compact);
          const union = [...one, ...two].flatMap((v) => readingsOf(v));
          if (classify(union).multiRegion2) {
            l2MultiRegion2 += 1;
          }
        }

        const result = parsePlate(compact);
        // Ambiguous arises only on L2; L1 mixed is asserted 0 above.
        if (result.status === 'ambiguous') {
          ambiguousCount += 1;
        }
        const key = typeKey(result);
        typeCounts[key] = (typeCounts[key] ?? 0) + 1;
      }
    }

    // Literals required by testing.mdc so a constant stub fails.
    expect(prefixes).toHaveLength(6_258);
    expect(total).toBe(387_996);
    expect(l1MultiRegion2).toBe(0);
    expect(l1Mixed).toBe(0);
    expect(l2MultiRegion2).toBe(0);
    expect(l1WithReadings).toBe(43_096);
    expect(ambiguousCount).toBe(168);
    expect(typeCounts).toEqual({
      'resolved ordinary': 33_861,
      'resolved vintage': 5_613,
      'region1-only ordinary+vintage+temporary': 6_228,
      'region1-only individual': 7_492,
      'region1-only temporary': 288,
      'region1-only diplomatic': 144,
      'region2-not-in-registry ordinary': 40_264,
      'region2-not-in-registry vintage': 9_661,
      'invalid-input no-matching-format': 284_277,
      'ambiguous vintage | individual': 96,
      'ambiguous ordinary | individual': 72,
    });
  }, 20_000);

  it('enumerates the complement for one column-4 letter: every region1-only key appears with a non-zero literal count', () => {
    // Templates do not depend on the letter, so one letter is enough to pin
    // Derived consequences 3 and 4; the registry only decides which prefixes
    // fall into the complement.
    const region1 = registry.region1.find((r) => r.letters[0] === 'C');
    if (region1 === undefined) {
      throw new Error('region1 with letters[0] === C not found');
    }
    expect(region1.letters).toEqual(['C']);

    const fillList = fills();
    const prefixes: string[] = [];
    for (const letter of region1.letters) {
      for (const c2 of PLATE_ALPHABET) {
        for (const c3 of PLATE_ALPHABET) {
          const prefix = letter + c2 + c3;
          if (!prefixHasFullCode(prefix)) {
            prefixes.push(prefix);
          }
        }
      }
    }

    let total = 0;
    const typeCounts: Record<string, number> = {};
    for (const prefix of prefixes) {
      for (const fill of fillList) {
        total += 1;
        const key = typeKey(parsePlate(prefix + fill));
        typeCounts[key] = (typeCounts[key] ?? 0) + 1;
      }
    }

    expect(prefixes).toHaveLength(1_070);
    expect(total).toBe(66_340);
    expect(typeCounts).toEqual({
      'region1-only ordinary+vintage+temporary': 1_380,
      'region1-only individual': 3_864,
      'region1-only temporary': 288,
      'region1-only diplomatic': 144,
      'region2-not-in-registry ordinary': 8_509,
      'region2-not-in-registry vintage': 1_799,
      'invalid-input no-matching-format': 50_356,
    });
  });
});
