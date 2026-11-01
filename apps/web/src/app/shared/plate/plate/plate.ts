import { Component, input } from '@angular/core';

import { PlateFrameComponent } from '../plate-frame/plate-frame';

@Component({
  selector: 'app-plate',
  imports: [PlateFrameComponent],
  templateUrl: './plate.html',
  styleUrl: './plate.less',
})
export class PlateComponent {
  readonly plate = input.required<string>();
}
