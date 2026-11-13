import { Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NzIconDirective, provideNzIconsPatch } from 'ng-zorro-antd/icon';

import { InfoCircleOutline } from '../plate-icons';
import type { TranslatableMessage } from '../../i18n/i18n.types';
import type { VoivodeshipCardCode } from '../voivodeship-card-view';

@Component({
  selector: 'app-voivodeship-card',
  imports: [NzIconDirective, TranslocoPipe],
  providers: [provideNzIconsPatch([InfoCircleOutline])],
  templateUrl: './voivodeship-card.html',
  styleUrl: './voivodeship-card.less',
})
export class VoivodeshipCardComponent {
  readonly heading = input.required<TranslatableMessage>();
  readonly codes = input.required<readonly VoivodeshipCardCode[]>();
}
