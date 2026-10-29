import type { Country, Region1, Region2 } from '@plate-region/plate-data';

import { normalisePlateInput } from './normalise-plate-input';
import type { PlateType } from './plate-type';
import { mergePlateTypes } from './plate-type';
import {
  region1ForFirstLetter,
  rejectWithoutRegion1,
  resolveCompact,
  type Reading,
} from './readings';

/**
 * Result of {@link parsePlate}. Discriminated union on `status`; every variant
 * carries `country: 'PL'` (D-07). `region1` / `region2` are registry records by
 * reference. `plateTypes` is non-empty and in § 25 order (D-34); more than one
 * element means the type is not determined by the characters alone —
 * § 30 ust. 2 pkt 2 (R-26), § 30 ust. 3 (R-35).
 */
export type ParseResult =
  | {
      /** Every valid reading names this region2. */
      readonly status: 'resolved';
      readonly country: Country;
      readonly region1: Region1;
      readonly region2: Region2;
      readonly plateTypes: readonly [PlateType, ...PlateType[]];
    }
  | {
      /**
       * No reading carries a region2: reduced, diplomatic, temporary or
       * individual plates — § 27 ust. 3 (R-08), § 27 ust. 10 (R-20),
       * § 30 ust. 2 pkt 2 (R-26), § 30 ust. 2 pkt 4 (R-29), § 30 ust. 2 pkt 6 (R-32),
       * § 30 ust. 2 pkt 7 (R-33).
       */
      readonly status: 'region1-only';
      readonly country: Country;
      readonly region1: Region1;
      readonly plateTypes: readonly [PlateType, ...PlateType[]];
    }
  | {
      /**
       * One reading names a region2 and another carries none; region1 is the same
       * in every reading (e.g. `WOO1A`). Arises only from look-alike characters
       * (0/O, 1/I) at positions 2–3.
       */
      readonly status: 'ambiguous';
      readonly country: Country;
      readonly region1: Region1;
      readonly withRegion2: {
        readonly region2: Region2;
        readonly plateTypes: readonly [PlateType, ...PlateType[]];
      };
      readonly withoutRegion2: {
        readonly plateTypes: readonly [PlateType, ...PlateType[]];
      };
    }
  | {
      /** Valid column-4+5 shape whose distinguisher is not in the current registry (D-26). */
      readonly status: 'region2-not-in-registry';
      readonly country: Country;
      readonly region1: Region1;
      readonly plateTypes: readonly [PlateType, ...PlateType[]];
    }
  | {
      /**
       * First character is a letter outside Annex 13 column 4 (H, U) —
       * § 31 ust. 2 (R-37), Annex 13 table header (R-48). Final within
       * Dz.U. 2024 poz. 1709; out of scope: service, military and trade
       * plates (D-35, D-46).
       */
      readonly status: 'not-in-registry';
      readonly country: Country;
    }
  | {
      /** Characters outside § 30 ust. 1 (R-23), as typed. */
      readonly status: 'invalid-input';
      readonly country: Country;
      readonly reason: 'invalid-characters';
      readonly invalidCharacters: readonly string[];
    }
  | {
      /**
       * No matching format, including a leading digit or incomplete input
       * (`D`, `DW`, `WA1`).
       */
      readonly status: 'invalid-input';
      readonly country: Country;
      readonly reason: 'no-matching-format';
    }
  | {
      /** Empty or separator-only input. */
      readonly status: 'empty';
      readonly country: Country;
    };

function mapNonEmpty<T, U>(
  items: readonly [T, ...T[]],
  mapFn: (item: T) => U,
): [U, ...U[]] {
  const [head, ...tail] = items;
  return [mapFn(head), ...tail.map(mapFn)];
}

function classify(
  readings: readonly [Reading, ...Reading[]],
  region1: Region1,
): ParseResult {
  const [head, ...tail] = mapNonEmpty(
    readings,
    (reading) => reading.plateTypes,
  );
  const all = mergePlateTypes(head, ...tail);

  const [first, ...withRest] = readings.filter(
    (reading): reading is Reading & { region2: Region2 } =>
      reading.region2 !== undefined,
  );
  if (first === undefined) {
    return {
      status: 'region1-only',
      country: 'PL',
      region1,
      plateTypes: all,
    };
  }

  const [withoutFirst, ...withoutRest] = readings.filter(
    (reading) => reading.region2 === undefined,
  );
  if (withoutFirst === undefined) {
    return {
      status: 'resolved',
      country: 'PL',
      region1,
      region2: first.region2,
      plateTypes: all,
    };
  }

  const [withHead, ...withTail] = mapNonEmpty(
    [first, ...withRest],
    (reading) => reading.plateTypes,
  );
  const [withoutHead, ...withoutTail] = mapNonEmpty(
    [withoutFirst, ...withoutRest],
    (reading) => reading.plateTypes,
  );
  return {
    status: 'ambiguous',
    country: 'PL',
    region1,
    withRegion2: {
      region2: first.region2,
      plateTypes: mergePlateTypes(withHead, ...withTail),
    },
    withoutRegion2: {
      plateTypes: mergePlateTypes(withoutHead, ...withoutTail),
    },
  };
}

/**
 * Parses typed or recognised plate text into the regions and plate types it encodes.
 *
 * A leading `0` or `1` is read as `O` or `I` (`0P12345`, `1B12345`). Characters outside
 * § 30 ust. 1 (R-23) yield `invalid-input` / `invalid-characters`. Separators do not
 * change the result. Incomplete input such as `D`, `DW` or `WA1` is `no-matching-format`;
 * candidates while typing are {@link candidatesFor}. All-zero digit groups where the act
 * starts at 0…01 are `no-matching-format` — § 30 ust. 2 pkt 1–3, 5–7 (R-34). Vehicle-part
 * letters B, D, I, O and Z are rejected except on individual plates — § 31 ust. 1 (R-36).
 * From position 4, a typed I or O is read as 1 or 0 (D-42); on individual
 * plates I and O remain letters — § 32 ust. 2 (R-39).
 *
 * Result variants: {@link ParseResult}.
 */
export function parsePlate(input: string): ParseResult {
  const normalised = normalisePlateInput(input);
  if (normalised.status === 'invalid') {
    return {
      status: 'invalid-input',
      country: 'PL',
      reason: 'invalid-characters',
      invalidCharacters: normalised.invalidCharacters,
    };
  }

  const { compact } = normalised;
  if (compact.length === 0) {
    return { status: 'empty', country: 'PL' };
  }

  const region1 = region1ForFirstLetter(compact);
  if (region1 === undefined) {
    const reject = rejectWithoutRegion1(compact);
    if (reject.status === 'not-in-registry') {
      return { status: 'not-in-registry', country: 'PL' };
    }
    return {
      status: 'invalid-input',
      country: 'PL',
      reason: 'no-matching-format',
    };
  }

  const resolution = resolveCompact(compact);
  switch (resolution.kind) {
    case 'registry':
      return classify(resolution.readings, region1);
    case 'unregistered-shape':
      return {
        status: 'region2-not-in-registry',
        country: 'PL',
        region1,
        plateTypes: resolution.plateTypes,
      };
    case 'none':
      return {
        status: 'invalid-input',
        country: 'PL',
        reason: 'no-matching-format',
      };
  }
}
