import { search } from './search';
import { county, found } from './home.testing';
import { candidatesView } from '../plate/candidates-view';

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

  it('returns candidates for an incomplete plate', () => {
    expect(search('DW')).toEqual({
      kind: 'candidates',
      view: candidatesView(found('DW'), 'DW'),
    });
  });

  it('answers for a separated full code', () => {
    expect(search('G D')).toMatchObject({
      kind: 'candidates',
      view: {
        answer: {
          codes: ['GD'],
          region2: { name: county('GD').name },
        },
      },
    });
  });

  it('reports a dead end as no-matching-format', () => {
    expect(search('2A12345')).toEqual({
      kind: 'error',
      error: { kind: 'no-matching-format' },
    });
  });

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

  it('reports not-in-registry', () => {
    expect(search('H')).toEqual({
      kind: 'error',
      error: { kind: 'not-in-registry' },
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
