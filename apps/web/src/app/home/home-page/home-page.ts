import { Component, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { PlateInputComponent } from '../../shared/plate/plate-input/plate-input';

@Component({
  selector: 'app-home-page',
  imports: [PlateInputComponent, TranslocoPipe],
  template: `
    <h1>{{ 'home.title' | transloco }}</h1>
    <div class="plate-wrap">
      <app-plate-input
        [(value)]="plate"
        [label]="'home.plateNumber' | transloco"
      />
    </div>
  `,
  styles: `
    .plate-wrap {
      container-type: inline-size;
    }

    app-plate-input {
      font-size: min(5rem, calc(100cqi * 114 / 520));
    }
  `,
})
export class HomePage {
  protected readonly plate = signal('');
}
