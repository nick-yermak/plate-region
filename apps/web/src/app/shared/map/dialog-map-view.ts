import {
  countySeat,
  fullCodes,
  registry,
  warsawDistricts,
  type CountryMap,
  type CountyMap,
  type Region1,
  type Region2,
  type WarsawDistrictMap,
} from '@plate-region/plate-data';

import type { MapView } from './map.types';
import type { Language } from '../../i18n/language.types';
import { NARROW, placeSeatLabels, WIDE } from './seat-labels';
import { voivodeshipMapView, warsawMapView } from './map-view';

function region2ForCounty(region1: Region1, firstSuffix: string): Region2 {
  const found = registry.region2.find(
    (region) =>
      region.region1Letter === region1.letters[0] &&
      region.suffixes[0] === firstSuffix,
  );
  if (found === undefined) {
    throw new Error(`no region2 for ${region1.letters[0]}${firstSuffix}`);
  }
  return found;
}

function capitalIdsFor(
  country: CountryMap,
  region1: Region1,
): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const capital of country.capitals) {
    if (capital.region1Letter !== region1.letters[0]) {
      continue;
    }
    const region2 = region2ForCounty(region1, capital.firstSuffix);
    ids.add(fullCodes(region1, region2)[0]);
  }
  return ids;
}

/** Voivodeship map for the result dialog: seat labels and dots. */
export function voivodeshipDialogMapView(
  map: CountyMap,
  region1: Region1,
  filled: Region2 | undefined,
  plateCode: string | undefined,
  language: Language,
  country: CountryMap,
  selectedId?: string,
): MapView {
  const capitals = capitalIdsFor(country, region1);
  const base = voivodeshipMapView(map, region1, filled, language);
  const seatAreas = map.counties.map((county) => {
    const region2 = region2ForCounty(region1, county.firstSuffix);
    const codes = fullCodes(region1, region2) as [string, ...string[]];
    const isFilled =
      filled !== undefined &&
      filled.region1Letter === region2.region1Letter &&
      filled.suffixes[0] === region2.suffixes[0];
    const codeText = isFilled && plateCode !== undefined ? plateCode : codes[0];
    const fullText = `${countySeat(region2)} (${codeText})`;
    const selected =
      selectedId !== undefined ? selectedId === codes[0] : isFilled;
    return {
      id: codes[0],
      x: county.label.x,
      y: county.label.y,
      radius: county.label.radius,
      fullText,
      codeText,
      selected,
      capital: capitals.has(codes[0]),
    };
  });
  const narrowTiers = placeSeatLabels(seatAreas, map.viewBox, NARROW);
  const wideTiers = placeSeatLabels(seatAreas, map.viewBox, WIDE);
  return {
    ...base,
    dots: true,
    labelHalo: true,
    areas: base.areas.map((area) => {
      const seat = seatAreas.find((entry) => entry.id === area.id);
      if (seat === undefined) {
        throw new Error(`no seat area for ${area.id}`);
      }
      const narrow = narrowTiers.get(area.id) ?? {
        tier: 'none' as const,
        position: 'above' as const,
        forced: false,
      };
      const wide = wideTiers.get(area.id) ?? {
        tier: 'none' as const,
        position: 'above' as const,
        forced: false,
      };
      return {
        ...area,
        label: {
          ...area.label,
          text: seat.fullText,
          codeText: seat.codeText,
          visible: false,
          tiers: {
            narrow: narrow.tier,
            wide: wide.tier,
          },
          positions: {
            narrow: narrow.position,
            wide: wide.position,
          },
          forced: {
            narrow: narrow.forced,
            wide: wide.forced,
          },
        },
      };
    }),
  };
}

/** Warsaw district map for the result dialog: district labels and dots. */
export function warsawDialogMapView(
  map: WarsawDistrictMap,
  region1: Region1,
  districts: readonly [string, ...string[]],
  plateCode: string | undefined,
  language: Language,
  selectedId?: string,
): MapView {
  const base = warsawMapView(map, region1, districts, language);
  const seatAreas = map.districts.map((district) => {
    const row = warsawDistricts.rows.find((entry) =>
      entry.districts.some((item) => item.value === district.name),
    );
    if (row === undefined) {
      throw new Error(`no Warsaw row for ${district.name}`);
    }
    const codes = region1.letters.map((letter) => letter + row.suffix) as [
      string,
      ...string[],
    ];
    const isFilled = districts.includes(district.name);
    const primarySelected = selectedId ?? districts[0];
    const selected = district.name === primarySelected;
    const codeText = isFilled && plateCode !== undefined ? plateCode : codes[0];
    const fullText = `${district.name} (${codeText})`;
    return {
      id: district.name,
      x: district.label.x,
      y: district.label.y,
      radius: district.label.radius,
      fullText,
      codeText,
      selected,
      capital: false,
    };
  });
  const narrowTiers = placeSeatLabels(seatAreas, map.viewBox, NARROW);
  const wideTiers = placeSeatLabels(seatAreas, map.viewBox, WIDE);
  return {
    ...base,
    dots: true,
    labelHalo: true,
    areas: base.areas.map((area) => {
      const seat = seatAreas.find((entry) => entry.id === area.id);
      if (seat === undefined) {
        throw new Error(`no seat area for ${area.id}`);
      }
      const narrow = narrowTiers.get(area.id) ?? {
        tier: 'none' as const,
        position: 'above' as const,
        forced: false,
      };
      const wide = wideTiers.get(area.id) ?? {
        tier: 'none' as const,
        position: 'above' as const,
        forced: false,
      };
      return {
        ...area,
        label: {
          ...area.label,
          text: seat.fullText,
          codeText: seat.codeText,
          visible: false,
          tiers: {
            narrow: narrow.tier,
            wide: wide.tier,
          },
          positions: {
            narrow: narrow.position,
            wide: wide.position,
          },
          forced: {
            narrow: narrow.forced,
            wide: wide.forced,
          },
        },
      };
    }),
  };
}
