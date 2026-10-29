import { fullCodes, registry } from '@plate-region/plate-data';
import type { Region1 } from '@plate-region/plate-data';

import type { PlateType } from './plate-type';
import {
  COLUMN_4_TEMPLATES,
  COLUMN_4_5_TEMPLATES,
  COLUMN_6_TEMPLATES,
  runCapacity,
  splitLayout,
  type VehiclePartTemplate,
} from './vehicle-part-templates';

export interface VariantCountBucket {
  /** § 25 types this bucket stands for, in § 25 order — § 25 pkt 1–5 (R-01). */
  readonly plateTypes: readonly [PlateType, ...PlateType[]];
  /** Vehicle-part variants in this bucket. Zero when no template has this set. */
  readonly count: number;
}

export interface VariantCounts {
  /**
   * Always six buckets, in § 25 order of the `plateTypes` tuples:
   * ordinary; ordinary+vintage+temporary; individual; vintage; temporary; diplomatic.
   */
  readonly buckets: readonly [
    VariantCountBucket,
    VariantCountBucket,
    VariantCountBucket,
    VariantCountBucket,
    VariantCountBucket,
    VariantCountBucket,
  ];
  /** Sum of the six bucket counts. */
  readonly total: number;
}

const BUCKET_PLATE_TYPES = [
  ['ordinary'],
  ['ordinary', 'vintage', 'temporary'],
  ['individual'],
  ['vintage'],
  ['temporary'],
  ['diplomatic'],
] as const satisfies readonly (readonly [PlateType, ...PlateType[]])[];

type BucketIndex = 0 | 1 | 2 | 3 | 4 | 5;

/** Counts in {@link BUCKET_PLATE_TYPES} order. */
type BucketCounts = readonly [number, number, number, number, number, number];

const ZERO_BUCKET_COUNTS: BucketCounts = [0, 0, 0, 0, 0, 0];

function bucketCountsFrom(at: (index: BucketIndex) => number): BucketCounts {
  return [at(0), at(1), at(2), at(3), at(4), at(5)];
}

function addBucketCounts(
  left: BucketCounts,
  right: BucketCounts,
): BucketCounts {
  return bucketCountsFrom((i) => left[i] + right[i]);
}

function scaleBucketCounts(counts: BucketCounts, factor: number): BucketCounts {
  return bucketCountsFrom((i) => counts[i] * factor);
}

function toVariantCounts(counts: BucketCounts): VariantCounts {
  const buckets = [
    { plateTypes: BUCKET_PLATE_TYPES[0], count: counts[0] },
    { plateTypes: BUCKET_PLATE_TYPES[1], count: counts[1] },
    { plateTypes: BUCKET_PLATE_TYPES[2], count: counts[2] },
    { plateTypes: BUCKET_PLATE_TYPES[3], count: counts[3] },
    { plateTypes: BUCKET_PLATE_TYPES[4], count: counts[4] },
    { plateTypes: BUCKET_PLATE_TYPES[5], count: counts[5] },
  ] as const satisfies VariantCounts['buckets'];
  return {
    buckets,
    total:
      counts[0] + counts[1] + counts[2] + counts[3] + counts[4] + counts[5],
  };
}

function plateTypesKey(plateTypes: readonly PlateType[]): string {
  return plateTypes.join(',');
}

/** Product over letter/digit runs of one layout (D-43). */
function countLayout(layout: string, individual: boolean): number {
  let product = 1;
  for (const run of splitLayout(layout)) {
    product *= runCapacity(run, individual);
  }
  return product;
}

/**
 * Sum of unique layouts per `plateTypes` set. Identical layouts within one set
 * count once (pkt 1 lit. b and pkt 3 lit. b share six layouts).
 */
function countsForTemplates(
  templates: readonly VehiclePartTemplate[],
): BucketCounts {
  const totals = new Map<string, number>();
  const seenLayouts = new Map<string, Set<string>>();
  for (const template of templates) {
    const key = plateTypesKey(template.plateTypes);
    let layouts = seenLayouts.get(key);
    if (layouts === undefined) {
      layouts = new Set();
      seenLayouts.set(key, layouts);
    }
    if (layouts.has(template.layout)) {
      continue;
    }
    layouts.add(template.layout);
    const individual = template.plateTypes.includes('individual');
    totals.set(
      key,
      (totals.get(key) ?? 0) + countLayout(template.layout, individual),
    );
  }

  return bucketCountsFrom(
    (i) => totals.get(plateTypesKey(BUCKET_PLATE_TYPES[i])) ?? 0,
  );
}

const COUNTS_LEN2 = countsForTemplates(COLUMN_4_5_TEMPLATES[1]);
const COUNTS_LEN3 = countsForTemplates(COLUMN_4_5_TEMPLATES[2]);
const COUNTS_COLUMN_4 = countsForTemplates(COLUMN_4_TEMPLATES);
const COUNTS_COLUMN_6 = countsForTemplates(COLUMN_6_TEMPLATES);

const VARIANT_COUNTS_LEN2 = toVariantCounts(COUNTS_LEN2);
const VARIANT_COUNTS_LEN3 = toVariantCounts(COUNTS_LEN3);

const BY_FULL_CODE: ReadonlyMap<string, VariantCounts> = (() => {
  const map = new Map<string, VariantCounts>();
  for (const region1 of registry.region1) {
    for (const region2 of registry.region2) {
      if (region2.region1Letter !== region1.letters[0]) {
        continue;
      }
      for (const code of fullCodes(region1, region2)) {
        map.set(
          code,
          code.length === 2 ? VARIANT_COUNTS_LEN2 : VARIANT_COUNTS_LEN3,
        );
      }
    }
  }
  return map;
})();

/**
 * Variant counts for one Annex 13 full code (columns 4 and 5).
 *
 * Two characters use § 30 ust. 2 pkt 1 lit. a (R-24), pkt 3 lit. a (R-27) and
 * pkt 5 lit. a (R-30). Three characters use pkt 1 lit. b (R-25), pkt 3 lit. b
 * (R-28) and pkt 5 lit. b (R-31). Layouts shared by pkt 1 lit. b and pkt 3
 * lit. b count once.
 *
 * `buckets` always has six entries. Reduced, diplomatic, temporary and
 * individual are zero after a column-4+5 code. `total` is their sum.
 * A letter run of length k is 20^k: 25 letters of § 30 ust. 1 (R-23) minus
 * B, D, I, O and Z, § 31 ust. 1 (R-36). A digit run is 10^k − 1 —
 * § 30 ust. 2 pkt 1–3, 5–7 (R-34).
 *
 * Returns `undefined` when `code` is not a full code of the current registry.
 */
export function variantCountsForCode(code: string): VariantCounts | undefined {
  return BY_FULL_CODE.get(code);
}

/**
 * Vehicle-part variants the act allows under one voivodeship's distinguishers
 * (D-43). The sum of:
 * - the counts of each of its `fullCodes`, as in {@link variantCountsForCode};
 * - for each column-4 letter: the reduced layouts, § 30 ust. 2 pkt 2 (R-26),
 *   one count shared by the three reduced types, § 30 ust. 3 (R-35); and the
 *   diplomatic layouts, § 30 ust. 2 pkt 7 (R-33);
 * - for each column-6 code: the temporary layouts, § 30 ust. 2 pkt 6 (R-32);
 *   and the individual layouts, § 30 ust. 2 pkt 4 (R-29), drawn in Annex 12
 *   Rys. 12, 13, 15 (R-44).
 * Both column-4 letters count.
 *
 * Individual counts are an upper bound: § 32 ust. 3 (R-49). Individual layouts
 * use 25^k letters, § 32 ust. 2 (R-39), and 10^k digits, § 30 ust. 2 pkt 4
 * (R-29). Every other digit run is 10^k − 1 — § 30 ust. 2 pkt 1–3, 5–7 (R-34).
 *
 * `buckets` and `total` have the same shape as in {@link variantCountsForCode}.
 * `region1` is a record from the plate-data registry.
 */
export function variantCountsForRegion1(region1: Region1): VariantCounts {
  let sum: BucketCounts = ZERO_BUCKET_COUNTS;
  for (const region2 of registry.region2) {
    if (region2.region1Letter !== region1.letters[0]) {
      continue;
    }
    for (const code of fullCodes(region1, region2)) {
      sum = addBucketCounts(sum, code.length === 2 ? COUNTS_LEN2 : COUNTS_LEN3);
    }
  }
  return toVariantCounts(
    addBucketCounts(
      addBucketCounts(
        sum,
        scaleBucketCounts(COUNTS_COLUMN_4, region1.letters.length),
      ),
      scaleBucketCounts(COUNTS_COLUMN_6, region1.letterDigitCodes.length),
    ),
  );
}
