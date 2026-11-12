import { voivodeshipSlug } from '@plate-region/plate-domain';
import {
  countySeat,
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
import { labelFits, labelFontSize } from './map-labels';
import { countyHeading } from '../county/county-heading';
import type { Language } from '../../i18n/language.types';
import type { TranslatableMessage } from '../../i18n/i18n.types';
import {
  COUNTRY_NARROW,
  COUNTRY_WIDE,
  placeSeatLabels,
  type SeatLabelArea,
  type SeatLabelPlacement,
} from './seat-labels';

const EMPTY_SEAT_PLACEMENT: SeatLabelPlacement = {
  tier: 'none',
  position: 'above',
  forced: false,
  slideDx: 0,
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
        codeText: text,
        visible: labelFits(text, county.label.radius, fontSize),
        wideOnly: false,
        aboveMarker: false,
        tiers: { narrow: 'none', wide: 'none' },
        positions: { narrow: 'above', wide: 'above' },
        forced: { narrow: false, wide: false },
        slideDx: { narrow: 0, wide: 0 },
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
    dots: false,
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
        codeText: text,
        visible: labelFits(text, district.label.radius, fontSize),
        wideOnly: false,
        aboveMarker: false,
        tiers: { narrow: 'none', wide: 'none' },
        positions: { narrow: 'above', wide: 'above' },
        forced: { narrow: false, wide: false },
        slideDx: { narrow: 0, wide: 0 },
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
    dots: false,
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
  plateCode?: string,
): MapView {
  const capitalIds = map.capitals.map(countyCode);
  const capitalIndex = new Map(capitalIds.map((id, i) => [id, i]));
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

  const seatAreas: SeatLabelArea[] = [];
  const pushSeat = (
    county: CountryMapCounty,
    opts: {
      selected: boolean;
      capital: boolean;
      markerExtent: number;
      codeText: string;
      fullText: string;
    },
  ): void => {
    seatAreas.push({
      id: countyCode(county),
      x: county.label.x,
      y: county.label.y,
      radius: 0,
      fullText: opts.fullText,
      codeText: opts.codeText,
      selected: opts.selected,
      capital: opts.capital,
      markerExtent: opts.markerExtent,
      registryIndex: capitalIndex.get(countyCode(county)),
    });
  };

  if (filledCounty !== undefined && filledCode !== undefined) {
    const ownRegion1 = region1ByLetter(filledCounty.region1Letter);
    const region2 = region2ForCounty(ownRegion1, filledCounty.firstSuffix);
    const firstCode = fullCodes(ownRegion1, region2)[0];
    const codeText = plateCode ?? firstCode;
    const isCapital = capitalIndex.has(filledCode);
    pushSeat(filledCounty, {
      selected: true,
      capital: isCapital,
      markerExtent: 9,
      codeText,
      fullText: `${countySeat(region2)} (${codeText})`,
    });
  }
  for (const capital of map.capitals) {
    const id = countyCode(capital);
    if (id === filledCode) {
      continue;
    }
    const ownRegion1 = region1ByLetter(capital.region1Letter);
    const region2 = region2ForCounty(ownRegion1, capital.firstSuffix);
    const codeText = fullCodes(ownRegion1, region2)[0];
    pushSeat(capital, {
      selected: false,
      capital: true,
      markerExtent: 7,
      codeText,
      fullText: `${countySeat(region2)} (${codeText})`,
    });
  }

  const countryOptions = {
    capitalOrder: 'shortest-full' as const,
    horizontalClamp: true,
  };
  const narrowTiers = placeSeatLabels(
    seatAreas,
    map.viewBox,
    COUNTRY_NARROW,
    countryOptions,
  );
  const wideTiers = placeSeatLabels(
    seatAreas,
    map.viewBox,
    COUNTRY_WIDE,
    countryOptions,
  );
  const seatById = new Map(seatAreas.map((area) => [area.id, area]));

  const areas: MapArea[] = map.counties.map((row) => {
    const ownRegion1 = region1ByLetter(row.region1Letter);
    const region2 = region2ForCounty(ownRegion1, row.firstSuffix);
    const codes = fullCodes(ownRegion1, region2) as [string, ...string[]];
    const text = codes[0];
    const isFilled =
      filled !== undefined &&
      filled.region1Letter === region2.region1Letter &&
      filled.suffixes[0] === region2.suffixes[0];
    const seat = seatById.get(text);
    const narrow = narrowTiers.get(text) ?? EMPTY_SEAT_PLACEMENT;
    const wide = wideTiers.get(text) ?? EMPTY_SEAT_PLACEMENT;
    return {
      id: text,
      path: row.path,
      filled: isFilled,
      tinted: row.region1Letter === region1.letters[0],
      anchor: { x: row.label.x, y: row.label.y },
      label: {
        x: row.label.x,
        y: row.label.y,
        text: seat?.fullText ?? text,
        codeText: seat?.codeText ?? text,
        visible: false,
        wideOnly: false,
        aboveMarker: false,
        tiers: { narrow: narrow.tier, wide: wide.tier },
        positions: { narrow: narrow.position, wide: wide.position },
        forced: { narrow: narrow.forced, wide: wide.forced },
        slideDx: { narrow: narrow.slideDx, wide: wide.slideDx },
        ...(seat?.markerExtent === undefined
          ? {}
          : { markerExtent: seat.markerExtent }),
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

  // One path so shared edges between voivodeships are stroked once.
  const borders = map.voivodeships.map((row) => row.path).join('');
  const voivodeship = map.voivodeships.find(
    (row) => row.region1Letter === region1.letters[0],
  );
  if (voivodeship === undefined) {
    throw new Error(`no voivodeship outline for ${region1.letters[0]}`);
  }

  const capitalMarkers = map.capitals
    .filter((capital) => countyCode(capital) !== filledCode)
    .map((capital) => ({ x: capital.label.x, y: capital.label.y }));

  return {
    viewBox: map.viewBox,
    neighbours: [],
    areas,
    borders,
    labelHalo: true,
    dots: true,
    ...(filledPoint === undefined
      ? {}
      : { marker: { x: filledPoint.x, y: filledPoint.y } }),
    capitalMarkers,
    voivodeshipButton: {
      path: voivodeship.path,
      nameKey:
        filled !== undefined
          ? 'plate.showCountyOnMap'
          : 'plate.showVoivodeshipOnMap',
    },
    ariaLabel,
  };
}
