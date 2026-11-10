import { fullCodes, registry } from '@plate-region/plate-data';
import type {
  Region1,
  Region2,
  UnofficialName,
} from '@plate-region/plate-data';
import {
  stableExamplePlateForCode,
  voivodeshipSlug,
  warsawDistrictsForCode,
} from '@plate-region/plate-domain';

export type VoivodeshipRowView = {
  readonly region2: Region2;
  readonly districts:
    | readonly [UnofficialName, ...UnofficialName[]]
    | undefined;
  readonly codes: readonly [string, ...string[]];
  readonly plate: string;
};

export type VoivodeshipView =
  | {
      readonly status: 'found';
      readonly region1: Region1;
      readonly rows: readonly VoivodeshipRowView[];
      readonly countyCount: number;
      readonly codeCount: number;
    }
  | { readonly status: 'not-found' };

export function voivodeshipView(slug: string): VoivodeshipView {
  const region1 = registry.region1.find(
    (entry) => voivodeshipSlug(entry) === slug,
  );
  if (region1 === undefined) {
    return { status: 'not-found' };
  }

  const rows: VoivodeshipRowView[] = [];
  let codeCount = 0;
  let countyCount = 0;
  for (const region2 of registry.region2) {
    if (region2.region1Letter !== region1.letters[0]) {
      continue;
    }
    countyCount += 1;
    // Same districts array reference → same row; undefined → one row (D-58 Update #141).
    const groups = new Map<
      readonly [UnofficialName, ...UnofficialName[]] | undefined,
      [string, ...string[]]
    >();
    for (const code of fullCodes(region1, region2)) {
      codeCount += 1;
      const districts = warsawDistrictsForCode(code);
      const existing = groups.get(districts);
      if (existing === undefined) {
        groups.set(districts, [code]);
      } else {
        existing.push(code);
      }
    }
    for (const [districts, codes] of groups) {
      const plate = stableExamplePlateForCode(codes[0]);
      if (plate === undefined) {
        // unreachable: every full code resolves (D-44 Update #93)
        throw new Error(`no example plate for full code ${codes[0]}`);
      }
      rows.push({
        region2,
        districts,
        codes,
        plate,
      });
    }
  }

  return {
    status: 'found',
    region1,
    rows,
    countyCount,
    codeCount,
  };
}
