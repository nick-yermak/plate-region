import { registry } from '@plate-region/plate-data';
import type { Region1 } from '@plate-region/plate-data';
import { voivodeshipSlug } from '@plate-region/plate-domain';

import { pluralKey } from '../i18n/plural-key';
import type { Language } from '../i18n/language.types';
import type { VoivodeshipView } from './voivodeship-view';
import type { TranslatableMessage } from '../i18n/i18n.types';

export type VoivodeshipNavLink = {
  readonly slug: string;
  readonly name: string;
};

export type VoivodeshipCountsMessage = {
  readonly key: 'voivodeship.counts';
  readonly counties: TranslatableMessage;
  readonly codes: TranslatableMessage;
};

export function voivodeshipDisplayName(
  region1: Region1,
  language: Language,
): string {
  return language === 'pl' ? region1.name : region1.nameEn.value;
}

export function formatDistrictList(
  language: Language,
  districts: readonly string[],
): string {
  return new Intl.ListFormat(language, { type: 'conjunction' }).format([
    ...districts,
  ]);
}

export function voivodeshipHeading(
  view: Extract<VoivodeshipView, { status: 'found' }>,
  language: Language,
): TranslatableMessage {
  return {
    key: 'voivodeship.heading',
    params: { name: voivodeshipDisplayName(view.region1, language) },
  };
}

export function voivodeshipLettersLine(
  view: Extract<VoivodeshipView, { status: 'found' }>,
  language: Language,
): TranslatableMessage {
  const letters = new Intl.ListFormat(language, {
    type: 'disjunction',
  }).format([...view.region1.letters]);
  return {
    key: 'voivodeship.letters',
    params: { letters },
  };
}

export function voivodeshipCountsMessage(
  view: Extract<VoivodeshipView, { status: 'found' }>,
  language: Language,
): VoivodeshipCountsMessage {
  return {
    key: 'voivodeship.counts',
    counties: {
      key: pluralKey('voivodeship.counties', view.countyCount, language),
      params: { count: view.countyCount },
    },
    codes: {
      key: pluralKey('voivodeship.codes', view.codeCount, language),
      params: { count: view.codeCount },
    },
  };
}

export function voivodeshipNavLinks(language: Language): VoivodeshipNavLink[] {
  return registry.region1.map((region1) => ({
    slug: voivodeshipSlug(region1),
    name: voivodeshipDisplayName(region1, language),
  }));
}
