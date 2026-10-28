import { fullCodes, registry } from '@plate-region/plate-data';

import { PLATE_ALPHABET } from './alphabet';
import { candidatesFor } from './candidates';
import { parsePlate } from './parse-plate';

type CandidatesResult = ReturnType<typeof candidatesFor>;
type Entry = Extract<
  CandidatesResult,
  { status: 'candidates' }
>['candidates'][number];
type ParseResult = ReturnType<typeof parsePlate>;
type ParseWithRegion1 = Extract<ParseResult, { region1: unknown }>;

const COLUMN_4_LETTERS = [
  ...new Set(registry.region1.flatMap((r) => [...r.letters])),
];

const FULL_CODES: readonly string[] = registry.region1.flatMap((region1) =>
  registry.region2
    .filter((r) => r.region1Letter === region1.letters[0])
    .flatMap((region2) => [...fullCodes(region1, region2)]),
);

const FULL_CODE_SET: ReadonlySet<string> = new Set(FULL_CODES);

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

/** Registry position by reference: a copied Region2 gives -1 and never matches. */
function region2IndexOf(region2: object): number {
  return registry.region2.findIndex((r) => r === region2);
}

function region2Index(entry: Entry): number {
  return entry.kind === 'region2' ? region2IndexOf(entry.region2) : -1;
}

function entryLabel(entry: Entry): string {
  const types = `plateTypes=[${entry.plateTypes.join('+')}] completeAs=[${entry.completeAs.join('+')}]`;
  if (entry.kind === 'region2') {
    return `region2 ${entry.region2.name}[${entry.codes.join(',')}] ${types}`;
  }
  return `${entry.kind} ${types}`;
}

function candidatesLabel(result: CandidatesResult): string {
  if (result.status !== 'candidates') {
    if (result.status === 'invalid-input') {
      return result.reason === 'invalid-characters'
        ? `invalid-input/invalid-characters [${result.invalidCharacters.join(',')}]`
        : 'invalid-input/no-matching-format';
    }
    return result.status;
  }
  return `candidates ${result.region1.name}: ${result.candidates.map(entryLabel).join(' | ')}`;
}

function parseLabel(result: ParseResult): string {
  switch (result.status) {
    case 'resolved':
      return `resolved ${result.region1.name}/${result.region2.name} [${result.plateTypes.join('+')}]`;
    case 'region1-only':
      return `region1-only ${result.region1.name} [${result.plateTypes.join('+')}]`;
    case 'ambiguous':
      return `ambiguous ${result.region1.name} withRegion2=${result.withRegion2.region2.name}[${result.withRegion2.plateTypes.join('+')}] without=[${result.withoutRegion2.plateTypes.join('+')}]`;
    case 'region2-not-in-registry':
      return `region2-not-in-registry ${result.region1.name} [${result.plateTypes.join('+')}]`;
    case 'invalid-input':
      return result.reason === 'invalid-characters'
        ? `invalid-input/invalid-characters [${result.invalidCharacters.join(',')}]`
        : 'invalid-input/no-matching-format';
    default:
      return result.status;
  }
}

function completeKey(
  kind: Entry['kind'],
  index: number,
  completeAs: readonly string[],
): string {
  return `${kind}#${index}#${completeAs.join('+')}`;
}

/**
 * Complete-part mapping written from D-39, not from candidates.ts.
 * Import nothing from candidates.ts except candidatesFor.
 */
function expectedCompleteKeys(p: ParseWithRegion1): readonly string[] {
  switch (p.status) {
    case 'resolved':
      return [completeKey('region2', region2IndexOf(p.region2), p.plateTypes)];
    case 'region1-only':
      return [completeKey('without-region2', -1, p.plateTypes)];
    case 'ambiguous':
      return [
        completeKey(
          'region2',
          region2IndexOf(p.withRegion2.region2),
          p.withRegion2.plateTypes,
        ),
        completeKey('without-region2', -1, p.withoutRegion2.plateTypes),
      ];
    case 'region2-not-in-registry':
      return [completeKey('region2-not-in-registry', -1, p.plateTypes)];
  }
}

type Tally = {
  readonly violations: string[];
  readonly statuses: Record<
    ParseWithRegion1['status'] | 'no-matching-format',
    number
  >;
  readonly completeKinds: Record<Entry['kind'], number>;
  noMatchingFormatWithCandidates: number;
};

function emptyTally(): Tally {
  return {
    violations: [],
    statuses: {
      resolved: 0,
      'region1-only': 0,
      ambiguous: 0,
      'region2-not-in-registry': 0,
      'no-matching-format': 0,
    },
    completeKinds: {
      region2: 0,
      'without-region2': 0,
      'region2-not-in-registry': 0,
    },
    noMatchingFormatWithCandidates: 0,
  };
}

function checkCompleteAgreement(input: string, tally: Tally): void {
  const p = parsePlate(input);
  const c = candidatesFor(input);
  const fail = (why: string) =>
    tally.violations.push(
      `${JSON.stringify(input)} ${why}: parsePlate ${parseLabel(p)} | candidatesFor ${candidatesLabel(c)}`,
    );

  if (c.status === 'candidates') {
    for (const entry of c.candidates) {
      if (entry.completeAs.length > 0) {
        tally.completeKinds[entry.kind] += 1;
      }
      if (!entry.completeAs.every((t) => entry.plateTypes.includes(t))) {
        fail('completeAs not within plateTypes');
      }
    }
  }

  if (
    p.status === 'empty' ||
    p.status === 'not-in-registry' ||
    (p.status === 'invalid-input' && p.reason === 'invalid-characters')
  ) {
    // Both files build these literals in the same key order; a difference shows
    // as a violation, never hides one.
    if (JSON.stringify(c) !== JSON.stringify(p)) {
      fail('passthrough differs');
    }
    return;
  }

  if (p.status === 'invalid-input') {
    tally.statuses['no-matching-format'] += 1;
    if (c.status === 'candidates') {
      tally.noMatchingFormatWithCandidates += 1;
      if (c.candidates.some((e) => e.completeAs.length > 0)) {
        fail('completeAs on no-matching-format');
      }
    } else if (
      !(c.status === 'invalid-input' && c.reason === 'no-matching-format')
    ) {
      fail('status');
    }
    return;
  }

  tally.statuses[p.status] += 1;
  if (c.status !== 'candidates' || c.region1 !== p.region1) {
    fail('status or region1');
    return;
  }
  const expected = [...expectedCompleteKeys(p)].sort();
  if (expected.some((key) => key.startsWith('region2#-1#'))) {
    fail('parsePlate region2 not by reference');
  }
  const actual = c.candidates
    .filter((e) => e.completeAs.length > 0)
    .map((e) => completeKey(e.kind, region2Index(e), e.completeAs))
    .sort();
  if (actual.join('\n') !== expected.join('\n')) {
    fail('complete part');
  }
}

/**
 * Domain A = readings.spec representative domain + every string of length 1–3
 * that starts with a column-4 letter. The narrowing is justified by coverage of
 * the mapping branches in buildCandidates (each parsePlate status, each entry
 * kind with non-empty completeAs), not by completeness. resolveCompact is shared
 * by both functions (D-39), so a bug in it cannot be detected here; its
 * correctness is covered by parse-plate.spec.ts and the readings invariant.
 */
describe('C48 completeAs agrees with parsePlate (D-39)', () => {
  // ~4.1 s isolated, ~4.8 s in the full plate-domain run (measured), CI ~2.5× slower
  it('C48 representative domain: complete part maps to the parsePlate status (D-27, D-39)', () => {
    const fillList = fills();
    const prefixes = relevantPrefixes();
    const tally = emptyTally();
    let total = 0;

    for (const prefix of prefixes) {
      for (const fill of fillList) {
        total += 1;
        checkCompleteAgreement(prefix + fill, tally);
      }
    }

    console.log('C48 representative counters', {
      total,
      prefixes: prefixes.length,
      statuses: tally.statuses,
      completeKinds: tally.completeKinds,
      noMatchingFormatWithCandidates: tally.noMatchingFormatWithCandidates,
      violations: tally.violations.length,
    });

    expect(fillList).toHaveLength(62);
    expect(total).toBe(prefixes.length * 62);
    expect(Object.entries(tally.statuses).filter(([, n]) => n === 0)).toEqual(
      [],
    );
    expect(
      Object.entries(tally.completeKinds).filter(([, n]) => n === 0),
    ).toEqual([]);
    expect(tally.noMatchingFormatWithCandidates).toBeGreaterThan(0);
    expect({
      total: tally.violations.length,
      first: tally.violations.slice(0, 20),
    }).toEqual({ total: 0, first: [] });
  }, 30_000);

  it('C48 every string of length 1–3 starting with a column-4 letter (D-39)', () => {
    const tally = emptyTally();
    let total = 0;

    for (const letter of COLUMN_4_LETTERS) {
      total += 1;
      checkCompleteAgreement(letter, tally);
      for (const c2 of PLATE_ALPHABET) {
        total += 1;
        checkCompleteAgreement(letter + c2, tally);
        for (const c3 of PLATE_ALPHABET) {
          total += 1;
          checkCompleteAgreement(letter + c2 + c3, tally);
        }
      }
    }

    console.log('C48 length-1–3 counters', {
      total,
      statuses: tally.statuses,
      completeKinds: tally.completeKinds,
      noMatchingFormatWithCandidates: tally.noMatchingFormatWithCandidates,
      violations: tally.violations.length,
    });

    expect(COLUMN_4_LETTERS).toHaveLength(23);
    expect(PLATE_ALPHABET.size).toBe(35);
    expect(total).toBe(23 * (1 + 35 + 35 ** 2));
    expect(tally.statuses['no-matching-format']).toBeGreaterThan(0);
    expect(tally.noMatchingFormatWithCandidates).toBeGreaterThan(0);
    expect({
      total: tally.violations.length,
      first: tally.violations.slice(0, 20),
    }).toEqual({ total: 0, first: [] });
  });
});
