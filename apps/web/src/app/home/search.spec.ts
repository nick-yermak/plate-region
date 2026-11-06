import { search } from './search';

describe('search', () => {
  it.each([
    ['dw-12345', 'DW 12345'],
    ['WA12', 'WA12'],
    ['WOO1A', 'WOO1A'],
    ['DA 12345', 'DA 12345'],
  ] as const)(
    'navigates for every complete status: %s → %s',
    (input, plate) => {
      expect(search(input)).toEqual({ kind: 'navigate', plate });
    },
  );

  it('joins normalised groups with one space', () => {
    expect(search('  dw - 12345 ')).toEqual({
      kind: 'navigate',
      plate: 'DW 12345',
    });
  });

  it('reads a leading 0 as O in the URL', () => {
    expect(search('0P 12345')).toEqual({
      kind: 'navigate',
      plate: 'OP 12345',
    });
  });

  it.each([
    ['DW', 'DW'],
    ['g d', 'G D'],
    ['2A12345', '2A12345'],
    ['H', 'H'],
  ] as const)(
    'navigates for short codes and dead ends: %s → %s',
    (input, plate) => {
      expect(search(input)).toEqual({ kind: 'navigate', plate });
    },
  );

  it('lists invalid characters', () => {
    expect(search('DW 1234Q')).toEqual({
      kind: 'error',
      error: { kind: 'invalid-characters', characters: ['Q'] },
    });
  });

  it.each(['', ' -. '] as const)('reports empty input for %j', (input) => {
    expect(search(input)).toEqual({
      kind: 'error',
      error: { kind: 'empty' },
    });
  });

  it.each([
    ['hpn 12aa', 'HPN 12AA'],
    ['UA12345', 'UA12345'],
  ] as const)(
    'navigates for a service or military series: %s → %s',
    (input, plate) => {
      expect(search(input)).toEqual({ kind: 'navigate', plate });
    },
  );
});
