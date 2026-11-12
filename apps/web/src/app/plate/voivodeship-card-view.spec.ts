import { registry } from '@plate-region/plate-data';

import { county, voivodeship } from './plate.testing';
import { voivodeshipCardView } from './voivodeship-card-view';

describe('voivodeshipCardView', () => {
  it("returns GMB then four other G codes for Malbork with 'GMB'", () => {
    expect(
      voivodeshipCardView(voivodeship('G'), county('GMB'), 'GMB', 'en').codes,
    ).toEqual(['GMB', 'GD', 'GA', 'GS', 'GSP']);
  });

  it('returns the first five G codes without a matched code', () => {
    expect(
      voivodeshipCardView(voivodeship('G'), undefined, undefined, 'en').codes,
    ).toEqual(['GD', 'GA', 'GS', 'GSP', 'GBY']);
  });

  it("puts 'VX' first and omits Wrocław's own first code", () => {
    const codes = voivodeshipCardView(
      voivodeship('D'),
      county('VX'),
      'VX',
      'en',
    ).codes;
    expect(codes[0]).toBe('VX');
    expect(codes).not.toContain('DW');
  });

  it("puts 'WE' first and omits m.st. Warszawa's first code", () => {
    const codes = voivodeshipCardView(
      voivodeship('W'),
      county('WE'),
      'WE',
      'en',
    ).codes;
    expect(codes[0]).toBe('WE');
    expect(codes).not.toContain('WA');
  });

  it('returns five distinct codes for every voivodeship', () => {
    for (const region1 of registry.region1) {
      const codes = voivodeshipCardView(
        region1,
        undefined,
        undefined,
        'en',
      ).codes;
      expect(codes).toHaveLength(5);
      expect(new Set(codes).size).toBe(5);
    }
  });
});
