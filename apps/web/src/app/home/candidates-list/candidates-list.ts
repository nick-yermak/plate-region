import { TranslocoPipe } from '@jsverse/transloco';
import { Component, computed, input } from '@angular/core';

import { pluralKey } from '../../i18n/plural-key';
import type { CandidatesView } from '../home.types';
import { CANDIDATES_LIMIT } from '../home.constants';
import type { Language } from '../../i18n/language.types';
import { candidatesHeading, voivodeshipLine } from '../candidates-messages';

@Component({
  selector: 'app-candidates-list',
  imports: [TranslocoPipe],
  templateUrl: './candidates-list.html',
  styleUrl: './candidates-list.less',
})
export class CandidatesListComponent {
  readonly result = input.required<CandidatesView>();
  readonly language = input.required<Language>();

  protected readonly voivodeship = computed(() =>
    voivodeshipLine(this.result(), this.language()),
  );
  protected readonly heading = computed(() =>
    candidatesHeading(this.result(), this.language()),
  );
  protected readonly counties = computed(() =>
    this.result().candidates.filter(
      (candidate) => candidate.kind === 'region2',
    ),
  );
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
  protected readonly hasWithoutRegion2 = computed(() =>
    this.result().candidates.some(
      (candidate) => candidate.kind === 'without-region2',
    ),
  );
  protected readonly hasNotInRegistry = computed(() =>
    this.result().candidates.some(
      (candidate) => candidate.kind === 'region2-not-in-registry',
    ),
  );
}
