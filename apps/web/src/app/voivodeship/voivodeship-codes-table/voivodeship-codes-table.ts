import { Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NzTableComponent } from 'ng-zorro-antd/table';

import { PlateComponent } from '../../shared/plate/plate/plate';

export type VoivodeshipCodeRow = {
  readonly code: string;
  readonly county: string;
  readonly plate: string;
};

@Component({
  selector: 'app-voivodeship-codes-table',
  imports: [NzTableComponent, PlateComponent, TranslocoPipe],
  templateUrl: './voivodeship-codes-table.html',
  styleUrl: './voivodeship-codes-table.less',
  host: { class: 'pr-codes-table' },
})
export class VoivodeshipCodesTable {
  readonly rows = input.required<readonly VoivodeshipCodeRow[]>();
}
