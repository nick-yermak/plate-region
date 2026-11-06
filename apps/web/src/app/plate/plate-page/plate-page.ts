import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { NzFlexDirective } from 'ng-zorro-antd/flex';
import { Component, computed, inject, input } from '@angular/core';

import { plateDisplayText, resultView } from '../result-view';
import { PlateComponent } from '../../shared/plate/plate/plate';
import { LanguageService } from '../../language/language.service';
import { ResultReadingComponent } from '../result-reading/result-reading';
import { CandidatesListComponent } from '../candidates-list/candidates-list';
import { CarIllustrationComponent } from '../car-illustration/car-illustration';

@Component({
  selector: 'app-plate-page',
  imports: [
    CandidatesListComponent,
    CarIllustrationComponent,
    NzFlexDirective,
    PlateComponent,
    ResultReadingComponent,
    RouterLink,
    TranslocoPipe,
  ],
  templateUrl: './plate-page.html',
  styleUrl: './plate-page.less',
})
export class PlatePage {
  private readonly languageService = inject(LanguageService);

  readonly plate = input.required<string>();

  protected readonly language = this.languageService.language;

  protected readonly view = computed(() =>
    resultView(this.plate(), this.language()),
  );

  protected readonly plateText = computed(() => plateDisplayText(this.plate()));
}
