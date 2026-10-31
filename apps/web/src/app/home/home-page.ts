import { Component, signal } from '@angular/core';

import { PlateInputComponent } from '../shared/plate/plate-input';

@Component({
  selector: 'app-home-page',
  imports: [PlateInputComponent],
  template: `
    <h1>Home</h1>
    <div class="plate-wrap">
      <app-plate-input [(value)]="plate" label="Licence plate number" />
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
