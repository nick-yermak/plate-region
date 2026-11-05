import { Router } from '@angular/router';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { FormField, FormRoot, form } from '@angular/forms/signals';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import {
  NzFormControlComponent,
  NzFormDirective,
  NzFormItemComponent,
} from 'ng-zorro-antd/form';

import { search } from '../search';
import { PLATE_ERROR_ID } from '../home.constants';
import type { CandidatesView, SearchError } from '../home.types';
import { LanguageService } from '../../language/language.service';
import { isSearchError, searchErrorMessage } from '../search-error';
import { CandidatesListComponent } from '../candidates-list/candidates-list';
import { PlateInputComponent } from '../../shared/plate/plate-input/plate-input';
import {
  answerHeading,
  candidatesHeading,
  voivodeshipLine,
} from '../candidates-messages';

@Component({
  selector: 'app-home-page',
  imports: [
    CandidatesListComponent,
    FormField,
    FormRoot,
    NzButtonComponent,
    NzFlexModule,
    NzFormControlComponent,
    NzFormDirective,
    NzFormItemComponent,
    PlateInputComponent,
    TranslocoPipe,
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.less',
})
export class HomePage {
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);
  protected readonly language = inject(LanguageService).language;
  protected readonly errorId = PLATE_ERROR_ID;
  protected readonly plate = signal('');
  protected readonly searchForm = form(this.plate, {
    submission: { action: async () => this.runSearch() },
  });
  protected readonly candidates = linkedSignal<
    string,
    CandidatesView | undefined
  >({
    source: this.plate,
    computation: () => undefined,
  });
  // Cleared with candidates when the plate value changes (same linkedSignal source).
  protected readonly announcement = linkedSignal<string, string>({
    source: this.plate,
    computation: () => '',
  });
  protected readonly error = computed(() => {
    for (const candidate of this.searchForm().errors()) {
      if (isSearchError(candidate)) {
        return searchErrorMessage(candidate);
      }
    }
    return undefined;
  });

  private async runSearch(): Promise<SearchError | undefined> {
    const outcome = search(this.plate());
    switch (outcome.kind) {
      case 'navigate':
        await this.router.navigate(['/plate', outcome.plate]);
        return undefined;
      case 'candidates':
        this.candidates.set(outcome.view);
        this.announce(outcome.view);
        return undefined;
      case 'error':
        return outcome.error;
    }
  }

  private announce(result: CandidatesView): void {
    const language = this.language();
    const message =
      answerHeading(result) ??
      candidatesHeading(result, language) ??
      voivodeshipLine(result, language);
    this.announcement.set(
      this.transloco.translate(message.key, message.params),
    );
  }
}
