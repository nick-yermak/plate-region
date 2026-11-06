import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Component, computed, input } from '@angular/core';

import type { Language } from '../../i18n/language.types';
import type { CandidatesView, VoivodeshipLink } from '../plate.types';
import {
  candidatesHeading,
  othersHeading,
  voivodeshipLine,
} from '../candidates-messages';

@Component({
  selector: 'app-candidates-list',
  imports: [RouterLink, TranslocoPipe],
  templateUrl: './candidates-list.html',
  styleUrl: './candidates-list.less',
})
export class CandidatesListComponent {
  readonly result = input.required<CandidatesView>();
  readonly link = input<VoivodeshipLink | undefined>();
  readonly language = input.required<Language>();

  protected readonly voivodeship = computed(() =>
    voivodeshipLine(this.result(), this.language()),
  );
  protected readonly others = computed(() => othersHeading(this.result()));
  protected readonly heading = computed(() =>
    candidatesHeading(this.result(), this.language()),
  );
  protected readonly counties = computed(() => this.result().counties);
  protected readonly answerName = computed(
    () => this.result().answer?.region2.name,
  );
  protected readonly hasWithoutRegion2 = computed(
    () => this.result().withoutRegion2,
  );
  protected readonly hasNotInRegistry = computed(
    () => this.result().notInRegistry,
  );
}
