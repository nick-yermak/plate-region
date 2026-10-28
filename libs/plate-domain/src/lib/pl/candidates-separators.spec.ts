import { fullCodes, registry } from '@plate-region/plate-data';

import { candidatesFor } from './candidates';

type CandidatesResult = ReturnType<typeof candidatesFor>;
type Entry = Extract<
  CandidatesResult,
  { status: 'candidates' }
>['candidates'][number];

const FULL_CODES: readonly string[] = registry.region1.flatMap((region1) =>
  registry.region2
    .filter((r) => r.region1Letter === region1.letters[0])
    .flatMap((region2) => [...fullCodes(region1, region2)]),
);

const COLUMN_6_CODES: readonly string[] = registry.region1.flatMap((r) => [
  ...r.letterDigitCodes,
]);

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

const SEPARATORS: readonly string[] = [
  ' ',
  '\t',
  '\n',
  '\u00A0',
  '-',
  '\u2013',
  '\u2014',
  '.',
];

const KIND_RANK: Record<Entry['kind'], number> = {
  region2: 0,
  'without-region2': 1,
  'region2-not-in-registry': 2,
};

function prefixesOf(plate: string): string[] {
  return Array.from({ length: plate.length }, (_, i) => plate.slice(0, i + 1));
}

/** 0↔O / 1↔I at positions 2–3, without the base itself; independent of readings.ts. */
function lookAlikeSwaps(base: string): string[] {
  const variants: string[] = [];
  for (const c2 of lookAlikeChoices(base.charAt(1))) {
    for (const c3 of lookAlikeChoices(base.charAt(2))) {
      const variant = base.charAt(0) + c2 + c3 + base.slice(3);
      if (variant !== base) {
        variants.push(variant);
      }
    }
  }
  return variants;
}

/**
 * Segmentations that can change group boundaries relative to `base`.
 * Omits the base itself (identity) and, for n < 3, “all separated” (for n = 1 it
 * equals the base; for n = 2 it equals the single-boundary case). Leading,
 * trailing and one doubled separator are only useful once — empty-group
 * stripping is position-independent normalisation (D-31) — so they are added
 * only for full-length plates, not for every prefix or look-alike swap.
 */
function segmentations(
  base: string,
  next: () => string,
  includeEdgeSeparators: boolean,
): string[] {
  const result: string[] = [];
  for (let i = 1; i < base.length; i++) {
    result.push(base.slice(0, i) + next() + base.slice(i));
  }
  if (base.length >= 3) {
    result.push(
      [...base].map((ch, i) => (i === 0 ? ch : next() + ch)).join(''),
    );
  }
  if (includeEdgeSeparators) {
    result.push(next() + base);
    result.push(base + next());
    const at = base.length > 1 ? 1 : 0;
    result.push(base.slice(0, at) + next() + next() + base.slice(at));
  }
  return result;
}

/** Checks for one base: (n − 1) + (n ≥ 3 ? 1 : 0) + (full-length ? 3 : 0). */
function expectedChecksFor(
  base: string,
  includeEdgeSeparators: boolean,
): number {
  const n = base.length;
  return n - 1 + (n >= 3 ? 1 : 0) + (includeEdgeSeparators ? 3 : 0);
}

function canonical(entries: readonly Entry[]): Entry[] {
  return [...entries].sort((a, b) =>
    KIND_RANK[a.kind] !== KIND_RANK[b.kind]
      ? KIND_RANK[a.kind] - KIND_RANK[b.kind]
      : region2Index(a) - region2Index(b),
  );
}

function fullKey(e: Entry): string {
  const codes = e.kind === 'region2' ? e.codes.join(',') : '';
  return `${e.kind}#${region2Index(e)}#${codes}#${e.plateTypes.join('+')}#${e.completeAs.join('+')}`;
}

function orderKey(e: Entry): string {
  return `${e.kind}#${region2Index(e)}`;
}

describe('C49 candidate composition does not depend on separators (D-31, D-39, D-40)', () => {
  /*
   * Domain: every prefix of each full code + 12345 and column-6 code + 1234,
   * plus 0↔O / 1↔I swaps at positions 2–3. Segmentations omit identity and
   * duplicates that carry no information; edge separators only on the 919
   * full-length originals (not their look-alike swaps) — empty groups are
   * stripped the same way wherever they sit (D-31).
   */
  // ~0.95 s isolated, ~1.3 s in the full plate-domain run (measured), CI ~2.5× slower
  it('C49 full-code and column-6 prefixes, their look-alike swaps, every segmentation (D-31, D-39, D-40)', () => {
    const fullLengthPlates = [
      ...FULL_CODES.map((code) => `${code}12345`),
      ...COLUMN_6_CODES.map((code) => `${code}1234`),
    ];
    const fullLengthSet: ReadonlySet<string> = new Set(fullLengthPlates);

    const fullCodeBases = FULL_CODES.flatMap((code) =>
      prefixesOf(`${code}12345`),
    );
    const column6Bases = COLUMN_6_CODES.flatMap((code) =>
      prefixesOf(`${code}1234`),
    );
    const originals = [...fullCodeBases, ...column6Bases];
    const swapped = originals.flatMap(lookAlikeSwaps);
    const bases = [...originals, ...swapped];

    let cursor = 0;
    const next = () => SEPARATORS[cursor++ % SEPARATORS.length] ?? ' ';

    const violations: string[] = [];
    let checks = 0;
    let basesWithSeveralEntries = 0;
    let basesWithOrderChange = 0;

    for (const base of bases) {
      const expected = candidatesFor(base);
      if (expected.status === 'candidates' && expected.candidates.length >= 2) {
        basesWithSeveralEntries += 1;
      }

      const includeEdgeSeparators = fullLengthSet.has(base);
      let orderChangedForBase = false;
      for (const segmented of segmentations(
        base,
        next,
        includeEdgeSeparators,
      )) {
        checks += 1;
        const actual = candidatesFor(segmented);

        if (expected.status === 'candidates') {
          if (actual.status !== 'candidates') {
            violations.push(
              `${JSON.stringify(segmented)} (base ${JSON.stringify(base)}): expected candidates, got ${candidatesLabel(actual)} | base ${candidatesLabel(expected)}`,
            );
            continue;
          }
          if (actual.region1 !== expected.region1) {
            violations.push(
              `${JSON.stringify(segmented)} (base ${JSON.stringify(base)}): region1 differs | ${candidatesLabel(actual)} | base ${candidatesLabel(expected)}`,
            );
            continue;
          }
          const expectedCanon = canonical(expected.candidates);
          const actualCanon = canonical(actual.candidates);
          if (
            actualCanon.map(fullKey).join('\n') !==
            expectedCanon.map(fullKey).join('\n')
          ) {
            violations.push(
              `${JSON.stringify(segmented)} (base ${JSON.stringify(base)}): entry set differs | ${candidatesLabel(actual)} | base ${candidatesLabel(expected)}`,
            );
          }
          if (
            actual.candidates.map(orderKey).join('|') !==
            expected.candidates.map(orderKey).join('|')
          ) {
            orderChangedForBase = true;
          }
        } else if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          violations.push(
            `${JSON.stringify(segmented)} (base ${JSON.stringify(base)}): non-candidates differs | ${candidatesLabel(actual)} | base ${candidatesLabel(expected)}`,
          );
        }
      }

      if (orderChangedForBase) {
        basesWithOrderChange += 1;
      }
    }

    const expectedChecks = bases.reduce(
      (sum, b) => sum + expectedChecksFor(b, fullLengthSet.has(b)),
      0,
    );

    console.log('C49 counters', {
      fullCodeBases: fullCodeBases.length,
      column6Bases: column6Bases.length,
      fullLength: fullLengthPlates.length,
      swapped: swapped.length,
      bases: bases.length,
      checks,
      expectedChecks,
      basesWithSeveralEntries,
      basesWithOrderChange,
      violations: violations.length,
    });

    expect(fullCodeBases).toHaveLength(5_354);
    expect(column6Bases).toHaveLength(1_380);
    expect(swapped.length).toBeGreaterThan(0);
    expect(checks).toBe(expectedChecks);
    expect(basesWithSeveralEntries).toBeGreaterThan(0);
    expect(basesWithOrderChange).toBeGreaterThan(0);
    expect({
      total: violations.length,
      first: violations.slice(0, 20),
    }).toEqual({ total: 0, first: [] });
  }, 30_000);
});
