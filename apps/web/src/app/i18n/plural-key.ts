import { Language } from '../language/language.types';

export function pluralKey(
  base: string,
  count: number,
  language: Language,
): string {
  const category = new Intl.PluralRules(language).select(count);
  return `${base}.${category}`;
}
