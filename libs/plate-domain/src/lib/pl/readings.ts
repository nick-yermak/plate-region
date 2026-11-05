import { fullCodes, registry } from '@plate-region/plate-data';
import type { Country, Region1, Region2 } from '@plate-region/plate-data';

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

/**
 * Series of a leading distinguisher and one allowed letter (D-46): `U` + one of 23 letters — 1776 § 6 ust. 3 pkt 1 (R-50), pkt 2 lit. a (R-51); HB, HP, HK, HA, HW, HC + one of 25 letters — 1326 § 5 ust. 2 pkt 1 (R-52), § 5 ust. 3 pkt 1–6 (R-53–R-58); HM + one of 25 letters — 1777 § 6 ust. 1 pkt 1 (R-59), § 6 ust. 2 (R-60).
 */
export type PlateSeries =
  | 'armed-forces' // U  — R-50, R-51
  | 'state-protection-service' // HB — R-52, R-53
  | 'police' // HP — R-52, R-54
  | 'abw-aw' // HK — R-52, R-55
  | 'cba' // HA — R-52, R-56
  | 'border-guard' // HW — R-52, R-57
  | 'customs-and-tax-service' // HC — R-52, R-58
  | 'skw-sww'; // HM — R-59, R-60

/** When the first character is not a column-4 letter (D-35). */
export type FirstLetterReject =
  | {
      readonly status: 'not-in-registry';
      readonly country: Country;
      readonly series?: PlateSeries;
    }
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

// 1776 § 6 ust. 3 pkt 2 lit. a (R-51)
const ARMED_FORCES_LETTERS: ReadonlySet<string> = new Set(
  'ABCDEFGHIJKLMNPRSTVWXYZ',
);
// 1326 § 5 ust. 2 pkt 1 (R-52); 1777 § 6 ust. 1 pkt 1 (R-59)
const SERVICE_LETTERS: ReadonlySet<string> = new Set(
  'ABCDEFGHIJKLMNOPRSTUVWXYZ',
);
const SERVICE_CODES: ReadonlyMap<string, PlateSeries> = new Map([
  ['HB', 'state-protection-service'], // 1326 § 5 ust. 3 pkt 1 (R-53)
  ['HP', 'police'], // pkt 2 (R-54)
  ['HK', 'abw-aw'], // pkt 3 (R-55)
  ['HA', 'cba'], // pkt 4 (R-56)
  ['HW', 'border-guard'], // pkt 5 (R-57)
  ['HC', 'customs-and-tax-service'], // pkt 6 (R-58)
  ['HM', 'skw-sww'], // 1777 § 6 ust. 2 (R-60)
]);

// The first character is H or U here: digits return earlier.
function seriesOf(compact: string): PlateSeries | undefined {
  if (compact.charAt(0) === 'U') {
    // 1776 § 6 ust. 3 pkt 1 (R-50)
    return ARMED_FORCES_LETTERS.has(compact.charAt(1))
      ? 'armed-forces'
      : undefined;
  }
  return SERVICE_LETTERS.has(compact.charAt(2))
    ? SERVICE_CODES.get(compact.slice(0, 2))
    : undefined;
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
  const series = seriesOf(compact);
  return series === undefined
    ? { status: 'not-in-registry', country: 'PL' }
    : { status: 'not-in-registry', country: 'PL', series };
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
