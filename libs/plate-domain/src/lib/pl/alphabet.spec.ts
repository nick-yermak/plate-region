import { PLATE_ALPHABET } from './alphabet';

// From the R-23 quote in docs/pl-plate-rules.md: 25 letters A–P, R–Z (no Q) and digits 0–9.
const R23_ALPHABET = new Set('ABCDEFGHIJKLMNOPRSTUVWXYZ0123456789');

describe('PLATE_ALPHABET', () => {
  it('equals the 25 letters and 10 digits of § 30 ust. 1 (R-23)', () => {
    expect(PLATE_ALPHABET).toEqual(R23_ALPHABET);
    expect(PLATE_ALPHABET.size).toBe(35);
  });
});
