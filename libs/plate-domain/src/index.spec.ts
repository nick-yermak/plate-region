import * as api from './index';

describe('plate-domain public API', () => {
  it('exports only the intended runtime symbols', () => {
    expect(Object.keys(api).sort()).toEqual([
      'candidatesFor',
      'examplePlateForCode',
      'examplePlateForRegion1',
      'parsePlate',
      'variantCountsForCode',
      'variantCountsForRegion1',
    ]);
  });
});
