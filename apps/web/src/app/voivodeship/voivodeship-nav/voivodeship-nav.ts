import { RouterLink } from '@angular/router';
import { Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import type { VoivodeshipNavLink } from '../voivodeship-messages';

@Component({
  selector: 'app-voivodeship-nav',
  imports: [RouterLink, TranslocoPipe],
  templateUrl: './voivodeship-nav.html',
  styleUrl: './voivodeship-nav.less',
})
export class VoivodeshipNav {
  readonly links = input.required<readonly VoivodeshipNavLink[]>();
  readonly currentSlug = input.required<string>();
}
