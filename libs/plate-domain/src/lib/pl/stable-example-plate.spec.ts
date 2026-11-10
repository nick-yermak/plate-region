import { fullCodes, registry } from '@plate-region/plate-data';
import type { Region1, Region2 } from '@plate-region/plate-data';

import { parsePlate } from './parse-plate';
import { examplePlateForCode } from './example-plate';
import {
  fmix32,
  fnv1a32,
  stableExamplePlateForCode,
} from './stable-example-plate';

describe('fnv1a32', () => {
  it('matches published FNV-1a vectors', () => {
    expect(fnv1a32('')).toBe(0x811c9dc5);
    expect(fnv1a32('a')).toBe(0xe40c292c);
    expect(fnv1a32('foobar')).toBe(0xbf9cf968);
  });
});

describe('fmix32', () => {
  it('matches the independent MurmurHash3 finalizer oracle', () => {
    expect(fmix32(0)).toBe(0);
    expect(fmix32(1)).toBe(0x514e28b7);
    expect(fmix32(0xffffffff)).toBe(0x81f16f39);
  });
});

describe('stableExamplePlateForCode', () => {
  it('matches examplePlateForCode for DW with the oracle r 0x6d44ac95 / 2**32', () => {
    // Independent oracle: fmix32(fnv1a32('DW')) === 0x6d44ac95 (catches a missing finalizer).
    expect(stableExamplePlateForCode('DW')).toBe(
      examplePlateForCode('DW', () => 0x6d44ac95 / 2 ** 32),
    );
  });

  it('returns undefined for a string that is not a full registry code', () => {
    expect(stableExamplePlateForCode('QQ')).toBeUndefined();
  });

  it.each(registry.region1.map((region1) => [region1.name, region1] as const))(
    'resolves every full code of %s to that code region2',
    (_name, region1: Region1) => {
      const counties: Region2[] = registry.region2.filter(
        (region2) => region2.region1Letter === region1.letters[0],
      );
      for (const region2 of counties) {
        for (const code of fullCodes(region1, region2)) {
          expect(
            parsePlate(stableExamplePlateForCode(code) ?? ''),
          ).toMatchObject({ status: 'resolved', region2 });
        }
      }
    },
  );
});
