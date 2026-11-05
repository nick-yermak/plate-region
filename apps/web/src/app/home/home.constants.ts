import { InjectionToken } from '@angular/core';

import type { RandomSource } from '@plate-region/plate-domain';

export const CANDIDATES_LIMIT = 10;
export const PLATE_ERROR_ID = 'home-plate-error';
export const PLATE_HINT_ID = 'home-plate-hint';
export const EXAMPLES_LABEL_ID = 'home-examples-label';

export const HOME_RANDOM = new InjectionToken<RandomSource>('HOME_RANDOM', {
  providedIn: 'root',
  factory: () => () => Math.random(),
});
