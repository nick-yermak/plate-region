import { registry } from './registry';
import { warsawDistricts } from './warsaw-districts';

const WARSAW_SUFFIXES = [
  'A',
  'B',
  'D',
  'E',
  'F',
  'H',
  'I',
  'J',
  'K',
  'N',
  'T',
  'U',
  'W',
  'X',
  'Y',
] as const;

describe('warsawDistricts', () => {
  it("rows' suffixes equal the m.st. Warszawa registry suffix list", () => {
    const warszawa = registry.region2.find(
      (r) => r.region1Letter === 'W' && r.name === 'm.st. Warszawa',
    );
    expect(warszawa?.suffixes).toEqual([...WARSAW_SUFFIXES]);
    expect(warsawDistricts.rows.map((row) => row.suffix)).toEqual([
      ...WARSAW_SUFFIXES,
    ]);
  });

  it("every district name has origin: 'unofficial'", () => {
    for (const row of warsawDistricts.rows) {
      for (const district of row.districts) {
        expect(district.origin).toBe('unofficial');
      }
    }
  });

  it('first source url contains oldid=80939616', () => {
    expect(warsawDistricts.sources[0].url).toContain('oldid=80939616');
  });
});
