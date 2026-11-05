import { Component, input } from '@angular/core';

import type { ReadingView } from '../plate.types';
import type { Language } from '../../i18n/language.types';

@Component({
  selector: 'app-result-reading',
  templateUrl: './result-reading.html',
})
export class ResultReadingComponent {
  readonly reading = input.required<ReadingView>();
  readonly language = input.required<Language>();
}
