import { TranslocoTestingOptions } from '@jsverse/transloco';

import en from '../../../generated/i18n/en.json';
import pl from '../../../generated/i18n/pl.json';
import type { Language } from './language.types';

export const TESTING_LANGS = { en, pl };

export const TRANSLOCO_TESTING: TranslocoTestingOptions = {
  langs: TESTING_LANGS,
  preloadLangs: true,
  translocoConfig: {
    reRenderOnLangChange: true,
    availableLangs: ['en', 'pl'],
    defaultLang: 'en',
  },
};

export function testingText(
  language: Language,
  key: string,
  params: Readonly<Record<string, string | number>> = {},
): string {
  const parts = key.split('.');
  let node: unknown = TESTING_LANGS[language];
  for (const part of parts) {
    if (
      node === null ||
      typeof node !== 'object' ||
      !Object.prototype.hasOwnProperty.call(node, part)
    ) {
      throw new Error(`missing translation key ${key} in ${language}`);
    }
    node = (node as Record<string, unknown>)[part];
  }
  if (typeof node !== 'string') {
    throw new Error(`translation key ${key} in ${language} is not a string`);
  }
  const text = node.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => {
    if (!(name in params)) {
      throw new Error(`missing param ${name} for ${key}`);
    }
    return String(params[name]);
  });
  if (/\{\{/.test(text)) {
    throw new Error(`unsubstituted placeholder in ${key}: ${text}`);
  }
  return text;
}
