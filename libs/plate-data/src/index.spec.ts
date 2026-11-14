import * as api from './index';

describe('plate-data public API', () => {
  it('exports only the intended runtime symbols', () => {
    expect(Object.keys(api).sort()).toEqual([
      'PATH_GRAMMAR',
      'countyMapLoaders',
      'countyMapProvenance',
      'countyMapWaterProvenance',
      'countySeat',
      'countySeatsProvenance',
      'decodeCountySeats',
      'fullCodes',
      'loadCountryMap',
      'loadWarsawDistrictMap',
      'registry',
      'voivodeshipCapitals',
      'warsawDistricts',
    ]);
  });
});
