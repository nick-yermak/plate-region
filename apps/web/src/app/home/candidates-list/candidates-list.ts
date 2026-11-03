import { Component, input } from '@angular/core';

import type { CandidatesView } from '../home.types';
import type { Language } from '../../i18n/language.types';

@Component({
  selector: 'app-candidates-list',
  templateUrl: './candidates-list.html',
  styleUrl: './candidates-list.less',
})
export class CandidatesListComponent {
  readonly result = input.required<CandidatesView>();
  readonly language = input.required<Language>();
}
