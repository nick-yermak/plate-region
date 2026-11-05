import { TranslocoPipe } from '@jsverse/transloco';
import { Component, computed, input } from '@angular/core';

import { pluralKey } from '../../i18n/plural-key';
import type { CandidatesView } from '../plate.types';
import type { Language } from '../../i18n/language.types';
import { CANDIDATES_LIMIT } from '../../home/home.constants';
import {
  answerHeading,
  candidatesHeading,
  othersHeading,
  voivodeshipLine,
} from '../candidates-messages';

@Component({
  selector: 'app-candidates-list',
  imports: [TranslocoPipe],
  templateUrl: './candidates-list.html',
  styleUrl: './candidates-list.less',
})
export class CandidatesListComponent {
  readonly result = input.required<CandidatesView>();
  readonly language = input.required<Language>();

  protected readonly answer = computed(() => answerHeading(this.result()));
  protected readonly voivodeship = computed(() =>
    voivodeshipLine(this.result(), this.language()),
  );
  protected readonly others = computed(() => othersHeading(this.result()));
  protected readonly heading = computed(() =>
    candidatesHeading(this.result(), this.language()),
  );
  protected readonly counties = computed(() => this.result().counties);
  protected readonly shown = computed(() =>
    this.counties().slice(0, CANDIDATES_LIMIT),
  );
  protected readonly hiddenCount = computed(() =>
    Math.max(0, this.counties().length - CANDIDATES_LIMIT),
  );
  protected readonly more = computed(() => {
    const count = this.hiddenCount();
    if (count === 0) {
      return undefined;
    }
    return {
      key: pluralKey('home.candidates.more', count, this.language()),
      params: { count },
    };
  });
  protected readonly hasWithoutRegion2 = computed(
    () => this.result().withoutRegion2,
  );
  protected readonly hasNotInRegistry = computed(
    () => this.result().notInRegistry,
  );
}
