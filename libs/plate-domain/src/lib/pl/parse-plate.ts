import type { Country, Region1, Region2 } from '@plate-region/plate-data';

import { normalisePlateInput } from './normalise-plate-input';
import {
  lookAlikeVariants,
  matchesUnregisteredShape,
  readingsOf,
  region1ForFirstLetter,
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
    }
  | {
      /**
       * No reading carries a region2: reduced, diplomatic, temporary or
       * individual plates.
       */
      readonly status: 'region1-only';
      readonly country: Country;
      readonly region1: Region1;
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
      readonly region2: Region2;
    }
  | {
      /** Valid column-4+5 shape whose distinguisher is not in the current registry (D-26). */
      readonly status: 'region2-not-in-registry';
      readonly country: Country;
      readonly region1: Region1;
    }
  | {
      /**
       * First character is a letter outside column 4 (currently H and U).
       * Expectations for these letters are provisional until #38.
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
  const withRegion2 = readings.filter(
    (reading): reading is Reading & { region2: Region2 } =>
      reading.region2 !== undefined,
  );
  const [first] = withRegion2;
  if (first === undefined) {
    return { status: 'region1-only', country: 'PL', region1 };
  }

  const hasRegion1Only = readings.some(
    (reading) => reading.region2 === undefined,
  );
  if (!hasRegion1Only) {
    return {
      status: 'resolved',
      country: 'PL',
      region1,
      region2: first.region2,
    };
  }
  return {
    status: 'ambiguous',
    country: 'PL',
    region1,
    region2: first.region2,
  };
}

/**
 * Parses typed or recognised plate text into the regions it encodes (Dz.U. 2024 poz. 1709 as amended, D-26).
 * Pure and total: never throws. Reads only `compact` of {@link normalisePlateInput}; group boundaries are ignored (D-31).
 *
 * A reading is a registry distinguisher — a column-4 letter, a column-4 letter plus a column-5 suffix, or a column-6
 * code — followed by a vehicle part that matches a § 30 ust. 2 template. The first level that yields a reading wins:
 * 1. the input as typed;
 * 2. 0↔O and 1↔I swapped at positions 2–3, one substitution before two;
 * 3. the input as typed has a valid shape, but its column-4+5 distinguisher is not in the registry (`region2-not-in-registry`).
 * Otherwise the result is `invalid-input` with reason `no-matching-format`, which also covers a leading digit:
 * no § 30 ust. 2 template starts with one.
 *
 * Incomplete input such as `D`, `DW` or `WA1` has no matching format; candidates while typing are #39.
 * The plate type is not reported (#38).
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
    // Digits 0/1 in the first position are already mapped to O/I by normalisation.
    if (/\d/.test(compact.charAt(0))) {
      return {
        status: 'invalid-input',
        country: 'PL',
        reason: 'no-matching-format',
      };
    }
    return { status: 'not-in-registry', country: 'PL' };
  }

  const asTyped = readingsOf(compact);
  if (asTyped.length > 0) {
    return classify(asTyped, region1);
  }

  const [oneSubstitution, twoSubstitutions] = lookAlikeVariants(compact);
  const oneReadings = oneSubstitution.flatMap((variant) => readingsOf(variant));
  if (oneReadings.length > 0) {
    return classify(oneReadings, region1);
  }

  const twoReadings = twoSubstitutions.flatMap((variant) =>
    readingsOf(variant),
  );
  if (twoReadings.length > 0) {
    return classify(twoReadings, region1);
  }

  if (matchesUnregisteredShape(compact)) {
    return { status: 'region2-not-in-registry', country: 'PL', region1 };
  }

  return {
    status: 'invalid-input',
    country: 'PL',
    reason: 'no-matching-format',
  };
}
