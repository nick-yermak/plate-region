import { PluralKeyPipe } from './plural-key.pipe';

describe('PluralKeyPipe', () => {
  it('returns the category key for the count and language', () => {
    const pipe = new PluralKeyPipe();
    expect(pipe.transform(2, 'sample', 'pl')).toBe('sample.few');
  });
});
