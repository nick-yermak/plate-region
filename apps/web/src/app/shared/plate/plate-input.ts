import { Component, input, model } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';

import { PlateFrameComponent } from './plate-frame';

@Component({
  selector: 'app-plate-input',
  imports: [PlateFrameComponent],
  templateUrl: './plate-input.html',
  styleUrl: './plate-input.less',
})
export class PlateInputComponent implements FormValueControl<string> {
  readonly value = model('');
  readonly label = input.required<string>();

  protected onInput(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.value.set(target.value);
    }
  }
}
