import { Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { PlateComponent } from '../shared/plate/plate';

@Component({
  selector: 'app-plate-page',
  imports: [PlateComponent, TranslocoPipe],
  template: `
    <h1>{{ 'plate.title' | transloco }}</h1>
    <div class="plate-wrap">
      <app-plate [plate]="plate()" />
    </div>
  `,
  styles: `
    .plate-wrap {
      container-type: inline-size;
    }

    app-plate {
      font-size: min(4rem, calc(100cqi * 114 / 520));
    }
  `,
})
export class PlatePage {
  readonly plate = input.required<string>();
}
