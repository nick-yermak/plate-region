import { loadCountryMap } from './maps/country-map';
import { voivodeshipCapitals } from './voivodeship-capitals';

describe('voivodeshipCapitals', () => {
  it('equals the capitals of the country map', async () => {
    const map = await loadCountryMap();
    expect(voivodeshipCapitals).toEqual(
      map.capitals.map((c) => [c.region1Letter, c.firstSuffix]),
    );
  });
});
