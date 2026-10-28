import type { Country, Region1, Region2 } from '@plate-region/plate-data';

import { normalisePlateInput } from './normalise-plate-input';
import type { PlateType } from './plate-type';
import { mergePlateTypes } from './plate-type';
import {
  region1ForFirstLetter,
  rejectWithoutRegion1,
  resolveCompact,
  type Reading,
} from './readings';

/**
 * Result of {@link parsePlate}. Discriminated union on `status`; every variant
 * carries `country: 'PL'` (D-07). Region records are by reference from the registry.
 */
export type ParseResult =
  | {
      /** Every reading names this region2. */
      readonly status: 'resolved';
      readonly country: Country;
      readonly region1: Region1;
      readonly region2: Region2;
      /** § 25 types of the matched templates, in § 25 order (D-34); more than one: not determinable from the characters. */
      readonly plateTypes: readonly [PlateType, ...PlateType[]];
    }
  | {
      /**
       * No reading carries a region2: reduced, diplomatic, temporary or
       * individual plates.
       */
      readonly status: 'region1-only';
      readonly country: Country;
      readonly region1: Region1;
      readonly plateTypes: readonly [PlateType, ...PlateType[]];
    }
  | {
      /**
       * Only after look-alike substitution: one reading names region2, another
       * carries none; region1 is the same in every reading. Relies on the
       * invariant that L1 never yields mixed readings.
       */
      readonly status: 'ambiguous';
      readonly country: Country;
      readonly region1: Region1;
      readonly withRegion2: {
        readonly region2: Region2;
        readonly plateTypes: readonly [PlateType, ...PlateType[]];
      };
      readonly withoutRegion2: {
        readonly plateTypes: readonly [PlateType, ...PlateType[]];
      };
    }
  | {
      /** Valid column-4+5 shape whose distinguisher is not in the current registry (D-26). */
      readonly status: 'region2-not-in-registry';
      readonly country: Country;
      readonly region1: Region1;
      readonly plateTypes: readonly [PlateType, ...PlateType[]];
    }
  | {
      /**
       * First character is a letter outside Annex 13 column 4 (H, U; R-37, R-48).
       * Final within Dz.U. 2024 poz. 1709; #60 may revisit (D-35).
       */
      readonly status: 'not-in-registry';
      readonly country: Country;
    }
  | {
      readonly status: 'invalid-input';
      readonly country: Country;
      readonly reason: 'invalid-characters';
      readonly invalidCharacters: readonly string[];
    }
  | {
      readonly status: 'invalid-input';
      readonly country: Country;
      readonly reason: 'no-matching-format';
    }
  | {
      readonly status: 'empty';
      readonly country: Country;
    };

function classify(readings: readonly Reading[], region1: Region1): ParseResult {
  // Caller passes only a non-empty winning level; noUncheckedIndexedAccess is off,
  // so the head of the plateTypes map is a defined PlateTypes.
  const [head, ...tail] = readings.map((reading) => reading.plateTypes);
  const all = mergePlateTypes(head, ...tail);

  const withRegion2 = readings.filter(
    (reading): reading is Reading & { region2: Region2 } =>
      reading.region2 !== undefined,
  );
  const [first] = withRegion2;
  if (first === undefined) {
    return {
      status: 'region1-only',
      country: 'PL',
      region1,
      plateTypes: all,
    };
  }

  const withoutRegion2 = readings.filter(
    (reading) => reading.region2 === undefined,
  );
  if (withoutRegion2.length === 0) {
    return {
      status: 'resolved',
      country: 'PL',
      region1,
      region2: first.region2,
      plateTypes: all,
    };
  }

  const [withHead, ...withTail] = withRegion2.map(
    (reading) => reading.plateTypes,
  );
  const [withoutHead, ...withoutTail] = withoutRegion2.map(
    (reading) => reading.plateTypes,
  );
  return {
    status: 'ambiguous',
    country: 'PL',
    region1,
    withRegion2: {
      region2: first.region2,
      plateTypes: mergePlateTypes(withHead, ...withTail),
    },
    withoutRegion2: {
      plateTypes: mergePlateTypes(withoutHead, ...withoutTail),
    },
  };
}

/**
 * Parses typed or recognised plate text into the regions it encodes (Dz.U. 2024 poz. 1709 as amended, D-26).
 * Pure and total: never throws. Reads only `compact` of {@link normalisePlateInput}; group boundaries are ignored (D-31).
 *
 * A reading is a registry distinguisher — a column-4 letter, a column-4 letter plus a column-5 suffix, or a column-6
 * code — followed by a vehicle part that matches a § 30 ust. 2 template. Level selection is shared with
 * {@link candidatesFor} via {@link resolveCompact} (D-39): L1 as typed, L2 look-alikes at positions 2–3, then L3
 * unregistered column-4+5 shape. Otherwise `invalid-input` / `no-matching-format`, including a leading digit.
 *
 * Incomplete input such as `D`, `DW` or `WA1` has no matching format; candidates while typing are #39 (D-39).
 * Plate types follow D-34; rules cite docs/pl-plate-rules.md (D-33).
 */
export function parsePlate(input: string): ParseResult {
  const normalised = normalisePlateInput(input);
  if (normalised.status === 'invalid') {
    return {
      status: 'invalid-input',
      country: 'PL',
      reason: 'invalid-characters',
      invalidCharacters: normalised.invalidCharacters,
    };
  }

  const { compact } = normalised;
  if (compact.length === 0) {
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
  switch (resolution.kind) {
    case 'registry':
      return classify(resolution.readings, region1);
    case 'unregistered-shape':
      return {
        status: 'region2-not-in-registry',
        country: 'PL',
        region1,
        plateTypes: resolution.plateTypes,
      };
    case 'none':
      return {
        status: 'invalid-input',
        country: 'PL',
        reason: 'no-matching-format',
      };
  }
}
