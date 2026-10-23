import { fullCodes, registry } from '@plate-region/plate-data';
import type { Region1, Region2 } from '@plate-region/plate-data';

import {
  COLUMN_4_5_PATTERNS,
  COLUMN_4_PATTERNS,
  COLUMN_6_PATTERNS,
  matchesTemplate,
} from './vehicle-part-templates';

/**
 * A reading of a compact plate string: a registry distinguisher whose vehicle part
 * matches a § 30 ust. 2 template. `region2` is undefined for column-4-only and
 * column-6 readings (reduced, diplomatic, temporary, individual).
 */
export type Reading = {
  readonly region2: Region2 | undefined;
};

/** region2 rows that belong to this region1 (primary letter), for index builds. */
function region2sOf(region1: Region1): readonly Region2[] {
  return registry.region2.filter(
    (region2) => region2.region1Letter === region1.letters[0],
  );
}

const BY_LETTER: ReadonlyMap<string, Region1> = (() => {
  const map = new Map<string, Region1>();
  for (const region1 of registry.region1) {
    for (const letter of region1.letters) {
      map.set(letter, region1);
    }
  }
  return map;
})();

/** Built only via plate-data `fullCodes` (D-07); no letter/suffix concatenation here. */
const FULL_CODES: ReadonlyMap<string, Region2> = (() => {
  const map = new Map<string, Region2>();
  for (const region1 of registry.region1) {
    for (const region2 of region2sOf(region1)) {
      for (const code of fullCodes(region1, region2)) {
        map.set(code, region2);
      }
    }
  }
  return map;
})();

const COLUMN_6_CODES: ReadonlySet<string> = new Set(
  registry.region1.flatMap((region1) => [...region1.letterDigitCodes]),
);

const LOOK_ALIKE: ReadonlyMap<string, string> = new Map([
  ['0', 'O'],
  ['O', '0'],
  ['1', 'I'],
  ['I', '1'],
]);

type LookAlikeSwap = {
  readonly index: number;
  readonly replacement: string;
};

/** Positions 2–3 that hold a look-alike character, with the character to write. */
function lookAlikePositions(compact: string): readonly LookAlikeSwap[] {
  const swaps: LookAlikeSwap[] = [];
  for (const index of [1, 2]) {
    const replacement = LOOK_ALIKE.get(compact.charAt(index));
    if (replacement !== undefined) {
      swaps.push({ index, replacement });
    }
  }
  return swaps;
}

function withLookAlikeAt(
  compact: string,
  swaps: readonly LookAlikeSwap[],
): string {
  const chars = [...compact];
  for (const { index, replacement } of swaps) {
    chars[index] = replacement;
  }
  return chars.join('');
}

/**
 * Resolves region1 from the first character via Annex 13 column-4 letters
 * (including secondary letters such as I for śląskie).
 */
export function region1ForFirstLetter(compact: string): Region1 | undefined {
  // Empty compact: charAt(0) is '', which is absent from BY_LETTER.
  return BY_LETTER.get(compact.charAt(0));
}

/**
 * All readings of `compact` as typed (L1): column-4, full codes, and column-6.
 * Column 6 is tried regardless of the second character: membership in the
 * letter+digit code set decides whether that distinguisher applies, not a
 * character-class check on position 2.
 */
export function readingsOf(compact: string): readonly Reading[] {
  const readings: Reading[] = [];

  if (matchesTemplate(COLUMN_4_PATTERNS, compact.slice(1))) {
    readings.push({ region2: undefined });
  }

  for (const suffixLen of [1, 2] as const) {
    const codeLen = 1 + suffixLen;
    const region2 = FULL_CODES.get(compact.slice(0, codeLen));
    if (region2 === undefined) {
      continue;
    }
    if (
      matchesTemplate(COLUMN_4_5_PATTERNS[suffixLen], compact.slice(codeLen))
    ) {
      readings.push({ region2 });
    }
  }

  if (COLUMN_6_CODES.has(compact.slice(0, 2))) {
    if (matchesTemplate(COLUMN_6_PATTERNS, compact.slice(2))) {
      readings.push({ region2: undefined });
    }
  }

  return readings;
}

/**
 * Look-alike variants of `compact` at positions 2–3 (0↔O, 1↔I), ranked by
 * substitution count: one-substitution first, then two.
 */
export function lookAlikeVariants(
  compact: string,
): readonly [
  oneSubstitution: readonly string[],
  twoSubstitutions: readonly string[],
] {
  const swappable = lookAlikePositions(compact);
  const oneSubstitution = swappable.map((swap) =>
    withLookAlikeAt(compact, [swap]),
  );
  const twoSubstitutions =
    swappable.length === 2 ? [withLookAlikeAt(compact, swappable)] : [];
  return [oneSubstitution, twoSubstitutions];
}

/**
 * Whether `compact` as typed has a valid column-4+5 shape (column-4 letter +
 * 1–2 any letters + matching vehicle part). Called only after empty L1/L2, so a
 * match implies the distinguisher is not in the registry (D-18: no explicit
 * not-in-registry branch).
 */
export function matchesUnregisteredShape(compact: string): boolean {
  for (const suffixLen of [1, 2] as const) {
    const codeLen = 1 + suffixLen;
    const suffix = compact.slice(1, codeLen);
    // Letters only — digits in the suffix are not a column-4+5 shape.
    if (![...suffix].every((char) => /[A-Z]/.test(char))) {
      continue;
    }
    if (
      matchesTemplate(COLUMN_4_5_PATTERNS[suffixLen], compact.slice(codeLen))
    ) {
      return true;
    }
  }

  return false;
}
