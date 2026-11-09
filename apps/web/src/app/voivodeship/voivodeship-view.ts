import { fullCodes, registry } from '@plate-region/plate-data';
import type { Region1, Region2 } from '@plate-region/plate-data';
import {
  stableExamplePlateForCode,
  voivodeshipSlug,
} from '@plate-region/plate-domain';

export type VoivodeshipCountyView = {
  readonly region2: Region2;
  readonly codes: readonly { readonly code: string; readonly plate: string }[];
};

export type VoivodeshipView =
  | {
      readonly status: 'found';
      readonly region1: Region1;
      readonly counties: readonly VoivodeshipCountyView[];
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

  const counties: VoivodeshipCountyView[] = [];
  let codeCount = 0;
  for (const region2 of registry.region2) {
    if (region2.region1Letter !== region1.letters[0]) {
      continue;
    }
    const codes = fullCodes(region1, region2).map((code) => {
      const plate = stableExamplePlateForCode(code);
      if (plate === undefined) {
        // unreachable: every full code resolves (D-44 Update #93)
        throw new Error(`no example plate for full code ${code}`);
      }
      return { code, plate };
    });
    codeCount += codes.length;
    counties.push({ region2, codes });
  }

  return {
    status: 'found',
    region1,
    counties,
    countyCount: counties.length,
    codeCount,
  };
}
