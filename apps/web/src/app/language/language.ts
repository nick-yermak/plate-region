import { Language } from './language.types';

export function resolveLanguage(
  stored: string | null,
  navigatorLanguage: string,
): Language {
  if (stored === 'en' || stored === 'pl') {
    return stored;
  }
  return navigatorLanguage.toLowerCase().startsWith('pl') ? 'pl' : 'en';
}

export function dictionaryUrl(lang: string): string {
  return 'i18n/' + lang + '.json';
}
