import { Language } from '../i18n/language.types';

export function resolveLanguage(
  stored: string | null,
  navigatorLanguage: string,
): Language {
  if (stored === 'en' || stored === 'pl') {
    return stored;
  }
  return navigatorLanguage.toLowerCase().startsWith('pl') ? 'pl' : 'en';
}
