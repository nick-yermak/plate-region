import { RouterLink } from '@angular/router';
import { Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NzIconDirective, provideNzIconsPatch } from 'ng-zorro-antd/icon';

import { InfoCircleOutline } from '../plate-icons';
import type { TranslatableMessage } from '../../i18n/i18n.types';
import type { PathViewBox } from '../../shared/map/path-view-box';
import type { VoivodeshipCardCode } from '../voivodeship-card-view';
import { MapBackdrop } from '../../shared/map/map-backdrop/map-backdrop';

@Component({
  selector: 'app-voivodeship-card',
  imports: [MapBackdrop, NzIconDirective, RouterLink, TranslocoPipe],
  providers: [provideNzIconsPatch([InfoCircleOutline])],
  templateUrl: './voivodeship-card.html',
  styleUrl: './voivodeship-card.less',
})
export class VoivodeshipCardComponent {
  readonly heading = input.required<TranslatableMessage>();
  readonly codes = input.required<readonly VoivodeshipCardCode[]>();
  readonly borders = input<string | undefined>();
  readonly regionPath = input<string | undefined>();
  readonly viewBox = input<PathViewBox | undefined>();
}
