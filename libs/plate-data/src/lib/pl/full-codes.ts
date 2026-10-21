import type { Region1, Region2 } from './model';

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
