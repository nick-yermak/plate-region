import { Component, input } from '@angular/core';

import type { PathViewBox } from '../path-view-box';

@Component({
  selector: 'app-map-backdrop',
  imports: [],
  templateUrl: './map-backdrop.html',
  styleUrl: './map-backdrop.less',
  host: {
    'aria-hidden': 'true',
  },
})
export class MapBackdrop {
  readonly regionPath = input.required<string>();
  readonly countyBorders = input.required<string>();
  readonly borders = input.required<string>();
  readonly viewBox = input.required<PathViewBox>();
}
