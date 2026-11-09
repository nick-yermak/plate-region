import { registry } from '@plate-region/plate-data';
import type { Region1 } from '@plate-region/plate-data';

import { voivodeshipView } from './voivodeship-view';

function region1ByName(name: string): Region1 {
  const found = registry.region1.find((region) => region.name === name);
  if (found === undefined) {
    throw new Error(`region1 not found: ${name}`);
  }
  return found;
}

// Hand-written oracle (D-41 Update #91, ui-spec § Voivodeship); not computed by the code under test.
const SLUGS: readonly { readonly name: string; readonly slug: string }[] = [
  { name: 'dolnośląskie', slug: 'dolnoslaskie' },
  { name: 'kujawsko-pomorskie', slug: 'kujawsko-pomorskie' },
  { name: 'lubelskie', slug: 'lubelskie' },
  { name: 'lubuskie', slug: 'lubuskie' },
  { name: 'łódzkie', slug: 'lodzkie' },
  { name: 'małopolskie', slug: 'malopolskie' },
  { name: 'mazowieckie', slug: 'mazowieckie' },
  { name: 'opolskie', slug: 'opolskie' },
  { name: 'podkarpackie', slug: 'podkarpackie' },
  { name: 'podlaskie', slug: 'podlaskie' },
  { name: 'pomorskie', slug: 'pomorskie' },
  { name: 'śląskie', slug: 'slaskie' },
  { name: 'świętokrzyskie', slug: 'swietokrzyskie' },
  { name: 'warmińsko-mazurskie', slug: 'warminsko-mazurskie' },
  { name: 'wielkopolskie', slug: 'wielkopolskie' },
  { name: 'zachodniopomorskie', slug: 'zachodniopomorskie' },
];

describe('voivodeshipView', () => {
  it.each(SLUGS)('$slug → found for $name', ({ name, slug }) => {
    const view = voivodeshipView(slug);
    expect(view.status).toBe('found');
    if (view.status === 'found') {
      expect(view.region1).toBe(region1ByName(name));
    }
  });

  it.each(['foo', 'Mazowieckie', 'd'] as const)('%s → not-found', (slug) => {
    expect(voivodeshipView(slug)).toEqual({ status: 'not-found' });
  });

  it('lists Wrocław codes for dolnoslaskie in registry order', () => {
    const view = voivodeshipView('dolnoslaskie');
    expect(view.status).toBe('found');
    if (view.status !== 'found') {
      return;
    }
    const wroclaw = view.counties.find(
      (county) => county.region2.name === 'Wrocław',
    );
    expect(wroclaw?.codes.map((entry) => entry.code)).toEqual([
      'DW',
      'DX',
      'VW',
      'VX',
    ]);
  });

  it('sums to 689 codes and 380 counties across the 16 slugs', () => {
    let codeCount = 0;
    let countyCount = 0;
    for (const { slug } of SLUGS) {
      const view = voivodeshipView(slug);
      expect(view.status).toBe('found');
      if (view.status === 'found') {
        codeCount += view.codeCount;
        countyCount += view.countyCount;
      }
    }
    expect(codeCount).toBe(689);
    expect(countyCount).toBe(380);
  });
});
