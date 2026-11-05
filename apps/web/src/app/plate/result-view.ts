import type { ParseResult } from '@plate-region/plate-domain';

import type { ResultView } from './plate.types';
import type { Language } from '../i18n/language.types';

export function resultView(
  result: ParseResult,
  language: Language,
): ResultView {
  void result;
  void language;
  throw new Error('not implemented');
}

export function plateDisplayText(plate: string): string {
  void plate;
  throw new Error('not implemented');
}
