import { registry } from '@plate-region/plate-data';

import { voivodeship } from './plate.testing';
import { voivodeshipMainCodes } from './voivodeship-main-codes';
import {
  VOIVODESHIP_CARD_MAIN_CODES_COUNT,
  voivodeshipCardView,
} from './voivodeship-card-view';

describe('voivodeshipCardView', () => {
  it('shows a positive number of main codes', () => {
    expect(VOIVODESHIP_CARD_MAIN_CODES_COUNT).toBeGreaterThan(0);
  });

  it('returns the first N main codes for G in English', () => {
    const expected = voivodeshipMainCodes(voivodeship('G')).slice(
      0,
      VOIVODESHIP_CARD_MAIN_CODES_COUNT,
    );
    expect(voivodeshipCardView(voivodeship('G'), 'en')).toEqual({
      heading: {
        key: 'plate.heading.voivodeship',
        params: { name: voivodeship('G').nameEn.value },
      },
      codes: expected,
    });
  });

  it('returns the first N main codes for G in Polish', () => {
    const expected = voivodeshipMainCodes(voivodeship('G')).slice(
      0,
      VOIVODESHIP_CARD_MAIN_CODES_COUNT,
    );
    expect(voivodeshipCardView(voivodeship('G'), 'pl')).toEqual({
      heading: {
        key: 'plate.heading.voivodeship',
        params: { name: voivodeship('G').name },
      },
      codes: expected,
    });
  });

  it('returns min(N, count) codes for every voivodeship', () => {
    for (const region1 of registry.region1) {
      const all = voivodeshipMainCodes(region1);
      const expectedCount = Math.min(
        VOIVODESHIP_CARD_MAIN_CODES_COUNT,
        all.length,
      );
      const codes = voivodeshipCardView(region1, 'en').codes;
      expect(codes).toHaveLength(expectedCount);
      expect(new Set(codes.map((row) => row.code)).size).toBe(expectedCount);
      expect(codes).toEqual(all.slice(0, expectedCount));
    }
    expect(voivodeshipCardView(voivodeship('G'), 'en').codes[0]?.code).toBe(
      'GD',
    );
  });
});
