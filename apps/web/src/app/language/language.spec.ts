import { resolveLanguage } from './language';

describe('resolveLanguage', () => {
  it('prefers a stored en or pl over the navigator language', () => {
    expect(resolveLanguage('pl', 'en-US')).toBe('pl');
    expect(resolveLanguage('en', 'pl-PL')).toBe('en');
  });

  it('selects pl when nothing valid is stored and the navigator language starts with pl', () => {
    expect(resolveLanguage(null, 'pl-PL')).toBe('pl');
    expect(resolveLanguage('xx', 'pl')).toBe('pl');
  });

  it('selects en when nothing valid is stored and the navigator language does not start with pl', () => {
    expect(resolveLanguage(null, 'en-GB')).toBe('en');
    expect(resolveLanguage(null, '')).toBe('en');
  });
});
