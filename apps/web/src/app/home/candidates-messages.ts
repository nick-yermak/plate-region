import { pluralKey } from '../i18n/plural-key';
import type { Language } from '../i18n/language.types';
import type { CandidatesView, TranslatableMessage } from './home.types';

export function candidatesHeading(
  result: CandidatesView,
  language: Language,
): TranslatableMessage | undefined {
  const count = result.candidates.filter(
    (candidate) => candidate.kind === 'region2',
  ).length;
  if (count === 0) {
    return undefined;
  }
  return {
    key: pluralKey('home.candidates.heading', count, language),
    params: { count },
  };
}

export function voivodeshipLine(
  result: CandidatesView,
  language: Language,
): TranslatableMessage {
  const name =
    language === 'pl' ? result.region1.name : result.region1.nameEn.value;
  return {
    key: 'home.candidates.voivodeship',
    params: { name },
  };
}
