import { TranslocoPipe } from '@jsverse/transloco';
import { Component, computed, input } from '@angular/core';

import { PlateComponent } from '../../shared/plate/plate/plate';
import type { VoivodeshipCountyView } from '../voivodeship-view';
import { countyHeading } from '../../shared/county/county-heading';

@Component({
  selector: 'app-voivodeship-county',
  imports: [PlateComponent, TranslocoPipe],
  templateUrl: './voivodeship-county.html',
  styleUrl: './voivodeship-county.less',
})
export class VoivodeshipCounty {
  readonly county = input.required<VoivodeshipCountyView>();

  protected readonly heading = computed(() =>
    countyHeading(this.county().region2),
  );
}
