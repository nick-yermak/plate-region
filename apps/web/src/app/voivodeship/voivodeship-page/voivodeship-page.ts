import { DOCUMENT } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NzFlexDirective } from 'ng-zorro-antd/flex';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
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

  protected readonly tabLinks = computed(() =>
    voivodeshipNavLinks(this.language()).map((link) => ({
      slug: link.slug,
      label: link.name,
    })),
  );

  protected readonly rows = computed(() => {
    const view = this.view();
    if (view.status !== 'found') {
      return [];
    }
    return view.counties.flatMap((county) => {
      const heading = countyHeading(county.region2);
      const countyLabel = this.transloco.translate(heading.key, heading.params);
      return county.codes.map((entry) => ({
        code: entry.code,
        county: countyLabel,
        plate: entry.plate,
      }));
    });
  });

  private readonly fragment = toSignal(this.route.fragment, {
    initialValue: null as string | null,
  });

  constructor() {
    afterRenderEffect(() => {
      // Scroll here instead of withInMemoryScrolling: that feature costs every page ~6.7 kB for anchors only this page has (D-58).
      const fragment = this.fragment();
      this.view();
      if (fragment === null || fragment === '') {
        return;
      }
      const row = this.document.getElementById(fragment);
      // Angular recreates the row after the first :target resolution; re-apply the
      // hash so the fill rule matches the live `tr` (measured in #93). Setting
      // location.hash scrolls asynchronously — restore scrollY on the next frame so
      // only scrollIntoView moves the page (M10).
      const win = this.document.defaultView;
      if (row !== null && !row.matches(':target') && win !== null) {
        const { pathname, search } = win.location;
        const scrollY = win.scrollY;
        win.history.replaceState(null, '', `${pathname}${search}`);
        win.location.hash = fragment;
        win.requestAnimationFrame(() => {
          win.scrollTo(0, scrollY);
          this.document.getElementById(fragment)?.scrollIntoView();
        });
        return;
      }
      row?.scrollIntoView();
    });
  }
}
