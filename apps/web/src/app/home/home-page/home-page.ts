import { Component, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { PlateInputComponent } from '../../shared/plate/plate-input/plate-input';

@Component({
  selector: 'app-home-page',
  imports: [PlateInputComponent, TranslocoPipe],
  templateUrl: './home-page.html',
  styleUrl: './home-page.less',
})
export class HomePage {
  protected readonly plate = signal('');
}
