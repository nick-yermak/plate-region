import { registry } from '../registry';
import type { Region2 } from '../model';
import type { CountryMap, CountryMapCounty, CountryMapModule } from './model';

export function decodeCountryMap(
  module: CountryMapModule,
  region2: readonly Region2[],
): CountryMap {
  if (module.counties.length !== region2.length) {
    throw new Error(
      `country map has ${module.counties.length} counties, the registry has ${region2.length}`,
    );
  }
  // Lengths already match; index access is safe without a runtime branch.
  const counties: CountryMapCounty[] = region2.map((region, i) => {
    const [path, x, y] = module.counties[
      i
    ] as CountryMapModule['counties'][number];
    return {
      region1Letter: region.region1Letter,
      firstSuffix: region.suffixes[0],
      path,
      label: { x, y },
    };
  });
  const byId = new Map(
    counties.map((c) => [`${c.region1Letter}${c.firstSuffix}`, c] as const),
  );
  const capitals = module.capitals.map(([letter, suffix]) => {
    const county = byId.get(`${letter}${suffix}`);
    if (county === undefined) {
      throw new Error(`capital ${letter}${suffix} is not a county of the map`);
    }
    return county;
  });
  return {
    viewBox: module.viewBox,
    outline: module.outline,
    borders: module.borders,
    counties,
    capitals,
  };
}

/** Loads the map of Poland with all 380 counties as a lazy chunk, rows in registry order. */
export function loadCountryMap(): Promise<CountryMap> {
  return import('./country-map-data').then((m) =>
    decodeCountryMap(m.countryMapModule, registry.region2),
  );
}
