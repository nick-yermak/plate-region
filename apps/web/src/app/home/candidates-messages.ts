import type { Language } from '../i18n/language.types';
import type { CandidatesView, TranslatableMessage } from './home.types';

export function candidatesHeading(
  _result: CandidatesView,
  _language: Language,
): TranslatableMessage | undefined {
  throw new Error('not implemented');
}

export function voivodeshipLine(
  _result: CandidatesView,
  _language: Language,
): TranslatableMessage {
  throw new Error('not implemented');
}
