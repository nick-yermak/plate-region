import { registry, warsawDistricts } from '@plate-region/plate-data';

import {
  warsawDistrictRowsByCode,
  warsawDistrictsForCode,
} from './warsaw-districts';

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

describe('warsawDistrictsForCode', () => {
  it('WW and AW → Rembertów, Wilanów, Włochy', () => {
    expect(warsawDistrictsForCode('WW')?.map((d) => d.value)).toEqual([
      'Rembertów',
      'Wilanów',
      'Włochy',
    ]);
    expect(warsawDistrictsForCode('AW')?.map((d) => d.value)).toEqual([
      'Rembertów',
      'Wilanów',
      'Włochy',
    ]);
  });

  it('WA → Białołęka; DW and WZY → undefined', () => {
    expect(warsawDistrictsForCode('WA')?.map((d) => d.value)).toEqual([
      'Białołęka',
    ]);
    expect(warsawDistrictsForCode('DW')).toBeUndefined();
    expect(warsawDistrictsForCode('WZY')).toBeUndefined();
  });
});
