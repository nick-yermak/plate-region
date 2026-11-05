import { registry } from '@plate-region/plate-data';
import type { Region1 } from '@plate-region/plate-data';

import { voivodeshipSlug } from './voivodeship-slug';

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

describe('voivodeshipSlug', () => {
  it.each(SLUGS)('$name → $slug', ({ name, slug }) => {
    expect(voivodeshipSlug(region1ByName(name))).toBe(slug);
  });

  it('maps every Polish letter in the table', () => {
    expect(
      voivodeshipSlug({
        ...region1ByName('mazowieckie'),
        name: 'ąćęłńóśźż',
      }),
    ).toBe('acelnoszz');
  });
});
