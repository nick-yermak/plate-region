import {
  fullCodes,
  type Region1,
  type Region2,
} from '@plate-region/plate-data';
import {
  normalisePlateInput,
  parsePlate,
  voivodeshipSlug,
  type PlateType,
} from '@plate-region/plate-domain';

import type { Language } from '../i18n/language.types';
import { SERIES_HEADING_KEYS } from './plate.constants';
import type { TranslatableMessage } from '../i18n/i18n.types';
import { countyHeading } from '../shared/county/county-heading';
import type { PowiatView, ReadingView, ResultView } from './plate.types';

function voivodeshipDisplayName(region1: Region1, language: Language): string {
  return language === 'pl' ? region1.name : region1.nameEn.value;
}

function typesLabelKey(
  plateTypes: readonly [PlateType, ...PlateType[]],
): ReadingView['typesLabelKey'] {
  return plateTypes.length === 1
    ? 'plate.reading.type'
    : 'plate.reading.possibleTypes';
}

function powiatKindKey(kind: Region2['kind']): PowiatView['kindKey'] {
  return kind === 'city' ? 'plate.kind.city' : 'plate.kind.land';
}

function withCountyReading(
  region1: Region1,
  region2: Region2,
  plateTypes: readonly [PlateType, ...PlateType[]],
  language: Language,
  captionKey: ReadingView['captionKey'],
): ReadingView {
  return {
    captionKey,
    powiat: { name: region2.name, kindKey: powiatKindKey(region2.kind) },
    voivodeshipName: voivodeshipDisplayName(region1, language),
    typesLabelKey: typesLabelKey(plateTypes),
    plateTypes,
    link: {
      slug: voivodeshipSlug(region1),
      fragment: fullCodes(region1, region2)[0],
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
    typesLabelKey: typesLabelKey(plateTypes),
    plateTypes,
    link: {
      slug: voivodeshipSlug(region1),
      fragment: undefined,
    },
  };
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
          withCountyReading(
            result.region1,
            result.region2,
            result.plateTypes,
            language,
            undefined,
          ),
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
          withCountyReading(
            result.region1,
            result.withRegion2.region2,
            result.withRegion2.plateTypes,
            language,
            'plate.reading.withCounty',
          ),
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
      return {
        kind: 'message',
        heading: { key: 'plate.messages.noMatchingFormat' },
      };
    case 'empty':
      return {
        kind: 'message',
        heading: { key: 'plate.messages.empty' },
      };
  }
}

/** Normalised plate groups joined with spaces, or the raw input when normalisation fails. */
export function plateDisplayText(plate: string): string {
  const normalised = normalisePlateInput(plate);
  if (normalised.status === 'ok') {
    return normalised.groups.join(' ');
  }
  return plate;
}
