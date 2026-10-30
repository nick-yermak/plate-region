import { provideRouter } from '@angular/router';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { provideNzI18n, en_US } from 'ng-zorro-antd/i18n';
import { MoonOutline, SunOutline } from '@ant-design/icons-angular/icons';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';

import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideNzI18n(en_US),
    provideNzIcons([SunOutline, MoonOutline]),
  ],
};
