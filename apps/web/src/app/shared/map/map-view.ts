import { voivodeshipSlug } from '@plate-region/plate-domain';
import {
  fullCodes,
  registry,
  warsawDistricts,
  type CountryMap,
  type CountryMapCounty,
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
  LABEL_FONT_PX,
  LABEL_HALO_PX,
  labelFits,
  labelFontSize,
  labelSizeEm,
  MARKER_HALO_PX,
  MARKER_LABEL_BASELINE_PX,
  MARKER_RADIUS_PX,
  REFERENCE_MAP_SIZE_PX,
} from './map-labels';

type LabelBox = {
  readonly x: number;
  readonly y: number;
  readonly hw: number;
  readonly hh: number;
};

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

function region1ByLetter(letter: string): Region1 {
  const found = registry.region1.find((region) => region.letters[0] === letter);
  if (found === undefined) {
    throw new Error(`no region1 with letter ${letter}`);
  }
  return found;
}

function countyCode(row: CountryMapCounty): string {
  return `${row.region1Letter}${row.firstSuffix}`;
}

function labelHalfBox(
  code: string,
  mapWidthPx: number,
  fontPx: number,
): { hw: number; hh: number } {
  const em = labelSizeEm(code);
  const scale = 1000 / mapWidthPx;
  const wPx = em.width * fontPx + LABEL_HALO_PX;
  const hPx = em.height * fontPx + LABEL_HALO_PX;
  return { hw: (wPx * scale) / 2, hh: (hPx * scale) / 2 };
}

function boxesOverlap(a: LabelBox, b: LabelBox): boolean {
  return Math.abs(a.x - b.x) < a.hw + b.hw && Math.abs(a.y - b.y) < a.hh + b.hh;
}

function labelBoxesOverlap(
  a: { readonly code: string; readonly x: number; readonly y: number },
  b: { readonly code: string; readonly x: number; readonly y: number },
  mapWidthPx: number,
  fontPx: number,
): boolean {
  const ha = labelHalfBox(a.code, mapWidthPx, fontPx);
  const hb = labelHalfBox(b.code, mapWidthPx, fontPx);
  return boxesOverlap({ x: a.x, y: a.y, ...ha }, { x: b.x, y: b.y, ...hb });
}

function selectedObstacleBoxes(
  code: string,
  x: number,
  y: number,
  mapWidthPx: number,
  fontPx: number,
): readonly [LabelBox, LabelBox] {
  const scale = 1000 / mapWidthPx;
  const em = labelSizeEm(code);
  const ringHalf = (MARKER_RADIUS_PX + MARKER_HALO_PX / 2) * scale;
  const half = labelHalfBox(code, mapWidthPx, fontPx);
  const labelCenterY =
    y - (MARKER_LABEL_BASELINE_PX + (em.height * fontPx) / 2) * scale;
  return [
    { x, y, hw: ringHalf, hh: ringHalf },
    { x, y: labelCenterY, hw: half.hw, hh: half.hh },
  ];
}

function capitalOverlapsSelected(
  capital: { readonly code: string; readonly x: number; readonly y: number },
  selected: { readonly code: string; readonly x: number; readonly y: number },
  mapWidthPx: number,
  fontPx: number,
): boolean {
  const half = labelHalfBox(capital.code, mapWidthPx, fontPx);
  const capitalBox: LabelBox = { x: capital.x, y: capital.y, ...half };
  return selectedObstacleBoxes(
    selected.code,
    selected.x,
    selected.y,
    mapWidthPx,
    fontPx,
  ).some((box) => boxesOverlap(box, capitalBox));
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
      tinted: false,
      anchor: { x: county.label.x, y: county.label.y },
      label: {
        x: county.label.x,
        y: county.label.y,
        text,
        visible: labelFits(text, county.label.radius, fontSize),
        wideOnly: false,
        aboveMarker: false,
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
    labelHalo: false,
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
      tinted: false,
      anchor: { x: district.label.x, y: district.label.y },
      label: {
        x: district.label.x,
        y: district.label.y,
        text,
        visible: labelFits(text, district.label.radius, fontSize),
        wideOnly: false,
        aboveMarker: false,
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
    labelHalo: false,
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

export function countryMapView(
  map: CountryMap,
  region1: Region1,
  filled: Region2 | undefined,
  language: Language,
): MapView {
  const capitalPoints: {
    readonly code: string;
    readonly x: number;
    readonly y: number;
  }[] = [];
  const wideOnlyCapitals = new Set<string>();
  for (const capital of map.capitals) {
    const point = {
      code: countyCode(capital),
      x: capital.label.x,
      y: capital.label.y,
    };
    if (
      capitalPoints.some((earlier) =>
        labelBoxesOverlap(earlier, point, REFERENCE_MAP_SIZE_PX, LABEL_FONT_PX),
      )
    ) {
      wideOnlyCapitals.add(point.code);
    }
    capitalPoints.push(point);
  }

  const capitalCodes = new Set(map.capitals.map(countyCode));
  const filledCode =
    filled === undefined
      ? undefined
      : `${filled.region1Letter}${filled.suffixes[0]}`;
  const filledCounty =
    filledCode === undefined
      ? undefined
      : map.counties.find((row) => countyCode(row) === filledCode);
  const filledPoint =
    filledCounty === undefined
      ? undefined
      : {
          code: filledCode as string,
          x: filledCounty.label.x,
          y: filledCounty.label.y,
        };

  const areas: MapArea[] = map.counties.map((row) => {
    const ownRegion1 = region1ByLetter(row.region1Letter);
    const region2 = region2ForCounty(ownRegion1, row.firstSuffix);
    const codes = fullCodes(ownRegion1, region2) as [string, ...string[]];
    const text = codes[0];
    const isFilled =
      filled !== undefined &&
      filled.region1Letter === region2.region1Letter &&
      filled.suffixes[0] === region2.suffixes[0];
    const isCapital = capitalCodes.has(text);
    let visible = false;
    if (isFilled) {
      visible = true;
    } else if (isCapital) {
      visible =
        filledPoint === undefined ||
        !capitalOverlapsSelected(
          { code: text, x: row.label.x, y: row.label.y },
          filledPoint,
          REFERENCE_MAP_SIZE_PX,
          LABEL_FONT_PX,
        );
    }
    return {
      id: text,
      path: row.path,
      filled: isFilled,
      tinted: row.region1Letter === region1.letters[0],
      anchor: { x: row.label.x, y: row.label.y },
      label: {
        x: row.label.x,
        y: row.label.y,
        text,
        visible,
        wideOnly: isFilled ? false : wideOnlyCapitals.has(text),
        aboveMarker: isFilled,
      },
      heading: countyHeading(region2),
      codes,
      link: { slug: voivodeshipSlug(ownRegion1), fragment: text },
    };
  });

  const name = voivodeshipName(region1, language);
  let ariaLabel: TranslatableMessage;
  if (filled === undefined) {
    ariaLabel = {
      key: 'map.aria.country',
      params: { voivodeship: name },
    };
  } else if (filled.kind === 'city') {
    ariaLabel = {
      key: 'map.aria.countryCity',
      params: { name: filled.name, voivodeship: name },
    };
  } else {
    ariaLabel = {
      key: 'map.aria.countryLand',
      params: { name: filled.name, voivodeship: name },
    };
  }

  return {
    viewBox: map.viewBox,
    outline: map.outline,
    neighbours: [],
    areas,
    borders: map.borders,
    labelHalo: true,
    ...(filledPoint === undefined
      ? {}
      : { marker: { x: filledPoint.x, y: filledPoint.y } }),
    ariaLabel,
  };
}
