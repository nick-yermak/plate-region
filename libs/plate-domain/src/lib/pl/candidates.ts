import type { Country, Region1, Region2 } from '@plate-region/plate-data';

import { normalisePlateInput } from './normalise-plate-input';
import type { PlateType } from './plate-type';
import { mergePlateTypes, type PlateTypes } from './plate-type';
import {
  completionsOf,
  rankCompact,
  region1ForFirstLetter,
  rejectWithoutRegion1,
  resolveCompact,
  unregisteredShapePlateTypes,
  type Completion,
  type Reading,
} from './readings';
import { completablePlateTypesOf } from './vehicle-part-templates';

/**
 * One way the typed characters can continue, or already end, as a plate (D-39).
 * `plateTypes` are § 25 types still possible, in § 25 order — § 25 pkt 1–5 (R-01).
 * `completeAs` lists types for which the input is already a complete plate; it is
 * always present and empty while the input is not complete for that entry.
 */
export type Candidate =
  | {
      readonly kind: 'region2';
      readonly region2: Region2;
      /** Full codes of the readings that give this entry its plate types. */
      readonly codes: readonly [string, ...string[]];
      readonly plateTypes: readonly [PlateType, ...PlateType[]];
      readonly completeAs: readonly PlateType[];
    }
  | {
      /**
       * Plates that carry no powiat, read from the column-4 letter or a column-6 code.
       * At most one such entry: the readings of both merge into one `plateTypes` and
       * `completeAs` — after `W0`, reduced and diplomatic from `W`, individual and
       * temporary from `W0` (D-39).
       */
      readonly kind: 'without-region2';
      readonly plateTypes: readonly [PlateType, ...PlateType[]];
      readonly completeAs: readonly PlateType[];
    }
  | {
      /**
       * A valid column-4+5 shape whose code is not in the current registry (D-26).
       * At most one such entry. While typing, it appears only when no registry
       * reading, as typed or after look-alike swaps, can still be completed: `DA`
       * and `DA1` have none, `DA12` has one (D-39).
       */
      readonly kind: 'region2-not-in-registry';
      readonly plateTypes: readonly [PlateType, ...PlateType[]];
      readonly completeAs: readonly PlateType[];
    };

/**
 * Result of {@link candidatesFor}. Discriminated union on `status`; every variant
 * carries `country: 'PL'` (D-07). On `candidates`, `region1` is fixed by the first
 * letter and `candidates` is non-empty: the region2 whose code equals the first
 * typed group first, then Annex 13 order (D-39). Separators change only that order.
 */
export type CandidatesResult =
  | {
      readonly status: 'candidates';
      readonly country: Country;
      readonly region1: Region1;
      readonly candidates: readonly [Candidate, ...Candidate[]];
    }
  | {
      /** Characters outside § 30 ust. 1 (R-23), as typed. */
      readonly status: 'invalid-input';
      readonly country: Country;
      readonly reason: 'invalid-characters';
      readonly invalidCharacters: readonly string[];
    }
  | {
      /** No continuation of the input is a valid plate (including a leading digit). */
      readonly status: 'invalid-input';
      readonly country: Country;
      readonly reason: 'no-matching-format';
    }
  | {
      /**
       * First character is a letter outside Annex 13 column 4 (H, U) —
       * § 31 ust. 2 (R-37), Annex 13 table header (R-48) (D-35).
       */
      readonly status: 'not-in-registry';
      readonly country: Country;
    }
  | {
      /** Empty or separator-only input. */
      readonly status: 'empty';
      readonly country: Country;
    };

/** Merge two optional plate-type sets; undefined when both are absent (D-37). */
function mergeOptional(
  a: PlateTypes | undefined,
  b: PlateTypes | undefined,
): PlateTypes | undefined {
  if (a === undefined) {
    return b;
  }
  if (b === undefined) {
    return a;
  }
  return mergePlateTypes(a, b);
}

type Region2Bucket = {
  readonly region2: Region2;
  minOrdinal: number;
  /** Non-empty from creation; kept sorted by Annex 13 ordinal (D-37). */
  codes: readonly [string, ...string[]];
  readonly codeOrdinals: Map<string, number>;
  /** Union of completable and complete types; non-empty from creation (D-37). */
  plateTypes: PlateTypes;
  complete: PlateTypes | undefined;
};

type OrderedCandidate = {
  readonly pinned: 0 | 1;
  readonly minOrdinal: number;
  readonly candidate: Candidate;
};

function winningCompletions(compact: string): {
  readonly completions: readonly Completion[];
  readonly l3: PlateTypes | undefined;
} {
  const ranked = rankCompact(compact, completionsOf, (variant) =>
    unregisteredShapePlateTypes(variant, completablePlateTypesOf),
  );
  switch (ranked.kind) {
    case 'matched':
      return { completions: ranked.items, l3: undefined };
    case 'unregistered':
      return { completions: [], l3: ranked.plateTypes };
    case 'none':
      return { completions: [], l3: undefined };
  }
}

function addCode(
  bucket: Region2Bucket,
  code: string,
  ordinal: number,
  plateTypes: PlateTypes,
  source: 'completable' | 'complete',
): void {
  if (!bucket.codeOrdinals.has(code)) {
    bucket.codeOrdinals.set(code, ordinal);
    bucket.minOrdinal = Math.min(bucket.minOrdinal, ordinal);
    const next: [string, ...string[]] = [...bucket.codes, code];
    next.sort(
      (a, b) =>
        Number(bucket.codeOrdinals.get(a)) - Number(bucket.codeOrdinals.get(b)),
    );
    bucket.codes = next;
  }
  bucket.plateTypes = mergePlateTypes(bucket.plateTypes, plateTypes);
  if (source === 'complete') {
    bucket.complete = mergeOptional(bucket.complete, plateTypes);
  }
}

function createBucket(
  region2: Region2,
  code: string,
  ordinal: number,
  plateTypes: PlateTypes,
  source: 'completable' | 'complete',
): Region2Bucket {
  return {
    region2,
    minOrdinal: ordinal,
    codes: [code],
    codeOrdinals: new Map([[code, ordinal]]),
    plateTypes,
    complete: source === 'complete' ? plateTypes : undefined,
  };
}

function compareOrdered(a: OrderedCandidate, b: OrderedCandidate): number {
  return a.pinned !== b.pinned
    ? a.pinned - b.pinned
    : a.minOrdinal - b.minOrdinal;
}

function buildCandidates(
  firstGroup: string,
  completeReadings: readonly Reading[] | undefined,
  completeL3: PlateTypes | undefined,
  completable: readonly Completion[],
  completableL3: PlateTypes | undefined,
): readonly Candidate[] {
  const byRegion2 = new Map<Region2, Region2Bucket>();

  const ensureBucket = (
    region2: Region2,
    code: string,
    ordinal: number,
    plateTypes: PlateTypes,
    source: 'completable' | 'complete',
  ): void => {
    const existing = byRegion2.get(region2);
    if (existing !== undefined) {
      addCode(existing, code, ordinal, plateTypes, source);
      return;
    }
    byRegion2.set(
      region2,
      createBucket(region2, code, ordinal, plateTypes, source),
    );
  };

  for (const completion of completable) {
    const { distinguisher, plateTypes } = completion;
    if (distinguisher.region2 === undefined) {
      continue;
    }
    ensureBucket(
      distinguisher.region2,
      distinguisher.code,
      distinguisher.ordinal,
      plateTypes,
      'completable',
    );
  }

  if (completeReadings !== undefined) {
    for (const reading of completeReadings) {
      if (reading.region2 === undefined) {
        continue;
      }
      ensureBucket(
        reading.region2,
        reading.code,
        reading.ordinal,
        reading.plateTypes,
        'complete',
      );
    }
  }

  const ordered: OrderedCandidate[] = [];

  for (const bucket of byRegion2.values()) {
    ordered.push({
      pinned: bucket.codes.includes(firstGroup) ? 0 : 1,
      minOrdinal: bucket.minOrdinal,
      candidate: {
        kind: 'region2',
        region2: bucket.region2,
        codes: bucket.codes,
        plateTypes: bucket.plateTypes,
        completeAs: bucket.complete === undefined ? [] : [...bucket.complete],
      },
    });
  }

  let withoutCompletable: PlateTypes | undefined;
  for (const completion of completable) {
    if (completion.distinguisher.region2 === undefined) {
      withoutCompletable = mergeOptional(
        withoutCompletable,
        completion.plateTypes,
      );
    }
  }
  let withoutComplete: PlateTypes | undefined;
  if (completeReadings !== undefined) {
    for (const reading of completeReadings) {
      if (reading.region2 === undefined) {
        withoutComplete = mergeOptional(withoutComplete, reading.plateTypes);
      }
    }
  }
  const withoutPlateTypes = mergeOptional(withoutCompletable, withoutComplete);
  if (withoutPlateTypes !== undefined) {
    ordered.push({
      pinned: 1,
      // Voivodeship row precedes its powiats in Annex 13 (D-39).
      minOrdinal: -1,
      candidate: {
        kind: 'without-region2',
        plateTypes: withoutPlateTypes,
        completeAs: withoutComplete === undefined ? [] : [...withoutComplete],
      },
    });
  }

  const l3PlateTypes = mergeOptional(completableL3, completeL3);
  if (l3PlateTypes !== undefined) {
    ordered.push({
      pinned: 1,
      minOrdinal: Number.POSITIVE_INFINITY,
      candidate: {
        kind: 'region2-not-in-registry',
        plateTypes: l3PlateTypes,
        completeAs: completeL3 === undefined ? [] : [...completeL3],
      },
    });
  }

  return ordered.sort(compareOrdered).map((entry) => entry.candidate);
}

/**
 * Regions and plate types the typed characters can still become, or already are.
 *
 * Uses the same input normalisation as {@link parsePlate}. Separators change only
 * candidate order, not the set. The list is not truncated. Where the input
 * is already a complete plate, `completeAs` agrees with {@link parsePlate}.
 * Fully typed all-zero digit groups are rejected — § 30 ust. 2 pkt 1–3, 5–7 (R-34).
 * From position 4, I and O are also read as 1 and 0, as typed first within
 * each level (D-42).
 *
 * Result variants: {@link CandidatesResult}.
 */
export function candidatesFor(input: string): CandidatesResult {
  const normalised = normalisePlateInput(input);
  if (normalised.status === 'invalid') {
    return {
      status: 'invalid-input',
      country: 'PL',
      reason: 'invalid-characters',
      invalidCharacters: normalised.invalidCharacters,
    };
  }

  const { compact, groups } = normalised;
  const [firstGroup] = groups;
  if (firstGroup === undefined) {
    return { status: 'empty', country: 'PL' };
  }

  const region1 = region1ForFirstLetter(compact);
  if (region1 === undefined) {
    const reject = rejectWithoutRegion1(compact);
    if (reject.status === 'not-in-registry') {
      return { status: 'not-in-registry', country: 'PL' };
    }
    return {
      status: 'invalid-input',
      country: 'PL',
      reason: 'no-matching-format',
    };
  }

  const resolution = resolveCompact(compact);
  const completeReadings =
    resolution.kind === 'registry' ? resolution.readings : undefined;
  const completeL3 =
    resolution.kind === 'unregistered-shape'
      ? resolution.plateTypes
      : undefined;

  const { completions, l3: completableL3 } = winningCompletions(compact);

  const sorted = buildCandidates(
    firstGroup,
    completeReadings,
    completeL3,
    completions,
    completableL3,
  );

  const [head, ...tail] = sorted;
  if (head === undefined) {
    return {
      status: 'invalid-input',
      country: 'PL',
      reason: 'no-matching-format',
    };
  }

  return {
    status: 'candidates',
    country: 'PL',
    region1,
    candidates: [head, ...tail],
  };
}
