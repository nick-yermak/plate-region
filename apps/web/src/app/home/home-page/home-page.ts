import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { NzFlexDirective } from 'ng-zorro-antd/flex';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { SearchOutline } from '@ant-design/icons-angular/icons';
import { FormField, FormRoot, form } from '@angular/forms/signals';
import { Component, computed, inject, signal } from '@angular/core';
import { NzIconDirective, provideNzIconsPatch } from 'ng-zorro-antd/icon';
import {
  NzFormControlComponent,
  NzFormDirective,
  NzFormItemComponent,
} from 'ng-zorro-antd/form';

import { search } from '../search';
import type { SearchError } from '../home.types';
import { PLATE_ERROR_ID, PLATE_HINT_ID } from '../home.constants';
import { isSearchError, searchErrorMessage } from '../search-error';
import { PlateInputComponent } from '../../shared/plate/plate-input/plate-input';

@Component({
  selector: 'app-home-page',
  imports: [
    FormField,
    FormRoot,
    NzButtonComponent,
    NzFlexDirective,
    NzFormControlComponent,
    NzFormDirective,
    NzFormItemComponent,
    NzIconDirective,
    PlateInputComponent,
    TranslocoPipe,
  ],
  providers: [provideNzIconsPatch([SearchOutline])],
  templateUrl: './home-page.html',
  styleUrl: './home-page.less',
})
export class HomePage {
  private readonly router = inject(Router);

  protected readonly errorId = PLATE_ERROR_ID;
  protected readonly hintId = PLATE_HINT_ID;
  protected readonly plate = signal('');
  protected readonly searchForm = form(this.plate, {
    submission: { action: async () => this.runSearch() },
  });
  protected readonly error = computed(() => {
    for (const candidate of this.searchForm().errors()) {
      if (isSearchError(candidate)) {
        return searchErrorMessage(candidate);
      }
    }
    return undefined;
  });
  protected readonly describedBy = computed(() =>
    this.error() === undefined ? this.hintId : `${this.errorId} ${this.hintId}`,
  );

  private async runSearch(): Promise<SearchError | undefined> {
    const outcome = search(this.plate());
    switch (outcome.kind) {
      case 'navigate':
        await this.router.navigate(['/plate', outcome.plate]);
        return undefined;
      case 'error':
        return outcome.error;
    }
  }
}
