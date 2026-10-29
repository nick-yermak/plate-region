import { fullCodes, registry } from '@plate-region/plate-data';
import type { Region1, Region2 } from '@plate-region/plate-data';

import { mergePlateTypes, type PlateTypes } from './plate-type';
import {
  COLUMN_4_5_GROUPS,
  COLUMN_4_GROUP,
  COLUMN_6_GROUP,
  completablePlateTypesOf,
  plateTypesOf,
  type CompiledTemplate,
  type VehiclePartMatcher,
} from './vehicle-part-templates';

/**
 * A reading of a compact plate string: a registry distinguisher whose vehicle part
 * matches a § 30 ust. 2 template. `region2` is undefined for column-4-only and
 * column-6 readings (reduced, diplomatic, temporary, individual).
 */
export type Reading = {
  /** Distinguisher code: column-4 letter, full code, or column-6 code (D-39). */
  readonly code: string;
  /** Annex 13 order of the distinguisher; used to sort candidate codes (D-39). */
  readonly ordinal: number;
  readonly region2: Region2 | undefined;
  readonly plateTypes: PlateTypes;
};

export interface Distinguisher {
  readonly code: string;
  /** undefined for column 4 and column 6: plates that carry no powiat. */
  readonly region2: Region2 | undefined;
  readonly group: readonly CompiledTemplate[];
  /** Registry order: region1, then its region2 and their `fullCodes` (Annex 13 order). */
  readonly ordinal: number;
}

export type Completion = {
  readonly distinguisher: Distinguisher;
  readonly plateTypes: PlateTypes;
};

/**
 * Winning level of D-32 for a compact string, including L3 (D-39). Shared by
 * {@link parsePlate} and {@link candidatesFor}.
 */
export type CompactResolution =
  | {
      readonly kind: 'registry';
      readonly readings: readonly [Reading, ...Reading[]];
    }
  | {
      readonly kind: 'unregistered-shape';
      readonly plateTypes: PlateTypes;
    }
  | { readonly kind: 'none' };

/** When the first character is not a column-4 letter (D-35). */
export type FirstLetterReject =
  | { readonly status: 'not-in-registry' }
  | { readonly status: 'no-matching-format' };

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
 * Template group for a column-4+5 full code. Exported so the unexpected-length
 * pin in readings.spec.ts can cover the throw (module build rejects bad data).
 */
export function groupForFullCode(
  code: string,
): (typeof COLUMN_4_5_GROUPS)[1 | 2] {
  if (code.length === 2) {
    return COLUMN_4_5_GROUPS[1];
  }
  if (code.length === 3) {
    return COLUMN_4_5_GROUPS[2];
  }
  throw new Error(
    `full code length must be 2 or 3, got ${code.length} (${code})`,
  );
}

const DISTINGUISHERS: readonly Distinguisher[] = (() => {
  const list: Distinguisher[] = [];
  let ordinal = 0;
  for (const region1 of registry.region1) {
    for (const letter of region1.letters) {
      list.push({
        code: letter,
        region2: undefined,
        group: COLUMN_4_GROUP,
        ordinal: ordinal++,
      });
    }
    for (const region2 of region2sOf(region1)) {
      for (const code of fullCodes(region1, region2)) {
        list.push({
          code,
          region2,
          group: groupForFullCode(code),
          ordinal: ordinal++,
        });
      }
    }
    for (const code of region1.letterDigitCodes) {
      list.push({
        code,
        region2: undefined,
        group: COLUMN_6_GROUP,
        ordinal: ordinal++,
      });
    }
  }
  return list;
})();

const BY_CODE: ReadonlyMap<string, Distinguisher> = (() => {
  const map = new Map<string, Distinguisher>();
  for (const distinguisher of DISTINGUISHERS) {
    map.set(distinguisher.code, distinguisher);
  }
  return map;
})();

const BY_PREFIX: ReadonlyMap<string, readonly Distinguisher[]> = (() => {
  const map = new Map<string, Distinguisher[]>();
  for (const distinguisher of DISTINGUISHERS) {
    for (let len = 1; len <= distinguisher.code.length; len++) {
      const prefix = distinguisher.code.slice(0, len);
      const bucket = map.get(prefix);
      if (bucket === undefined) {
        map.set(prefix, [distinguisher]);
      } else {
        bucket.push(distinguisher);
      }
    }
  }
  return map;
})();

/**
 * Resolves region1 from the first character via Annex 13 column-4 letters
 * (including secondary letters such as I for śląskie; R-37, R-48).
 */
export function region1ForFirstLetter(compact: string): Region1 | undefined {
  // Empty compact: charAt(0) is '', which is absent from BY_LETTER.
  return BY_LETTER.get(compact.charAt(0));
}

/**
 * H/U → not-in-registry; a leading digit → no-matching-format (D-35, D-32).
 * Shared by {@link parsePlate} and {@link candidatesFor} (D-39).
 */
export function rejectWithoutRegion1(compact: string): FirstLetterReject {
  // Digits 0/1 in the first position are already mapped to O/I by normalisation.
  if (/\d/.test(compact.charAt(0))) {
    return { status: 'no-matching-format' };
  }
  return { status: 'not-in-registry' };
}

/**
 * Distinguishers whose code is a strict prefix of `compact` (length 1..3).
 * Shared by {@link readingsOf} and {@link distinguishersFor} (D-39).
 */
function shorterDistinguishers(compact: string): readonly Distinguisher[] {
  const found: Distinguisher[] = [];
  const maxShorter = Math.min(3, compact.length - 1);
  for (let len = 1; len <= maxShorter; len++) {
    const distinguisher = BY_CODE.get(compact.slice(0, len));
    if (distinguisher !== undefined) {
      found.push(distinguisher);
    }
  }
  return found;
}

/**
 * Distinguishers whose code is a strict prefix of `compact`, or that `compact`
 * is a prefix of (when length ≤ 3), for completable search (D-39).
 */
export function distinguishersFor(compact: string): readonly Distinguisher[] {
  const found: Distinguisher[] = [...shorterDistinguishers(compact)];
  if (compact.length <= 3) {
    const longer = BY_PREFIX.get(compact);
    if (longer !== undefined) {
      for (const distinguisher of longer) {
        found.push(distinguisher);
      }
    }
  }
  return found;
}

/**
 * Completable readings of `compact`: each distinguisher from
 * {@link distinguishersFor} whose remaining characters are a strict prefix of
 * at least one vehicle-part template (D-39).
 */
export function completionsOf(compact: string): readonly Completion[] {
  const result: Completion[] = [];
  for (const distinguisher of distinguishersFor(compact)) {
    const plateTypes = completablePlateTypesOf(
      distinguisher.group,
      compact.slice(distinguisher.code.length),
    );
    if (plateTypes !== undefined) {
      result.push({ distinguisher, plateTypes });
    }
  }
  return result;
}

/**
 * All readings of `compact` as typed (L1): Annex 13 column-4, full codes
 * (columns 4–5), and column-6 (R-37, R-48). Column 6 is tried regardless of
 * the second character: membership in the letter+digit code set decides
 * whether that distinguisher applies, not a character-class check on position 2.
 */
export function readingsOf(compact: string): readonly Reading[] {
  const readings: Reading[] = [];
  for (const distinguisher of shorterDistinguishers(compact)) {
    const plateTypes = plateTypesOf(
      distinguisher.group,
      compact.slice(distinguisher.code.length),
    );
    if (plateTypes !== undefined) {
      readings.push({
        code: distinguisher.code,
        ordinal: distinguisher.ordinal,
        region2: distinguisher.region2,
        plateTypes,
      });
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
 * Plate types of a valid column-4+5 shape whose distinguisher is not in the
 * registry, or undefined when no such shape matches (D-18: no explicit
 * not-in-registry branch). Called only after empty L1/L2.
 */
export function unregisteredShapePlateTypes(
  compact: string,
  match: VehiclePartMatcher,
): PlateTypes | undefined {
  let merged: PlateTypes | undefined;
  for (const suffixLen of [1, 2] as const) {
    const codeLen = 1 + suffixLen;
    const suffix = compact.slice(1, codeLen);
    // Letters only — digits in the suffix are not a column-4+5 shape.
    if (![...suffix].every((char) => /[A-Z]/.test(char))) {
      continue;
    }
    const plateTypes = match(
      COLUMN_4_5_GROUPS[suffixLen],
      compact.slice(codeLen),
    );
    if (plateTypes !== undefined) {
      merged =
        merged === undefined ? plateTypes : mergePlateTypes(merged, plateTypes);
    }
  }
  return merged;
}

const VEHICLE_PART_FIX: ReadonlyMap<string, string> = new Map([
  ['I', '1'],
  ['O', '0'],
]);

/** Index ≥ 3 is always the vehicle part (D-42); undefined when nothing changes, so the step is not a substitution. */
function correctVehiclePart(compact: string): string | undefined {
  const chars = [...compact];
  let changed = false;
  for (let index = 3; index < compact.length; index++) {
    const replacement = VEHICLE_PART_FIX.get(compact.charAt(index));
    if (replacement !== undefined) {
      chars[index] = replacement;
      changed = true;
    }
  }
  return changed ? chars.join('') : undefined;
}

function asNonEmpty<T>(items: readonly T[]): readonly [T, ...T[]] | undefined {
  const [head, ...tail] = items;
  if (head === undefined) {
    return undefined;
  }
  return [head, ...tail];
}

function readGroup<T>(
  variants: readonly string[],
  read: (variant: string) => readonly T[],
): readonly T[] {
  const asTyped = variants.flatMap(read);
  if (asTyped.length > 0) {
    return asTyped;
  }
  return variants.flatMap((variant) => {
    const corrected = correctVehiclePart(variant);
    return corrected === undefined ? [] : read(corrected);
  });
}

type Ranked<T> =
  | { readonly kind: 'matched'; readonly items: readonly [T, ...T[]] }
  | { readonly kind: 'unregistered'; readonly plateTypes: PlateTypes }
  | { readonly kind: 'none' };

/**
 * Each D-32 group as typed, then corrected, then L3, then L3c (D-42).
 * L2.2 stays a group: D-39 measured strings with empty L2.1.
 */
export function rankCompact<T>(
  compact: string,
  read: (variant: string) => readonly T[],
  shapeOf: (variant: string) => PlateTypes | undefined,
): Ranked<T> {
  const [one, two] = lookAlikeVariants(compact);
  const groups: readonly (readonly string[])[] = [[compact], one, two];
  for (const variants of groups) {
    const matched = asNonEmpty(readGroup(variants, read));
    if (matched !== undefined) {
      return { kind: 'matched', items: matched };
    }
  }
  const corrected = correctVehiclePart(compact);
  const shapeSources =
    corrected === undefined ? [compact] : [compact, corrected];
  for (const source of shapeSources) {
    const plateTypes = shapeOf(source);
    if (plateTypes !== undefined) {
      return { kind: 'unregistered', plateTypes };
    }
  }
  return { kind: 'none' };
}

/**
 * D-32 levels for `compact`, including L3 and vehicle-part I/O correction (D-42).
 * One place so `parsePlate` and `candidatesFor` cannot disagree on the complete
 * part (D-39).
 */
export function resolveCompact(compact: string): CompactResolution {
  const ranked = rankCompact(compact, readingsOf, (variant) =>
    unregisteredShapePlateTypes(variant, plateTypesOf),
  );
  switch (ranked.kind) {
    case 'matched':
      return { kind: 'registry', readings: ranked.items };
    case 'unregistered':
      return { kind: 'unregistered-shape', plateTypes: ranked.plateTypes };
    case 'none':
      return { kind: 'none' };
  }
}
