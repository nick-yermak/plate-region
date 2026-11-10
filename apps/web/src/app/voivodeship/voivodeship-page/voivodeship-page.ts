import { DOCUMENT } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { NzFlexDirective } from 'ng-zorro-antd/flex';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  afterRenderEffect,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { voivodeshipView } from '../voivodeship-view';
import { LanguageService } from '../../language/language.service';
import { countyHeading } from '../../shared/county/county-heading';
import { VoivodeshipTabs } from '../voivodeship-tabs/voivodeship-tabs';
import { VoivodeshipNotFound } from '../voivodeship-not-found/voivodeship-not-found';
import { VoivodeshipCodesTable } from '../voivodeship-codes-table/voivodeship-codes-table';
import {
  voivodeshipCountsMessage,
  voivodeshipHeading,
  voivodeshipLettersLine,
  voivodeshipNavLinks,
} from '../voivodeship-messages';

@Component({
  selector: 'app-voivodeship-page',
  imports: [
    NzFlexDirective,
    TranslocoPipe,
    VoivodeshipCodesTable,
    VoivodeshipNotFound,
    VoivodeshipTabs,
  ],
  templateUrl: './voivodeship-page.html',
  styleUrl: './voivodeship-page.less',
})
export class VoivodeshipPage {
  private readonly document = inject(DOCUMENT);
  private readonly languageService = inject(LanguageService);
  private readonly route = inject(ActivatedRoute);

  readonly slug = input.required<string>();

  protected readonly language = this.languageService.language;

  protected readonly view = computed(() => voivodeshipView(this.slug()));

  protected readonly found = computed(() => {
    const view = this.view();
    if (view.status !== 'found') {
      return null;
    }
    const language = this.language();
    return {
      heading: voivodeshipHeading(view, language),
      letters: voivodeshipLettersLine(view, language),
      counts: voivodeshipCountsMessage(view, language),
      tabLinks: voivodeshipNavLinks(language).map((link) => ({
        slug: link.slug,
        label: link.name,
      })),
      rows: view.counties.flatMap((county) => {
        const countyMessage = countyHeading(county.region2);
        return county.codes.map((entry) => ({
          code: entry.code,
          county: countyMessage,
          plate: entry.plate,
        }));
      }),
      targetCode: this.fragment(),
    };
  });

  private readonly fragment = toSignal(this.route.fragment, {
    initialValue: null as string | null,
  });

  constructor() {
    afterRenderEffect(() => {
      // Scroll here instead of withInMemoryScrolling (D-58).
      const fragment = this.fragment();
      this.view();
      if (fragment === null || fragment === '') {
        return;
      }
      this.document.getElementById(fragment)?.scrollIntoView();
    });
  }
}
