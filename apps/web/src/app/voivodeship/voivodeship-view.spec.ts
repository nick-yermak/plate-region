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

function foundView(slug: string) {
  const view = voivodeshipView(slug);
  if (view.status !== 'found') {
    throw new Error(`expected found view for ${slug}`);
  }
  return view;
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
    expect(foundView(slug).region1).toBe(region1ByName(name));
  });

  it.each(['foo', 'Mazowieckie', 'd'] as const)('%s → not-found', (slug) => {
    expect(voivodeshipView(slug)).toEqual({ status: 'not-found' });
  });

  it('lists Wrocław codes for dolnoslaskie in registry order', () => {
    const wroclaw = foundView('dolnoslaskie').rows.find(
      (row) => row.region2.name === 'Wrocław',
    );
    expect(wroclaw?.codes).toEqual(['DW', 'DX', 'VW', 'VX']);
  });

  it('sums to 689 codes and 380 counties across the 16 slugs', () => {
    let codeCount = 0;
    let countyCount = 0;
    for (const { slug } of SLUGS) {
      const view = foundView(slug);
      codeCount += view.codeCount;
      countyCount += view.countyCount;
    }
    expect(codeCount).toBe(689);
    expect(countyCount).toBe(380);
  });

  it('mazowieckie rows are counties plus Warsaw district groups', () => {
    const view = foundView('mazowieckie');
    expect(view.rows).toHaveLength(view.countyCount + 14);
    const wwAw = view.rows.find(
      (row) =>
        row.codes.length === 2 &&
        row.codes[0] === 'WW' &&
        row.codes[1] === 'AW',
    );
    expect(wwAw?.districts?.map((d) => d.value)).toEqual([
      'Rembertów',
      'Wilanów',
      'Włochy',
    ]);
    expect(wwAw?.plate).toBe('WW 4PN15');
  });

  it('dolnoslaskie rows are one per county with Wrocław codes', () => {
    const view = foundView('dolnoslaskie');
    expect(view.rows).toHaveLength(30);
    expect(view.codeCount).toBe(64);
    const dwRow = view.rows.find((row) => row.codes.includes('DW'));
    expect(dwRow?.codes).toEqual(['DW', 'DX', 'VW', 'VX']);
  });
});
