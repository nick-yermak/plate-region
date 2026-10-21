import { normalisePlateInput } from './normalise-plate-input';
import type { NormalisedPlateInput } from './normalise-plate-input';

function ok(
  groups: readonly string[],
): Extract<NormalisedPlateInput, { status: 'ok' }> {
  return { status: 'ok', groups, compact: groups.join('') };
}

function invalid(
  invalidCharacters: readonly string[],
): Extract<NormalisedPlateInput, { status: 'invalid' }> {
  return { status: 'invalid', invalidCharacters };
}

describe('normalisePlateInput', () => {
  describe('case (R4)', () => {
    it.each([
      { input: 'wa', expected: ok(['WA']) },
      { input: 'Kr', expected: ok(['KR']) },
      { input: 'kRa', expected: ok(['KRA']) },
    ])('$input → $expected.compact', ({ input, expected }) => {
      expect(normalisePlateInput(input)).toEqual(expected);
    });
  });

  describe('separators (R5)', () => {
    it.each([
      { input: ' WA', expected: ok(['WA']) },
      { input: 'WA ', expected: ok(['WA']) },
      { input: 'DW  W', expected: ok(['DW', 'W']) },
      { input: 'DW\tW', expected: ok(['DW', 'W']) },
      { input: 'DW\u00A0W', expected: ok(['DW', 'W']) },
      { input: 'DW-W', expected: ok(['DW', 'W']) },
      { input: 'DW\u2013W', expected: ok(['DW', 'W']) },
      { input: 'DW\u2014W', expected: ok(['DW', 'W']) },
      { input: 'DW.W', expected: ok(['DW', 'W']) },
      { input: 'DW .-\u00A0\t W', expected: ok(['DW', 'W']) },
      { input: ' -.DW W. \t', expected: ok(['DW', 'W']) },
      { input: 'DWW', expected: ok(['DWW']) },
    ])('$input → groups $expected.groups', ({ input, expected }) => {
      expect(normalisePlateInput(input)).toEqual(expected);
    });
  });

  describe('empty and separator-only (R6)', () => {
    it.each([
      { input: '', expected: ok([]) },
      { input: ' \t\u00A0-\u2013\u2014. ', expected: ok([]) },
    ])('$input → empty ok', ({ input, expected }) => {
      expect(normalisePlateInput(input)).toEqual(expected);
    });
  });

  describe('first-position look-alikes (R2)', () => {
    it.each([
      { input: '0P', expected: ok(['OP']) },
      { input: '1O', expected: ok(['IO']) },
      { input: ' 0P', expected: ok(['OP']) },
      { input: '-1O', expected: ok(['IO']) },
      { input: '0', expected: ok(['O']) },
      { input: '1', expected: ok(['I']) },
    ])('$input → $expected.compact', ({ input, expected }) => {
      expect(normalisePlateInput(input)).toEqual(expected);
    });
  });

  describe('no look-alike substitution elsewhere (R3)', () => {
    it.each([
      { input: 'S0', expected: ok(['S0']) },
      { input: 'SO', expected: ok(['SO']) },
      { input: 'I1', expected: ok(['I1']) },
      { input: '00', expected: ok(['O0']) },
      { input: '11', expected: ok(['I1']) },
      { input: 'SK 0', expected: ok(['SK', '0']) },
      { input: 'SK 1', expected: ok(['SK', '1']) },
      { input: 'SK O', expected: ok(['SK', 'O']) },
      { input: 'SK I', expected: ok(['SK', 'I']) },
      { input: '0 0', expected: ok(['O', '0']) },
    ])('$input → $expected.groups', ({ input, expected }) => {
      expect(normalisePlateInput(input)).toEqual(expected);
    });
  });

  describe('invalid characters (R1, R4)', () => {
    it.each([
      { input: 'Q', expected: invalid(['Q']) },
      { input: 'q', expected: invalid(['q']) },
      { input: 'qQ', expected: invalid(['q', 'Q']) },
      {
        input: 'ĄĆĘŁŃÓŚŹŻąćęłńóśźż',
        expected: invalid([
          'Ą',
          'Ć',
          'Ę',
          'Ł',
          'Ń',
          'Ó',
          'Ś',
          'Ź',
          'Ż',
          'ą',
          'ć',
          'ę',
          'ł',
          'ń',
          'ó',
          'ś',
          'ź',
          'ż',
        ]),
      },
      { input: 'EŁ', expected: invalid(['Ł']) },
      { input: '\u0131o', expected: invalid(['\u0131']) },
      { input: '\u017Fo', expected: invalid(['\u017F']) },
      {
        input: '\uFF37\uFF21',
        expected: invalid(['\uFF37', '\uFF21']),
      },
      { input: 'S\u0301O', expected: invalid(['\u0301']) },
      { input: 'DW_W', expected: invalid(['_']) },
      { input: 'DW/W', expected: invalid(['/']) },
      {
        input: 'Q_q_Ł/',
        expected: invalid(['Q', '_', 'q', 'Ł', '/']),
      },
      { input: 'DW\u2212W', expected: invalid(['\u2212']) },
      { input: '0Q', expected: invalid(['Q']) },
      { input: '\u{1F697}', expected: invalid(['\u{1F697}']) },
    ])(
      '$input → invalidCharacters $expected.invalidCharacters',
      ({ input, expected }) => {
        expect(normalisePlateInput(input)).toEqual(expected);
      },
    );
  });

  describe('idempotency (R7)', () => {
    it.each([
      { input: ' dw - w ', expected: ok(['DW', 'W']) },
      { input: '0po', expected: ok(['OPO']) },
      { input: ' 1o', expected: ok(['IO']) },
      { input: 'SK 0', expected: ok(['SK', '0']) },
      { input: '00', expected: ok(['O0']) },
      { input: '', expected: ok([]) },
    ])(
      'normalising groups.join(" ") of $input is idempotent',
      ({ input, expected }) => {
        expect(normalisePlateInput(input)).toEqual(expected);
        expect(normalisePlateInput(expected.groups.join(' '))).toEqual(
          expected,
        );
      },
    );
  });

  describe('prefix compatibility (R7)', () => {
    it.each([
      {
        input: 'dw-w',
        expectedCompacts: ['', 'D', 'DW', 'DW', 'DWW'],
      },
      {
        input: '0po',
        expectedCompacts: ['', 'O', 'OP', 'OPO'],
      },
      {
        input: ' 1o',
        expectedCompacts: ['', '', 'I', 'IO'],
      },
      {
        input: 'kr a',
        expectedCompacts: ['', 'K', 'KR', 'KR', 'KRA'],
      },
    ])(
      'every code-point prefix of $input has compact that is a prefix of the full compact',
      ({ input, expectedCompacts }) => {
        const full = normalisePlateInput(input);
        expect(full.status).toBe('ok');
        if (full.status !== 'ok') {
          return;
        }

        const prefixes: string[] = [];
        let built = '';
        prefixes.push(built);
        for (const char of input) {
          built += char;
          prefixes.push(built);
        }

        const compacts = prefixes.map((prefix) => {
          const result = normalisePlateInput(prefix);
          expect(result.status).toBe('ok');
          if (result.status !== 'ok') {
            return '';
          }
          expect(full.compact.startsWith(result.compact)).toBe(true);
          return result.compact;
        });

        expect(compacts).toEqual(expectedCompacts);
      },
    );
  });
});
