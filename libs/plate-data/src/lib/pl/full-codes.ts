import type { Region1, Region2 } from './model';

/**
 * Full codes of `region2` under `region1` (Annex 13 columns 4×5): primary letter with
 * each suffix, then each secondary letter with each suffix (D-07). The first element is
 * the primary letter with the first suffix. Throws when `region2.region1Letter` is not
 * the primary letter of `region1`. § 31 ust. 2 (R-37).
 */
export function fullCodes(
  region1: Region1,
  region2: Region2,
): readonly [string, ...string[]] {
  if (region2.region1Letter !== region1.letters[0]) {
    throw new Error(
      `region1Letter ${region2.region1Letter} does not match region1 primary letter ${region1.letters[0]}`,
    );
  }
  const [primary, ...otherLetters] = region1.letters;
  const [firstSuffix, ...otherSuffixes] = region2.suffixes;
  return [
    `${primary}${firstSuffix}`,
    ...otherSuffixes.map((suffix) => `${primary}${suffix}`),
    ...otherLetters.flatMap((letter) =>
      region2.suffixes.map((suffix) => `${letter}${suffix}`),
    ),
  ];
}
