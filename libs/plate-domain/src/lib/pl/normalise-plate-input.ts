import { PLATE_ALPHABET } from './alphabet';

export type NormalisedPlateInput =
  | {
      readonly status: 'ok';
      /** Groups in input order, separators removed, never empty strings. */
      readonly groups: readonly string[];
      /** The groups joined without separators — the form used for code lookup. */
      readonly compact: string;
    }
  | {
      readonly status: 'invalid';
      /** Characters outside the alphabet, as typed, deduplicated, in order of first appearance. */
      readonly invalidCharacters: readonly string[];
    };

/**
 * Digits read as the letter they resemble, in the first position only: every plate type starts with a letter
 * (§ 30 ust. 2 pkt 1–7 Dz.U. 2024 poz. 1709). Later positions are left as typed because telling them apart
 * needs the registry (`SO` Sosnowiec vs `S0` śląskie).
 */
const FIRST_POSITION_LOOK_ALIKES: ReadonlyMap<string, string> = new Map([
  ['0', 'O'],
  ['1', 'I'],
]);

const SEPARATOR = /[\s\p{Pd}.]+/u;

function uppercaseAscii(char: string): string {
  return /[a-z]/.test(char) ? char.toUpperCase() : char;
}

/**
 * Normalises typed or recognised plate text for parsing. Pure and total: never throws.
 *
 * Whitespace, dash punctuation and '.' separate groups; a run of them is one boundary, and leading or trailing
 * ones are dropped. Only ASCII a–z is uppercased, and no Unicode normalisation is applied, so characters such
 * as 'ı', 'ſ' or fullwidth letters stay outside the alphabet instead of turning into valid letters.
 * Any character outside the § 30 ust. 1 alphabet makes the result `invalid`.
 * Empty or separator-only input is `ok` with no groups, because partial input starts empty.
 */
export function normalisePlateInput(input: string): NormalisedPlateInput {
  const rawGroups = input.split(SEPARATOR).filter((group) => group.length > 0);

  // Look-alike maps {0,1}→{O,I} (all in the alphabet), so it never changes validity:
  // rejecting when uppercaseAscii(typed) ∉ alphabet is equivalent to checking after the rule.
  const invalidCharacters = [
    ...new Set(
      rawGroups.flatMap((group) =>
        [...group].filter((char) => !PLATE_ALPHABET.has(uppercaseAscii(char))),
      ),
    ),
  ];
  if (invalidCharacters.length > 0) {
    return { status: 'invalid', invalidCharacters };
  }

  // Safe to index by code unit: every remaining character is ASCII (§ 30 ust. 1 alphabet).
  const groups = rawGroups.map((group) => {
    let normalised = '';
    for (let i = 0; i < group.length; i++) {
      normalised += uppercaseAscii(group.charAt(i));
    }
    return normalised;
  });

  const first = groups[0];
  if (first !== undefined) {
    const lookAlike = FIRST_POSITION_LOOK_ALIKES.get(first.charAt(0));
    if (lookAlike !== undefined) {
      groups[0] = lookAlike + first.slice(1);
    }
  }

  return { status: 'ok', groups, compact: groups.join('') };
}
