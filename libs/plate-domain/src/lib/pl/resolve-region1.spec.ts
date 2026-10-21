import { registry } from '@plate-region/plate-data';

import { PLATE_ALPHABET } from './alphabet';
import { resolveRegion1 } from './resolve-region1';
import type { Region1Resolution } from './resolve-region1';

const notInRegistry: Extract<Region1Resolution, { status: 'not-in-registry' }> =
  {
    status: 'not-in-registry',
  };

describe('resolveRegion1', () => {
  describe('every column-4 letter → letter with the same region1 reference (R1, R2, R8)', () => {
    it('maps each registry letter to its region1 by reference and has exactly 23 letters', () => {
      const violations: string[] = [];
      let letterCount = 0;

      for (const region1 of registry.region1) {
        for (const column4Letter of region1.letters) {
          letterCount += 1;
          const result = resolveRegion1(column4Letter);
          if (result.status !== 'letter' || result.region1 !== region1) {
            violations.push(
              `${column4Letter}: expected letter → ${region1.name}, got ${JSON.stringify(result)}`,
            );
          }
        }
      }

      expect(letterCount).toBe(23);
      expect(violations).toEqual([]);
    });
  });

  describe('every column-6 code → letter-digit-code with the same region1 reference (R3, R8)', () => {
    it('maps each registry letter+digit code to its region1 by reference and has exactly 230 codes', () => {
      const violations: string[] = [];
      let codeCount = 0;

      for (const region1 of registry.region1) {
        for (const code of region1.letterDigitCodes) {
          codeCount += 1;
          const result = resolveRegion1(code);
          if (
            result.status !== 'letter-digit-code' ||
            result.region1 !== region1
          ) {
            violations.push(
              `${code}: expected letter-digit-code → ${region1.name}, got ${JSON.stringify(result)}`,
            );
          }
        }
      }

      expect(codeCount).toBe(230);
      expect(violations).toEqual([]);
    });
  });

  describe('alphabet letters outside column 4 → not-in-registry (R5, D-26)', () => {
    it("lists exactly ['H', 'U'] and maps each to not-in-registry", () => {
      const column4Letters = new Set<string>(
        registry.region1.flatMap((region1) => [...region1.letters]),
      );
      // Digits are in the alphabet (§ 30 ust. 1) but cannot be column-4 letters.
      const outside = [...PLATE_ALPHABET].filter(
        (char) => !/\d/.test(char) && !column4Letters.has(char),
      );

      expect(outside).toEqual(['H', 'U']);

      const violations = outside.flatMap((letterChar) => {
        const result = resolveRegion1(letterChar);
        return result.status === 'not-in-registry'
          ? []
          : [
              `${letterChar}: expected not-in-registry, got ${JSON.stringify(result)}`,
            ];
      });

      expect(violations).toEqual([]);
    });
  });

  describe('spot checks for letters (R1, R2)', () => {
    it.each([
      { input: 'D', name: 'dolnośląskie' },
      { input: 'V', name: 'dolnośląskie' },
      { input: 'K', name: 'małopolskie' },
      { input: 'J', name: 'małopolskie' },
      { input: 'W', name: 'mazowieckie' },
      { input: 'A', name: 'mazowieckie' },
    ])('$input → letter $name', ({ input, name }) => {
      expect(resolveRegion1(input)).toMatchObject({
        status: 'letter',
        region1: { name },
      });
    });
  });

  describe('spot checks for column-6 codes (R3)', () => {
    it.each([
      { input: 'S0', name: 'śląskie' },
      { input: 'V9', name: 'dolnośląskie' },
    ])('$input → letter-digit-code $name', ({ input, name }) => {
      expect(resolveRegion1(input)).toMatchObject({
        status: 'letter-digit-code',
        region1: { name },
      });
    });
  });

  describe('column-6 checked before letter (R4: #36, D-27)', () => {
    it('D1 → letter-digit-code dolnośląskie', () => {
      expect(resolveRegion1('D1')).toMatchObject({
        status: 'letter-digit-code',
        region1: { name: 'dolnośląskie' },
      });
    });
  });

  describe('only the first two characters are read for a column-6 code (R3)', () => {
    it('D10 → letter-digit-code dolnośląskie', () => {
      expect(resolveRegion1('D10')).toMatchObject({
        status: 'letter-digit-code',
        region1: { name: 'dolnośląskie' },
      });
    });
  });

  describe('only the first character is read for a column-4 letter (R1)', () => {
    it('DW → letter dolnośląskie (Wrocław full code)', () => {
      expect(resolveRegion1('DW')).toMatchObject({
        status: 'letter',
        region1: { name: 'dolnośląskie' },
      });
    });

    it('KRA → letter małopolskie (krakowski full code)', () => {
      expect(resolveRegion1('KRA')).toMatchObject({
        status: 'letter',
        region1: { name: 'małopolskie' },
      });
    });
  });

  describe('S0/SO look-alike pair at region1 (R1, #35)', () => {
    it('SO → letter śląskie (Sosnowiec full code)', () => {
      expect(resolveRegion1('SO')).toMatchObject({
        status: 'letter',
        region1: { name: 'śląskie' },
      });
    });
  });

  describe('H0 is not a column-6 code (R5)', () => {
    it('H0 → not-in-registry', () => {
      expect(resolveRegion1('H0')).toEqual(notInRegistry);
    });
  });

  describe('first character a digit 2–9 (R5)', () => {
    it.each(['2', '3', '4', '5', '6', '7', '8', '9'])(
      '%s → not-in-registry',
      (input) => {
        expect(resolveRegion1(input)).toEqual(notInRegistry);
      },
    );
  });

  describe('empty compact (R9)', () => {
    it('empty string → not-in-registry', () => {
      expect(resolveRegion1('')).toEqual(notInRegistry);
    });
  });
});
