import { Pipe, PipeTransform } from '@angular/core';

import { pluralKey } from './plural-key';
import { Language } from '../language/language.types';

@Pipe({ name: 'pluralKey' })
export class PluralKeyPipe implements PipeTransform {
  transform(count: number, base: string, language: Language): string {
    return pluralKey(base, count, language);
  }
}
