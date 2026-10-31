import { pluralKey } from './plural-key';

describe('pluralKey', () => {
  it('selects the Polish category key for 1, 2, 5, 12, 21, 22 and 1.5', () => {
    expect(pluralKey('sample', 1, 'pl')).toBe('sample.one');
    expect(pluralKey('sample', 2, 'pl')).toBe('sample.few');
    expect(pluralKey('sample', 5, 'pl')).toBe('sample.many');
    expect(pluralKey('sample', 12, 'pl')).toBe('sample.many');
    expect(pluralKey('sample', 21, 'pl')).toBe('sample.many');
    expect(pluralKey('sample', 22, 'pl')).toBe('sample.few');
    expect(pluralKey('sample', 1.5, 'pl')).toBe('sample.other');
  });

  it('selects the English category key for 1 and 2', () => {
    expect(pluralKey('sample', 1, 'en')).toBe('sample.one');
    expect(pluralKey('sample', 2, 'en')).toBe('sample.other');
  });
});
