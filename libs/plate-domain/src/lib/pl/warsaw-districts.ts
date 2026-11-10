import {
  fullCodes,
  registry,
  warsawDistricts,
  type Region1,
  type Region2,
  type UnofficialName,
  type WarsawDistrictRow,
} from '@plate-region/plate-data';

import type { Reading } from './readings';

/**
 * Index of Warszawa full codes to district rows. Exported so the data-integrity
 * throws can be covered when the registry or rows are incomplete (D-18).
 */
export function warsawDistrictRowsByCode(
  region1List: readonly Region1[],
  region2List: readonly Region2[],
  rows: readonly WarsawDistrictRow[],
): ReadonlyMap<string, WarsawDistrictRow> {
  const warszawa = region2List.find(
    (region2) =>
      region2.region1Letter === 'W' && region2.name === 'm.st. Warszawa',
  );
  if (warszawa === undefined) {
    throw new Error('m.st. Warszawa region2 record is missing');
  }
  const mazowieckie = region1List.find((region1) => region1.letters[0] === 'W');
  if (mazowieckie === undefined) {
    throw new Error('mazowieckie region1 record is missing');
  }
  const rowsBySuffix = new Map(rows.map((row) => [row.suffix, row]));
  const map = new Map<string, WarsawDistrictRow>();
  for (const code of fullCodes(mazowieckie, warszawa)) {
    const suffix = code.slice(-1);
    const row = rowsBySuffix.get(suffix);
    if (row === undefined) {
      throw new Error(`no Warsaw district row for suffix ${suffix}`);
    }
    map.set(code, row);
  }
  return map;
}

const BY_CODE: ReadonlyMap<string, WarsawDistrictRow> =
  warsawDistrictRowsByCode(
    registry.region1,
    registry.region2,
    warsawDistricts.rows,
  );

/**
 * Districts of the `warsawDistricts` row for an m.st. Warszawa full code, or
 * undefined for any other string (D-58 Update #141).
 */
export function warsawDistrictsForCode(
  code: string,
): readonly [UnofficialName, ...UnofficialName[]] | undefined {
  return BY_CODE.get(code)?.districts;
}

/**
 * Unofficial district names for a Warszawa reading with a five-character vehicle
 * part, or undefined when the reading is out of scope (D-57).
 */
export function districtsOf(
  reading: Reading,
): readonly [UnofficialName, ...UnofficialName[]] | undefined {
  const row = BY_CODE.get(reading.code);
  if (row === undefined) {
    return undefined;
  }
  if (reading.vehiclePart.length !== 5) {
    return undefined;
  }
  for (const rule of warsawDistricts.rules) {
    if (
      rule.code === reading.code &&
      rule.vehiclePart.test(reading.vehiclePart)
    ) {
      return rule.district === undefined ? undefined : [rule.district];
    }
  }
  return row.districts;
}
