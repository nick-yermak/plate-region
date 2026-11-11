import * as api from './index';

describe('plate-data public API', () => {
  it('exports only the intended runtime symbols', () => {
    expect(Object.keys(api).sort()).toEqual([
      'countyMapLoaders',
      'countyMapProvenance',
      'fullCodes',
      'loadCountryMap',
      'loadWarsawDistrictMap',
      'registry',
      'warsawDistricts',
    ]);
  });
});
