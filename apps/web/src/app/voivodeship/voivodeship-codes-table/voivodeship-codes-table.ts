import { Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  NzTableCellDirective,
  NzTableComponent,
  NzTbodyComponent,
  NzTheadComponent,
  NzTrDirective,
} from 'ng-zorro-antd/table';

import { PlateComponent } from '../../shared/plate/plate/plate';
import type { TranslatableMessage } from '../../i18n/i18n.types';

export type VoivodeshipCodeRow = {
  readonly code: string;
  readonly county: TranslatableMessage;
  readonly plate: string;
};

@Component({
  selector: 'app-voivodeship-codes-table',
  imports: [
    NzTableCellDirective,
    NzTableComponent,
    NzTbodyComponent,
    NzTheadComponent,
    NzTrDirective,
    PlateComponent,
    TranslocoPipe,
  ],
  templateUrl: './voivodeship-codes-table.html',
  styleUrl: './voivodeship-codes-table.less',
  host: { class: 'pr-codes-table' },
})
export class VoivodeshipCodesTable {
  readonly rows = input.required<readonly VoivodeshipCodeRow[]>();
  readonly targetCode = input<string | null>(null);
}
