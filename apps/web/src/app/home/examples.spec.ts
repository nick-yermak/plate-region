import { examplePlateForCode } from '@plate-region/plate-domain';

import { homeExamples } from './examples';

describe('homeExamples', () => {
  // First/last two- and three-character full codes in Załącznik 13 order
  // (tmp/D20241709.txt): DJ line 3359 (Jelenia Góra D, V J); DBL line 3363
  // (bolesławiecki D, V BL); ZZ line 3791 (Szczecin Z S, Z); ZWA line 3810
  // (wałecki Z WA).
  it('picks the first codes for 0', () => {
    const random = () => 0;
    expect(homeExamples(random)).toEqual([
      'DJ',
      'DBL',
      examplePlateForCode('DJ', random),
    ]);
  });

  it('picks the last codes just below 1', () => {
    const random = () => 0.999999;
    expect(homeExamples(random)).toEqual([
      'ZZ',
      'ZWA',
      examplePlateForCode('ZWA', random),
    ]);
  });

  it('calls the random source four times', () => {
    let calls = 0;
    homeExamples(() => {
      calls += 1;
      return 0;
    });
    expect(calls).toBe(4);
  });

  it('rejects a random value outside [0, 1)', () => {
    expect(() => homeExamples(() => 1)).toThrow(RangeError);
  });
});
