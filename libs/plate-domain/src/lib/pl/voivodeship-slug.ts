import type { Region1 } from '@plate-region/plate-data';

// Explicit table: NFD decomposition does not split ł, so it cannot produce the ASCII slug.
const POLISH_TO_ASCII: ReadonlyMap<string, string> = new Map([
  ['ą', 'a'],
  ['ć', 'c'],
  ['ę', 'e'],
  ['ł', 'l'],
  ['ń', 'n'],
  ['ó', 'o'],
  ['ś', 's'],
  ['ź', 'z'],
  ['ż', 'z'],
]);

/** URL slug of a voivodeship: lowercase official name with Polish letters mapped by an explicit ASCII table. */
export function voivodeshipSlug(region1: Region1): string {
  return [...region1.name]
    .map((char) => POLISH_TO_ASCII.get(char) ?? char)
    .join('');
}
