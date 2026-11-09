import { provideTransloco } from '@jsverse/transloco';
import { provideNzI18n, en_US } from 'ng-zorro-antd/i18n';
import {
  ApplicationConfig,
  isDevMode,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';

import { appRoutes } from './app.routes';
import { TranslocoFetchLoader } from './i18n/transloco-fetch.loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      withInMemoryScrolling({ anchorScrolling: 'enabled' }),
    ),
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
