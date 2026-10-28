import type { Country, Region1, Region2 } from '@plate-region/plate-data';

import type { PlateType } from './plate-type';

/** One way the typed characters can continue, or already end, as a plate (D-39). */
export type Candidate =
  | {
      readonly kind: 'region2';
      readonly region2: Region2;
      /**
       * Full codes of the readings that give this entry its plate types: codes
       * behind the winning completable level, plus codes of the complete
       * readings (D-39). Codes reached only through a losing level are omitted.
       */
      readonly codes: readonly [string, ...string[]];
      /** § 25 types still possible, in § 25 order (D-34). */
      readonly plateTypes: readonly [PlateType, ...PlateType[]];
      /** Types for which the input is already a complete plate; empty while it is not. */
      readonly completeAs: readonly PlateType[];
    }
  | {
      /** A column-4 letter or a column-6 code: plates that carry no powiat. */
      readonly kind: 'without-region2';
      readonly plateTypes: readonly [PlateType, ...PlateType[]];
      readonly completeAs: readonly PlateType[];
    }
  | {
      /** A valid column-4+5 shape whose code is not in the current registry (D-26; L3 of D-32). */
      readonly kind: 'region2-not-in-registry';
      readonly plateTypes: readonly [PlateType, ...PlateType[]];
      readonly completeAs: readonly PlateType[];
    };

/** Result of {@link candidatesFor}. Discriminated union on `status`; every variant carries `country: 'PL'` (D-07). */
export type CandidatesResult =
  | {
      readonly status: 'candidates';
      readonly country: Country;
      readonly region1: Region1;
      /** Ordered: the region2 whose code equals the first typed group, then Annex 13 order (D-39). */
      readonly candidates: readonly [Candidate, ...Candidate[]];
    }
  | {
      readonly status: 'invalid-input';
      readonly country: Country;
      readonly reason: 'invalid-characters';
      readonly invalidCharacters: readonly string[];
    }
  | {
      /** No continuation of the input is a valid plate. */
      readonly status: 'invalid-input';
      readonly country: Country;
      readonly reason: 'no-matching-format';
    }
  | {
      readonly status: 'not-in-registry';
      readonly country: Country;
    }
  | {
      readonly status: 'empty';
      readonly country: Country;
    };

/**
 * Candidates for partial plate input while typing (Dz.U. 2024 poz. 1709 as amended, D-26). Pure and total.
 * The complete part shares level selection with {@link parsePlate}; the completable part uses the levels of D-32 independently (D-39).
 *
 * TDD checkpoint stub (#39): deliberately wrong for every specified input.
 */
export function candidatesFor(input: string): CandidatesResult {
  return {
    status: 'invalid-input',
    country: 'PL',
    reason: 'invalid-characters',
    invalidCharacters: [input],
  };
}
