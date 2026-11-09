import { NzFlexDirective } from 'ng-zorro-antd/flex';
import { Component, computed, inject, input } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { voivodeshipView } from '../voivodeship-view';
import { LanguageService } from '../../language/language.service';
import { VoivodeshipNav } from '../voivodeship-nav/voivodeship-nav';
import { VoivodeshipCounty } from '../voivodeship-county/voivodeship-county';
import { VoivodeshipNotFound } from '../voivodeship-not-found/voivodeship-not-found';
import {
  voivodeshipCountsLine,
  voivodeshipHeading,
  voivodeshipLettersLine,
  voivodeshipNavLinks,
} from '../voivodeship-messages';

@Component({
  selector: 'app-voivodeship-page',
  imports: [
    NzFlexDirective,
    TranslocoPipe,
    VoivodeshipCounty,
    VoivodeshipNav,
    VoivodeshipNotFound,
  ],
  templateUrl: './voivodeship-page.html',
  styleUrl: './voivodeship-page.less',
})
export class VoivodeshipPage {
  private readonly languageService = inject(LanguageService);
  private readonly transloco = inject(TranslocoService);

  readonly slug = input.required<string>();

  protected readonly language = this.languageService.language;

  protected readonly view = computed(() => voivodeshipView(this.slug()));

  protected readonly heading = computed(() => {
    const view = this.view();
    return view.status === 'found'
      ? voivodeshipHeading(view, this.language())
      : undefined;
  });

  protected readonly letters = computed(() => {
    const view = this.view();
    return view.status === 'found'
      ? voivodeshipLettersLine(view, this.language())
      : undefined;
  });

  protected readonly counts = computed(() => {
    const view = this.view();
    if (view.status !== 'found') {
      return undefined;
    }
    const language = this.language();
    return voivodeshipCountsLine(view, language, (key, params) =>
      this.transloco.translate(key, params),
    );
  });

  protected readonly navLinks = computed(() =>
    voivodeshipNavLinks(this.language()),
  );
}
