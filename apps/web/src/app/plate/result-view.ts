import type {
  Region1,
  Region2,
  UnofficialName,
} from '@plate-region/plate-data';
import {
  candidatesFor,
  normalisePlateInput,
  parsePlate,
  voivodeshipSlug,
  type PlateType,
} from '@plate-region/plate-domain';

import type { Language } from '../i18n/language.types';
import { SERIES_HEADING_KEYS } from './plate.constants';
import type { TranslatableMessage } from '../i18n/i18n.types';
import { countyHeading } from '../shared/county/county-heading';
import { candidatesView, singleCounty } from './candidates-view';
import type {
  CandidatesView,
  PowiatView,
  ReadingView,
  ResultView,
  VoivodeshipLink,
} from './plate.types';

function voivodeshipDisplayName(region1: Region1, language: Language): string {
  return language === 'pl' ? region1.name : region1.nameEn.value;
}

function typesLabelKey(
  plateTypes: readonly [PlateType, ...PlateType[]],
): 'plate.reading.type' | 'plate.reading.possibleTypes' {
  return plateTypes.length === 1
    ? 'plate.reading.type'
    : 'plate.reading.possibleTypes';
}

function powiatKindKey(kind: Region2['kind']): PowiatView['kindKey'] {
  return kind === 'city' ? 'plate.kind.city' : 'plate.kind.land';
}

function withCountyReading({
  region1,
  region2,
  language,
  code,
  plateTypes,
  captionKey,
  districts,
}: {
  region1: Region1;
  region2: Region2;
  language: Language;
  code: string;
  plateTypes?: readonly [PlateType, ...PlateType[]];
  captionKey?: ReadingView['captionKey'];
  districts?: ReadingView['districts'];
}): ReadingView {
  return {
    captionKey,
    powiat: { name: region2.name, kindKey: powiatKindKey(region2.kind) },
    voivodeshipName: voivodeshipDisplayName(region1, language),
    types:
      plateTypes === undefined
        ? undefined
        : {
            labelKey: typesLabelKey(plateTypes),
            plateTypes,
          },
    districts,
    link: {
      slug: voivodeshipSlug(region1),
      fragment: code,
    },
  };
}

function withoutCountyReading(
  region1: Region1,
  plateTypes: readonly [PlateType, ...PlateType[]],
  language: Language,
  captionKey: ReadingView['captionKey'],
): ReadingView {
  return {
    captionKey,
    powiat: undefined,
    voivodeshipName: voivodeshipDisplayName(region1, language),
    types: {
      labelKey: typesLabelKey(plateTypes),
      plateTypes,
    },
    districts: undefined,
    link: {
      slug: voivodeshipSlug(region1),
      fragment: undefined,
    },
  };
}

function districtNames(
  districts: readonly [UnofficialName, ...UnofficialName[]] | undefined,
): ReadingView['districts'] {
  if (districts === undefined) {
    return undefined;
  }
  const [head, ...tail] = districts;
  return [head.value, ...tail.map((district) => district.value)];
}

function voivodeshipHeading(
  region1: Region1,
  language: Language,
): TranslatableMessage {
  return {
    key: 'plate.heading.voivodeship',
    params: { name: voivodeshipDisplayName(region1, language) },
  };
}

/** The result's code for the voivodeship link and filled-map labels (D-54 Update #141). */
export function resultPlateCode(view: ResultView): string | undefined {
  if (view.kind === 'readings') {
    return view.readings[0]?.link.fragment;
  }
  if (view.kind === 'candidates') {
    return view.link?.fragment;
  }
  if (view.kind === 'incomplete') {
    return view.reading.link.fragment;
  }
  return undefined;
}

/** Maps a plate string to the result-page view model for the active UI language. */
export function resultView(plate: string, language: Language): ResultView {
  const result = parsePlate(plate);
  switch (result.status) {
    case 'resolved':
      return {
        kind: 'readings',
        heading: countyHeading(result.region2),
        noteKey: undefined,
        readings: [
          withCountyReading({
            region1: result.region1,
            region2: result.region2,
            language,
            code: result.code,
            plateTypes: result.plateTypes,
            districts: districtNames(result.districts),
          }),
        ],
      };
    case 'region1-only':
      return {
        kind: 'readings',
        heading: voivodeshipHeading(result.region1, language),
        noteKey: 'plate.notes.region1Only',
        readings: [
          withoutCountyReading(
            result.region1,
            result.plateTypes,
            language,
            undefined,
          ),
        ],
      };
    case 'region2-not-in-registry':
      return {
        kind: 'readings',
        heading: voivodeshipHeading(result.region1, language),
        noteKey: 'plate.notes.region2NotInRegistry',
        readings: [
          withoutCountyReading(
            result.region1,
            result.plateTypes,
            language,
            undefined,
          ),
        ],
      };
    case 'ambiguous':
      return {
        kind: 'readings',
        heading: voivodeshipHeading(result.region1, language),
        noteKey: 'plate.notes.ambiguous',
        readings: [
          withCountyReading({
            region1: result.region1,
            region2: result.withRegion2.region2,
            language,
            code: result.withRegion2.code,
            plateTypes: result.withRegion2.plateTypes,
            captionKey: 'plate.reading.withCounty',
            districts: districtNames(result.withRegion2.districts),
          }),
          withoutCountyReading(
            result.region1,
            result.withoutRegion2.plateTypes,
            language,
            'plate.reading.withoutCounty',
          ),
        ],
      };
    case 'not-in-registry':
      return {
        kind: 'message',
        heading: {
          key:
            result.series === undefined
              ? 'plate.messages.notInRegistry'
              : SERIES_HEADING_KEYS[result.series],
        },
      };
    case 'invalid-input':
      if (result.reason === 'invalid-characters') {
        return {
          kind: 'message',
          heading: {
            key: 'plate.messages.invalidCharacters',
            params: { characters: result.invalidCharacters.join(', ') },
          },
        };
      }
      return candidatesOrMessage(plate, language);
    case 'empty':
      return {
        kind: 'message',
        heading: { key: 'plate.messages.empty' },
      };
  }
}

function candidatesOrMessage(plate: string, language: Language): ResultView {
  const found = candidatesFor(plate);
  if (found.status !== 'candidates') {
    return {
      kind: 'message',
      heading: { key: 'plate.messages.noMatchingFormat' },
    };
  }
  const normalised = normalisePlateInput(plate);
  if (normalised.status === 'invalid') {
    throw new Error(
      'candidatesFor accepted input that normalisePlateInput rejects',
    );
  }
  const candidates = candidatesView(found, normalised.compact);
  const candidate = singleCounty(candidates);
  if (candidate !== undefined) {
    // Compact is never one of the codes here, otherwise the county would be the answer.
    const code = candidate.codes[0];
    return {
      kind: 'incomplete',
      heading: countyHeading(candidate.region2),
      noteKey: 'plate.notes.incomplete',
      reading: withCountyReading({
        region1: candidates.region1,
        region2: candidate.region2,
        language,
        code,
      }),
      withoutRegion2: candidates.withoutRegion2,
      notInRegistry: candidates.notInRegistry,
    };
  }
  return {
    kind: 'candidates',
    heading: candidatesPageHeading(candidates, language),
    candidates,
    link: candidatesLink(candidates),
  };
}

function candidatesPageHeading(
  view: CandidatesView,
  language: Language,
): TranslatableMessage {
  if (view.answer !== undefined) {
    return countyHeading(view.answer.region2);
  }
  return voivodeshipHeading(view.region1, language);
}

function candidatesLink(view: CandidatesView): VoivodeshipLink | undefined {
  if (view.answer === undefined) {
    return undefined;
  }
  return {
    slug: voivodeshipSlug(view.region1),
    fragment: view.answer.code,
  };
}

/** Normalised plate groups joined with spaces, or the raw input when normalisation fails. */
export function plateDisplayText(plate: string): string {
  const normalised = normalisePlateInput(plate);
  if (normalised.status === 'ok') {
    return normalised.groups.join(' ');
  }
  return plate;
}
