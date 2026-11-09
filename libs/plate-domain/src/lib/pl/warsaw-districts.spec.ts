import { registry, warsawDistricts } from '@plate-region/plate-data';

import { warsawDistrictRowsByCode } from './warsaw-districts';

describe('warsawDistrictRowsByCode', () => {
  it('throws when the m.st. Warszawa region2 record is missing', () => {
    expect(() =>
      warsawDistrictRowsByCode(registry.region1, [], warsawDistricts.rows),
    ).toThrow(/m\.st\. Warszawa region2 record is missing/);
  });

  it('throws when the mazowieckie region1 record is missing', () => {
    const warszawa = registry.region2.filter(
      (region2) =>
        region2.region1Letter === 'W' && region2.name === 'm.st. Warszawa',
    );
    expect(() =>
      warsawDistrictRowsByCode([], warszawa, warsawDistricts.rows),
    ).toThrow(/mazowieckie region1 record is missing/);
  });

  it('throws when a Warszawa suffix has no district row', () => {
    expect(() =>
      warsawDistrictRowsByCode(
        registry.region1,
        registry.region2,
        warsawDistricts.rows.filter((row) => row.suffix !== 'A'),
      ),
    ).toThrow(/no Warsaw district row for suffix A/);
  });
});
