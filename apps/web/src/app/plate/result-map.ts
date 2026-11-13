import { InjectionToken } from '@angular/core';

import {
  candidatesFor,
  normalisePlateInput,
  parsePlate,
} from '@plate-region/plate-domain';
import {
  countyMapLoaders,
  loadCountryMap,
  loadWarsawDistrictMap,
  type CountryMap,
  type CountyMap,
  type UnofficialName,
  type WarsawDistrictMap,
} from '@plate-region/plate-data';

import type { LoadedMap, MapTarget } from './plate.types';
import { candidatesView, singleCounty } from './candidates-view';

function districtNames(
  districts: readonly [UnofficialName, ...UnofficialName[]] | undefined,
): readonly [string, ...string[]] | undefined {
  if (districts === undefined) {
    return undefined;
  }
  const [head, ...tail] = districts;
  return [head.value, ...tail.map((district) => district.value)];
}

export function resultMapTarget(plate: string): MapTarget | undefined {
  const result = parsePlate(plate);
  switch (result.status) {
    case 'resolved': {
      const districts = districtNames(result.districts);
      if (districts !== undefined) {
        return {
          kind: 'warsaw',
          region1: result.region1,
          districts,
          filled: result.region2,
        };
      }
      return {
        kind: 'voivodeship',
        region1: result.region1,
        filled: result.region2,
      };
    }
    case 'region1-only':
    case 'region2-not-in-registry':
    case 'ambiguous':
      return {
        kind: 'voivodeship',
        region1: result.region1,
        filled: undefined,
      };
    case 'not-in-registry':
    case 'empty':
      return undefined;
    case 'invalid-input':
      if (result.reason === 'invalid-characters') {
        return undefined;
      }
      return candidatesMapTarget(plate);
  }
}

function candidatesMapTarget(plate: string): MapTarget | undefined {
  const found = candidatesFor(plate);
  if (found.status !== 'candidates') {
    return undefined;
  }
  const normalised = normalisePlateInput(plate);
  if (normalised.status === 'invalid') {
    throw new Error(
      'candidatesFor accepted input that normalisePlateInput rejects',
    );
  }
  const view = candidatesView(found, normalised.compact);
  return {
    kind: 'voivodeship',
    region1: view.region1,
    filled: view.answer?.region2 ?? singleCounty(view)?.region2,
  };
}

export async function loadResultMap(target: MapTarget): Promise<LoadedMap> {
  if (target.kind === 'warsaw') {
    const [map, country]: [WarsawDistrictMap, CountryMap] = await Promise.all([
      loadWarsawDistrictMap(),
      loadCountryMap(),
    ]);
    return { target, map, country };
  }
  const letter = target.region1.letters[0];
  const load = countyMapLoaders[letter];
  if (load === undefined) {
    throw new Error(`no county map loader for ${letter}`);
  }
  const [map, country]: [CountyMap, CountryMap] = await Promise.all([
    load(),
    loadCountryMap(),
  ]);
  return { target, map, country };
}

// A token so specs can hold a load without mocking the module (the Angular unit-test builder rejects `vi.mock` of relative imports).
export const RESULT_MAP_LOADER = new InjectionToken<typeof loadResultMap>(
  'RESULT_MAP_LOADER',
  { providedIn: 'root', factory: () => loadResultMap },
);
