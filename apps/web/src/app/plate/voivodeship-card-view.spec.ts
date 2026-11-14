import { voivodeshipSlug } from '@plate-region/plate-domain';

import { voivodeship } from './plate.testing';
import { voivodeshipCardView } from './voivodeship-card-view';
import { voivodeshipMainCodes } from './voivodeship-main-codes';

describe('voivodeshipCardView', () => {
  it('returns every main code for G in order with voivodeship #CODE links', () => {
    const region1 = voivodeship('G');
    const slug = voivodeshipSlug(region1);
    const expected = voivodeshipMainCodes(region1).map((row) => ({
      code: row.code,
      name: row.name,
      link: { slug, fragment: row.code },
    }));
    expect(expected.length).toBeGreaterThan(10);
    expect(voivodeshipCardView(region1, 'en')).toEqual({
      heading: {
        key: 'plate.heading.voivodeship',
        params: { name: region1.nameEn.value },
      },
      codes: expected,
    });
    expect(voivodeshipCardView(region1, 'pl')).toEqual({
      heading: {
        key: 'plate.heading.voivodeship',
        params: { name: region1.name },
      },
      codes: expected,
    });
  });

  it('lists one Mazowieckie entry per main-code row with a single Warszawa tag', () => {
    const region1 = voivodeship('W');
    const main = voivodeshipMainCodes(region1);
    const codes = voivodeshipCardView(region1, 'en').codes;
    expect(codes).toHaveLength(main.length);
    expect(codes.map((row) => row.code)).toEqual(main.map((row) => row.code));
    expect(codes.filter((row) => row.code === 'WA')).toHaveLength(1);
    expect(codes.some((row) => row.code === 'AA')).toBe(false);
    expect(codes.find((row) => row.code === 'WA')?.link).toEqual({
      slug: 'mazowieckie',
      fragment: 'WA',
    });
  });
});
