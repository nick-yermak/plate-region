import type { Region1 } from '@plate-region/plate-data';

/** A number in the half-open interval [0, 1). */
export type RandomSource = () => number;

/**
 * Example ordinary or vintage plate for one Annex 13 full code.
 *
 * Two characters use § 30 ust. 2 pkt 1 lit. a (R-24), pkt 3 lit. a (R-27)
 * and pkt 5 lit. a (R-30). Three characters use pkt 1 lit. b (R-25),
 * pkt 3 lit. b (R-28) and pkt 5 lit. b (R-31). Vintage plates use the
 * pkt 5 layouts, Annex 12 Rys. 17–20 (R-45). A digit run takes the values
 * 1 … 10^k − 1 — § 30 ust. 2 pkt 1–3, 5–7 (R-34).
 *
 * `random` is called once when `code` is a full code of the current registry,
 * and not at all otherwise. A value outside [0, 1), including NaN, throws
 * `RangeError`. The result is `<full code> <vehicle part>` with one space.
 * Returns `undefined` when `code` is not a full code of the current registry.
 * Individual plates are not produced — § 32 ust. 3 (R-49).
 */
export function examplePlateForCode(
  code: string,
  random: RandomSource,
): string | undefined {
  void code;
  void random;
  return 'STUB';
}

/**
 * Example ordinary or vintage plate under one voivodeship's full codes.
 *
 * The plate is one of the plates {@link examplePlateForCode} can return for
 * those codes: § 30 ust. 2 pkt 1 lit. a (R-24), pkt 1 lit. b (R-25),
 * pkt 3 lit. a (R-27), pkt 3 lit. b (R-28), pkt 5 lit. a (R-30),
 * pkt 5 lit. b (R-31), Annex 12 Rys. 17–20 (R-45). A digit run takes the
 * values 1 … 10^k − 1 — § 30 ust. 2 pkt 1–3, 5–7 (R-34).
 *
 * `region1` is a record from the plate-data registry. `random` is called
 * once. A value outside [0, 1), including NaN, throws `RangeError`.
 * The result is `<full code> <vehicle part>` with one space.
 * Individual plates are not produced — § 32 ust. 3 (R-49).
 */
export function examplePlateForRegion1(
  region1: Region1,
  random: RandomSource,
): string {
  void region1;
  void random;
  return 'STUB';
}
