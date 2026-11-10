import { Component, computed, input } from '@angular/core';

import { plateFit } from '../plate-fit';
import { PlateFrameComponent } from '../plate-frame/plate-frame';

@Component({
  selector: 'app-plate',
  imports: [PlateFrameComponent],
  templateUrl: './plate.html',
  styleUrl: './plate.less',
})
export class PlateComponent {
  readonly plate = input.required<string>();

  protected readonly fit = computed(() => plateFit(this.plate()));
}
