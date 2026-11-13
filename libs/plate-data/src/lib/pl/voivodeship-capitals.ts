/**
 * The 18 voivodeship capitals as `[region1Letter, firstSuffix]` pairs in the
 * same order as `loadCountryMap().capitals` (D-54 Update #169, D-64).
 */
export const voivodeshipCapitals = [
  ['D', 'W'],
  ['C', 'B'],
  ['C', 'T'],
  ['L', 'U'],
  ['F', 'G'],
  ['F', 'Z'],
  ['E', 'L'],
  ['K', 'R'],
  ['W', 'A'],
  ['O', 'P'],
  ['R', 'Z'],
  ['B', 'I'],
  ['G', 'D'],
  ['S', 'K'],
  ['T', 'K'],
  ['N', 'O'],
  ['P', 'O'],
  ['Z', 'S'],
] as const satisfies readonly (readonly [
  region1Letter: string,
  firstSuffix: string,
])[];
