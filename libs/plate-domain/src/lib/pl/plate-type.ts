/**
 * Plate type (rodzaj tablicy), § 25 Dz.U. 2024 poz. 1709 (R-01), in § 25 order:
 * - `ordinary` — zwyczajne (§ 25 pkt 1)
 * - `individual` — indywidualne (§ 25 pkt 2)
 * - `vintage` — zabytkowe (§ 25 pkt 3)
 * - `temporary` — tymczasowe (§ 25 pkt 4)
 * - `diplomatic` — dyplomatyczne (§ 25 pkt 5)
 */
export type PlateType =
  | 'ordinary'
  | 'individual'
  | 'vintage'
  | 'temporary'
  | 'diplomatic';

export type PlateTypes = readonly [PlateType, ...PlateType[]];

const PLATE_TYPE_ORDER: readonly PlateType[] = [
  'ordinary',
  'individual',
  'vintage',
  'temporary',
  'diplomatic',
];

/** Union in § 25 order without duplicates; non-empty because `first` is. */
export function mergePlateTypes(
  first: PlateTypes,
  ...rest: readonly PlateTypes[]
): PlateTypes {
  const present = new Set<PlateType>([first, ...rest].flat());
  const [head, ...tail] = PLATE_TYPE_ORDER.filter((type) => present.has(type));
  return [head, ...tail];
}
