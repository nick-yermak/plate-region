import { parsePlate } from './parse-plate';

describe('parsePlate districts (Warsaw)', () => {
  it.each([
    { input: 'WE 12345', expected: ['Mokotów'] },
    { input: 'AE 12345', expected: ['Mokotów'] },
    { input: 'WW 1234A', expected: ['Rembertów'] },
    { input: 'WW 1234F', expected: ['Wilanów'] },
    { input: 'WW 1234K', expected: ['Włochy'] },
    { input: 'WW 123AJ', expected: ['Rembertów'] },
    { input: 'WW 123GA', expected: ['Wilanów'] },
    { input: 'WW 123SA', expected: ['Włochy'] },
    {
      input: 'WW 12345',
      expected: ['Rembertów', 'Wilanów', 'Włochy'],
    },
    { input: 'WX 123YA', expected: ['Wesoła'] },
    { input: 'WX 12345', expected: ['Żoliborz'] },
    { input: 'WY 12345', expected: ['Wola'] },
    {
      input: 'AW 1234A',
      expected: ['Rembertów', 'Wilanów', 'Włochy'],
    },
    { input: 'AX 123YA', expected: ['Wesoła', 'Żoliborz'] },
    { input: 'AY 1234Y', expected: ['Wola'] },
    { input: 'WE 1234O', expected: ['Mokotów'] },
  ])('$input → districts $expected', ({ input, expected }) => {
    const result = parsePlate(input);
    expect(result.status).toBe('resolved');
    if (result.status !== 'resolved') {
      return;
    }
    expect(result.region2.name).toBe('m.st. Warszawa');
    expect(result.districts?.map((d) => d.value)).toEqual(expected);
  });

  it('WE 12345 districts have origin unofficial', () => {
    const result = parsePlate('WE 12345');
    expect(result.status).toBe('resolved');
    if (result.status !== 'resolved') {
      return;
    }
    expect(result.districts?.[0]?.origin).toBe('unofficial');
  });

  it.each([
    { input: 'WY 1234Y', region2: 'm.st. Warszawa' },
    { input: 'WY 123VA', region2: 'm.st. Warszawa' },
    { input: 'WE 1234', region2: 'm.st. Warszawa' },
    { input: 'WS 12345', region2: 'Siedlce' },
    { input: 'WZ 12345', region2: 'warszawski zachodni' },
  ])('$input has no districts key ($region2)', ({ input, region2 }) => {
    const result = parsePlate(input);
    expect(result.status).toBe('resolved');
    if (result.status !== 'resolved') {
      return;
    }
    expect(result.region2.name).toBe(region2);
    expect('districts' in result).toBe(false);
  });

  it('WIIKK12 → ambiguous withRegion2 districts Śródmieście', () => {
    const result = parsePlate('WIIKK12');
    expect(result.status).toBe('ambiguous');
    if (result.status !== 'ambiguous') {
      return;
    }
    expect(result.withRegion2.region2.name).toBe('m.st. Warszawa');
    expect(result.withRegion2.districts?.map((d) => d.value)).toEqual([
      'Śródmieście',
    ]);
  });
});
