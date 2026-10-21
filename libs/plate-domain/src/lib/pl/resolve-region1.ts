import { registry } from '@plate-region/plate-data';
import type { Region1 } from '@plate-region/plate-data';

export type Region1Resolution =
  | {
      /** Annex 13 column-4 letter matched; the rest of the input is for region2 (#37). */
      readonly status: 'letter';
      readonly region1: Region1;
    }
  | {
      /**
       * Annex 13 column-6 letter+digit code matched (registry fact only — not a plate type).
       *
       * Individual (§ 30 ust. 2 pkt 4) and temporary (pkt 6) plates use that code as the
       * voivodeship distinguisher. Reduced single-row plates (pkt 2) and diplomatic plates
       * (pkt 7) can share the same first two characters when a column-4 letter is followed
       * by a digit; region1 is the same either way. Which reading applies is decided in #38.
       */
      readonly status: 'letter-digit-code';
      readonly region1: Region1;
    }
  | { readonly status: 'not-in-registry' };

// Annotating as readonly Region1[] makes letters and letterDigitCodes plain arrays
// instead of a union of 16 literal tuples from the as-const registry, so flatMap type-checks without casts.
const REGION1S: readonly Region1[] = registry.region1;

const BY_LETTER: ReadonlyMap<string, Region1> = new Map(
  REGION1S.flatMap((region1) =>
    region1.letters.map((column4Letter): [string, Region1] => [
      column4Letter,
      region1,
    ]),
  ),
);

const BY_LETTER_DIGIT_CODE: ReadonlyMap<string, Region1> = new Map(
  REGION1S.flatMap((region1) =>
    region1.letterDigitCodes.map((code): [string, Region1] => [code, region1]),
  ),
);

/**
 * Resolves region1 from a normalised compact plate prefix.
 * Reads only `compact`; group boundaries are ignored (D-31).
 * Empty compact yields not-in-registry: no index key is empty, so it falls through
 * without its own branch; the #37 parser handles empty input before calling this step.
 */
export function resolveRegion1(compact: string): Region1Resolution {
  // Column-6 before column-4 so the status reports the registry fact when the
  // first two characters are a letter+digit code; region1 would match either way.
  const byCode = BY_LETTER_DIGIT_CODE.get(compact.slice(0, 2));
  if (byCode !== undefined) {
    return { status: 'letter-digit-code', region1: byCode };
  }

  const byLetter = BY_LETTER.get(compact.charAt(0));
  if (byLetter !== undefined) {
    return { status: 'letter', region1: byLetter };
  }

  return { status: 'not-in-registry' };
}
