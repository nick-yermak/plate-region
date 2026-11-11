import type { Region2 } from '../model';
import type { CountryMapModule } from './model';
import { decodeCountryMap } from './country-map';

const WROCLAW: Region2 = {
  country: 'PL',
  region1Letter: 'D',
  name: 'Wrocław',
  kind: 'city',
  suffixes: ['W', 'X'],
};

function moduleWith(capitals: CountryMapModule['capitals']): CountryMapModule {
  return {
    viewBox: { width: 1000, height: 938 },
    outline: 'M0 0l1 0 0 1z',
    borders: 'M0 0l1 1',
    counties: [['M0 0l1 0 0 1z', 0, 0]],
    capitals,
  };
}

describe('decodeCountryMap', () => {
  it('throws when the stored rows and the registry differ in length', () => {
    expect(() => decodeCountryMap(moduleWith([]), [])).toThrow(
      'country map has 1 counties, the registry has 0',
    );
  });

  it('throws when a capital is not a county of the map', () => {
    expect(() => decodeCountryMap(moduleWith([['D', 'X']]), [WROCLAW])).toThrow(
      'capital DX is not a county of the map',
    );
  });
});
