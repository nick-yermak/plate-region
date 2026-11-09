import { provideTransloco } from '@jsverse/transloco';
import { provideNzI18n, en_US } from 'ng-zorro-antd/i18n';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import {
  ApplicationConfig,
  isDevMode,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';

import { appRoutes } from './app.routes';
import { TranslocoFetchLoader } from './i18n/transloco-fetch.loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideNzI18n(en_US),
    ...provideTransloco({
      config: {
        availableLangs: ['en', 'pl'],
        defaultLang: 'en',
        fallbackLang: [],
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoFetchLoader,
    }),
  ],
};
