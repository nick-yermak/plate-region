import { RouterLink } from '@angular/router';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { Component, computed, input } from '@angular/core';
import { TranslocoPipe, translateObjectSignal } from '@jsverse/transloco';
import { NzIconDirective, provideNzIconsPatch } from 'ng-zorro-antd/icon';

import type { ReadingView } from '../plate.types';
import type { Language } from '../../i18n/language.types';
import {
  ApartmentOutline,
  BankOutline,
  CarOutline,
  EnvironmentOutline,
  UnorderedListOutline,
} from '../plate-icons';

@Component({
  selector: 'app-result-reading',
  imports: [NzButtonComponent, NzIconDirective, RouterLink, TranslocoPipe],
  providers: [
    provideNzIconsPatch([
      ApartmentOutline,
      BankOutline,
      CarOutline,
      EnvironmentOutline,
      UnorderedListOutline,
    ]),
  ],
  templateUrl: './result-reading.html',
  styleUrl: './result-reading.less',
})
export class ResultReadingComponent {
  readonly reading = input.required<ReadingView>();
  readonly language = input.required<Language>();

  protected readonly typesText = computed(() => {
    const types = this.reading().types;
    if (types === undefined) {
      return '';
    }
    const labels = this.typeLabels();
    const texts = types.plateTypes
      .map((type) => {
        const label = (labels as Record<string, unknown>)[type];
        return typeof label === 'string' ? label : undefined;
      })
      .filter((label): label is string => label !== undefined);
    return new Intl.ListFormat(this.language(), {
      type: 'disjunction',
    }).format(texts);
  });

  protected readonly districtsText = computed(() => {
    const districts = this.reading().districts;
    if (districts === undefined) {
      return '';
    }
    return new Intl.ListFormat(this.language(), {
      type: 'disjunction',
    }).format(districts);
  });

  private readonly typeLabels = translateObjectSignal('plate.types');
}
