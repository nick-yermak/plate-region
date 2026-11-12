import { TranslocoPipe } from '@jsverse/transloco';
import { Component, input, output } from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzIconDirective, provideNzIconsPatch } from 'ng-zorro-antd/icon';

import { GlobalOutline } from '../plate-icons';

@Component({
  selector: 'app-map-dialog-open-button',
  imports: [NzButtonComponent, NzIconDirective, TranslocoPipe],
  providers: [provideNzIconsPatch([GlobalOutline])],
  templateUrl: './map-dialog-open-button.html',
})
export class MapDialogOpenButtonComponent {
  readonly filled = input.required<boolean>();

  readonly openClick = output<void>();
}
