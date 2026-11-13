import {
  countySeat,
  fullCodes,
  registry,
  type Region2,
} from '@plate-region/plate-data';

import type { TranslatableMessage } from '../../i18n/i18n.types';

export type SharedSeatCountyPair = {
  readonly region1Letter: string;
  readonly seat: string;
  readonly cityCode: string;
  readonly landCode: string;
  readonly landName: string;
};

/**
 * Land counties that share a seat with a city county of the same voivodeship
 * (D-54 Update #169). One pair per such land county.
 */
export function sharedSeatCountyPairs(): readonly SharedSeatCountyPair[] {
  const pairs: SharedSeatCountyPair[] = [];
  for (const region1 of registry.region1) {
    const letter = region1.letters[0];
    const rows = registry.region2.filter(
      (region2) => region2.region1Letter === letter,
    );
    const cities = rows.filter((region2) => region2.kind === 'city');
    for (const land of rows) {
      if (land.kind !== 'land') {
        continue;
      }
      const seat = countySeat(land);
      const city = cities.find((c) => countySeat(c) === seat);
      if (city === undefined) {
        continue;
      }
      pairs.push({
        region1Letter: letter,
        seat,
        cityCode: fullCodes(region1, city)[0],
        landCode: fullCodes(region1, land)[0],
        landName: land.name,
      });
    }
  }
  return pairs;
}

const sharedSeatsByLetter = new Map<string, ReadonlySet<string>>();

function sharedSeats(region1Letter: string): ReadonlySet<string> {
  const cached = sharedSeatsByLetter.get(region1Letter);
  if (cached !== undefined) {
    return cached;
  }
  const seats = new Set(
    sharedSeatCountyPairs()
      .filter((pair) => pair.region1Letter === region1Letter)
      .map((pair) => pair.seat),
  );
  sharedSeatsByLetter.set(region1Letter, seats);
  return seats;
}

/**
 * County display name for headings and tables (D-54 Update #169): seat-based,
 * with disambiguation when a city and a land county share a seat. Optional
 * `district` is only for m.st. Warszawa when the plate resolves to exactly one.
 */
export function countyHeading(
  region2: Region2,
  district?: string,
): TranslatableMessage {
  const seat = countySeat(region2);
  const shared = sharedSeats(region2.region1Letter);
  if (region2.kind === 'city') {
    if (district !== undefined) {
      return {
        key: 'county.heading.cityWithDistrict',
        params: { seat, district },
      };
    }
    if (shared.has(seat)) {
      return { key: 'county.heading.cityShared', params: { seat } };
    }
    return { key: 'county.heading.city', params: { seat } };
  }
  if (shared.has(seat)) {
    return { key: 'county.heading.landShared', params: { seat } };
  }
  return {
    key: 'county.heading.land',
    params: { seat, name: region2.name },
  };
}
