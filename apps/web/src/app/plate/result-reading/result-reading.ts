import { RouterLink } from '@angular/router';
import { Component, computed, input } from '@angular/core';
import { TranslocoPipe, translateObjectSignal } from '@jsverse/transloco';

import type { ReadingView } from '../plate.types';
import type { Language } from '../../i18n/language.types';

@Component({
  selector: 'app-result-reading',
  imports: [RouterLink, TranslocoPipe],
  templateUrl: './result-reading.html',
  styleUrl: './result-reading.less',
})
export class ResultReadingComponent {
  readonly reading = input.required<ReadingView>();
  readonly language = input.required<Language>();

  protected readonly typesText = computed(() => {
    const labels = this.typeLabels();
    const texts = this.reading()
      .plateTypes.map((type) => {
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

  protected readonly linkKey = computed(() =>
    this.reading().link.fragment === undefined
      ? 'plate.reading.voivodeshipLink'
      : 'plate.reading.countyLink',
  );

  protected readonly linkName = computed(() => {
    const reading = this.reading();
    return reading.link.fragment === undefined
      ? reading.voivodeshipName
      : (reading.powiat?.name ?? reading.voivodeshipName);
  });

  private readonly typeLabels = translateObjectSignal('plate.types');
}
