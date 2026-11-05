import { fullCodes, registry, type Region2 } from '@plate-region/plate-data';

import { countyHeading } from './county-heading';

function county(code: string): Region2 {
  for (const region1 of registry.region1) {
    for (const region2 of registry.region2) {
      if (region2.region1Letter !== region1.letters[0]) {
        continue;
      }
      if (fullCodes(region1, region2).includes(code)) {
        return region2;
      }
    }
  }
  throw new Error(`no county with code ${code}`);
}

describe('countyHeading', () => {
  it('uses the city key with the county name', () => {
    expect(countyHeading(county('DW'))).toEqual({
      key: 'county.heading.city',
      params: { name: county('DW').name },
    });
  });

  it('uses the land key with the county name', () => {
    expect(countyHeading(county('GDA'))).toEqual({
      key: 'county.heading.land',
      params: { name: county('GDA').name },
    });
  });
});
