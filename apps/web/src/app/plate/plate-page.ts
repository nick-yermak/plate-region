import { Component, input } from '@angular/core';

import { PlateComponent } from '../shared/plate/plate';

@Component({
  selector: 'app-plate-page',
  imports: [PlateComponent],
  template: `
    <h1>Plate</h1>
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
