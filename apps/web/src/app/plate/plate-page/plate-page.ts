import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { NzFlexDirective } from 'ng-zorro-antd/flex';
import { Component, computed, inject, input } from '@angular/core';

import { parsePlate } from '@plate-region/plate-domain';

import { plateDisplayText, resultView } from '../result-view';
import { PlateComponent } from '../../shared/plate/plate/plate';
import { LanguageService } from '../../language/language.service';
import { ResultReadingComponent } from '../result-reading/result-reading';
import { CarIllustrationComponent } from '../car-illustration/car-illustration';

@Component({
  selector: 'app-plate-page',
  imports: [
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

  protected readonly result = computed(() => parsePlate(this.plate()));

  protected readonly view = computed(() =>
    resultView(this.result(), this.language()),
  );

  protected readonly plateText = computed(() => plateDisplayText(this.plate()));
}
