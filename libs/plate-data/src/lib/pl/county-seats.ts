import { registry } from './registry';
import type { Region2 } from './model';
import { countySeats } from './county-seats-data';

/** Source of the county-seat list (M.P. 2017 poz. 853). */
export interface CountySeatsProvenance {
  readonly title: string;
  readonly url: string;
  readonly downloaded: string;
  readonly sha256: string;
}

export const countySeatsProvenance = {
  title:
    'Obwieszczenie Prezesa Rady Ministrów z dnia 23 sierpnia 2017 r. w sprawie wykazu gmin i powiatów wchodzących w skład województw (M.P. 2017 poz. 853)',
  url: 'https://api.sejm.gov.pl/eli/acts/MP/2017/853/text.pdf',
  downloaded: '2026-11-12',
  sha256: '25647323113857f04cbcf5490c1b3117907d944500d1d8dae9dbe2985e4f77c1',
} as const satisfies CountySeatsProvenance;

function firstCode(region2: Region2): string {
  return `${region2.region1Letter}${region2.suffixes[0]}`;
}

/**
 * Builds a map from each county's first code (D-07) to its seat name.
 * Throws when `seats` length differs from `region2` or a seat is empty.
 */
export function decodeCountySeats(
  seats: readonly string[],
  region2: readonly Region2[],
): ReadonlyMap<string, string> {
  if (seats.length !== region2.length) {
    throw new Error(
      `county seats: ${seats.length} seats, the registry has ${region2.length} counties`,
    );
  }
  const map = new Map<string, string>();
  for (let i = 0; i < region2.length; i++) {
    const region = region2[i] as Region2;
    const code = firstCode(region);
    const seat = seats[i] as string;
    if (seat === '') {
      throw new Error(`county seats: empty seat for ${code}`);
    }
    map.set(code, seat);
  }
  return map;
}

const seatsByCode = decodeCountySeats(countySeats, registry.region2);

/** Seat of `region2` (city name for a city county; seat town for a land county). */
export function countySeat(region2: Region2): string {
  const code = firstCode(region2);
  const seat = seatsByCode.get(code);
  if (seat === undefined) {
    throw new Error(`county seats: no seat for ${code}`);
  }
  return seat;
}
