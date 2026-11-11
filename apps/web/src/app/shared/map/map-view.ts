import { voivodeshipSlug } from '@plate-region/plate-domain';
import {
  fullCodes,
  registry,
  warsawDistricts,
  type CountyMap,
  type Region1,
  type Region2,
  type WarsawDistrictMap,
} from '@plate-region/plate-data';

import type { MapArea, MapView } from './map.types';
import { countyHeading } from '../county/county-heading';
import type { Language } from '../../i18n/language.types';
import type { TranslatableMessage } from '../../i18n/i18n.types';
import {
  INTER_CAP_HEIGHT,
  INTER_UNITS_PER_EM,
  labelFits,
  labelFontSize,
} from './map-labels';

function voivodeshipName(region1: Region1, language: Language): string {
  return language === 'pl' ? region1.name : region1.nameEn.value;
}

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

export function voivodeshipMapView(
  map: CountyMap,
  region1: Region1,
  filled: Region2 | undefined,
  language: Language,
): MapView {
  const fontSize = labelFontSize(map.viewBox.height);
  const areas: MapArea[] = map.counties.map((county) => {
    const region2 = region2ForCounty(region1, county.firstSuffix);
    const codes = fullCodes(region1, region2) as [string, ...string[]];
    const text = codes[0];
    const isFilled =
      filled !== undefined &&
      filled.region1Letter === region2.region1Letter &&
      filled.suffixes[0] === region2.suffixes[0];
    return {
      id: text,
      path: county.path,
      filled: isFilled,
      anchor: { x: county.label.x, y: county.label.y },
      label: {
        x: county.label.x,
        baselineY:
          county.label.y +
          (fontSize * INTER_CAP_HEIGHT) / INTER_UNITS_PER_EM / 2,
        text,
        visible: labelFits(text, county.label.radius, fontSize),
      },
      heading: countyHeading(region2),
      codes,
      link: { slug: voivodeshipSlug(region1), fragment: text },
    };
  });

  const filledArea = areas.find((area) => area.filled);
  const name = voivodeshipName(region1, language);
  let ariaLabel: TranslatableMessage;
  if (filled === undefined || filledArea === undefined) {
    ariaLabel = {
      key: 'map.aria.voivodeship',
      params: { voivodeship: name },
    };
  } else {
    ariaLabel = {
      key: filled.kind === 'city' ? 'map.aria.city' : 'map.aria.land',
      params: { voivodeship: name, name: filled.name },
    };
  }

  return {
    viewBox: map.viewBox,
    outline: map.outline,
    neighbours: map.neighbours,
    areas,
    labelFontSize: fontSize,
    ariaLabel,
  };
}

export function warsawMapView(
  map: WarsawDistrictMap,
  region1: Region1,
  districts: readonly [string, ...string[]],
  language: Language,
): MapView {
  for (const name of districts) {
    if (!map.districts.some((district) => district.name === name)) {
      throw new Error(`district ${name} is not on the Warsaw map`);
    }
  }

  const fontSize = labelFontSize(map.viewBox.height);
  const areas: MapArea[] = map.districts.map((district) => {
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
    const text = codes[0];
    return {
      id: district.name,
      path: district.path,
      filled: districts.includes(district.name),
      anchor: { x: district.label.x, y: district.label.y },
      label: {
        x: district.label.x,
        baselineY:
          district.label.y +
          (fontSize * INTER_CAP_HEIGHT) / INTER_UNITS_PER_EM / 2,
        text,
        visible: labelFits(text, district.label.radius, fontSize),
      },
      heading: { key: 'map.district', params: { name: district.name } },
      codes,
      link: { slug: voivodeshipSlug(region1), fragment: text },
    };
  });

  return {
    viewBox: map.viewBox,
    outline: map.outline,
    neighbours: map.neighbours,
    areas,
    labelFontSize: fontSize,
    ariaLabel: {
      key: 'map.aria.warsaw',
      params: {
        districts: new Intl.ListFormat(language, {
          type: 'conjunction',
        }).format([...districts]),
      },
    },
  };
}
