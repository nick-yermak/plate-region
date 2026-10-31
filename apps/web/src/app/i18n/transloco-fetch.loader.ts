import { Injectable } from '@angular/core';
import { TranslocoLoader, Translation } from '@jsverse/transloco';

import { dictionaryUrl } from './dictionary-url';

@Injectable({ providedIn: 'root' })
export class TranslocoFetchLoader implements TranslocoLoader {
  getTranslation(lang: string): Promise<Translation> {
    return fetch(dictionaryUrl(lang)).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Dictionary request failed: ${response.status}`);
      }
      return (await response.json()) as Translation;
    });
  }
}
