import { provideNzI18n, en_US } from 'ng-zorro-antd/i18n';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';

import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideNzI18n(en_US),
  ],
};
