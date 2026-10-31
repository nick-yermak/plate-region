import { TranslocoTestingOptions } from '@jsverse/transloco';

import en from '../../../generated/i18n/en.json';
import pl from '../../../generated/i18n/pl.json';

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
