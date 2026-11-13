import {
  fullCodes,
  registry,
  voivodeshipCapitals,
  type Region1,
  type Region2,
} from '@plate-region/plate-data';

import type { TranslatableMessage } from '../i18n/i18n.types';
import { countyHeading } from '../shared/county/county-heading';

export type VoivodeshipMainCode = {
  readonly code: string;
  readonly name: TranslatableMessage;
};

type CountyRow = {
  readonly region2: Region2;
  readonly code: string;
};

function countiesOf(region1: Region1): CountyRow[] {
  const letter = region1.letters[0];
  const seen = new Set<string>();
  const rows: CountyRow[] = [];
  for (const region2 of registry.region2) {
    if (region2.region1Letter !== letter) {
      continue;
    }
    const key = `${region2.region1Letter}|${region2.kind}|${region2.name}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    rows.push({ region2, code: fullCodes(region1, region2)[0] });
  }
  return rows;
}

function byCode(a: CountyRow, b: CountyRow): number {
  return a.code < b.code ? -1 : a.code > b.code ? 1 : 0;
}

/**
 * Full ordered main codes of `region1`: capitals, then other cities with powiat
 * rights, then land counties; each group by code (D-54 Update #169). Names use
 * `countyHeading`.
 */
export function voivodeshipMainCodes(
  region1: Region1,
): readonly VoivodeshipMainCode[] {
  const letter = region1.letters[0];
  const capitalCodes = new Set(
    voivodeshipCapitals
      .filter(([region1Letter]) => region1Letter === letter)
      .map(([region1Letter, firstSuffix]) => `${region1Letter}${firstSuffix}`),
  );
  const rows = countiesOf(region1);
  const capitals = rows
    .filter((row) => capitalCodes.has(row.code))
    .sort(byCode);
  const cities = rows
    .filter((row) => row.region2.kind === 'city' && !capitalCodes.has(row.code))
    .sort(byCode);
  const land = rows.filter((row) => row.region2.kind === 'land').sort(byCode);
  return [...capitals, ...cities, ...land].map((row) => ({
    code: row.code,
    name: countyHeading(row.region2),
  }));
}
