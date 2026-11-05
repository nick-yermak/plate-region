import { pluralKey } from '../i18n/plural-key';
import type { CandidatesView } from './home.types';
import type { Language } from '../i18n/language.types';
import type { TranslatableMessage } from '../i18n/i18n.types';
import { countyHeading } from '../shared/county/county-heading';

export function answerHeading(
  view: CandidatesView,
): TranslatableMessage | undefined {
  return view.answer === undefined
    ? undefined
    : countyHeading(view.answer.region2);
}

export function othersHeading(
  view: CandidatesView,
): TranslatableMessage | undefined {
  if (view.answer === undefined || view.counties.length === 0) {
    return undefined;
  }
  return { key: 'home.candidates.others' };
}

export function candidatesHeading(
  view: CandidatesView,
  language: Language,
): TranslatableMessage | undefined {
  if (view.answer !== undefined) {
    return undefined;
  }
  const count = view.counties.length;
  if (count === 0) {
    return undefined;
  }
  return {
    key: pluralKey('home.candidates.heading', count, language),
    params: { count },
  };
}

export function voivodeshipLine(
  view: CandidatesView,
  language: Language,
): TranslatableMessage {
  const name =
    language === 'pl' ? view.region1.name : view.region1.nameEn.value;
  return {
    key: 'home.candidates.voivodeship',
    params: { name },
  };
}
