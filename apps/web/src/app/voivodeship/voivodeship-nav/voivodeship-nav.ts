import { Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { RouterLink, RouterLinkActive } from '@angular/router';

import type { VoivodeshipNavLink } from '../voivodeship-messages';

@Component({
  selector: 'app-voivodeship-nav',
  imports: [RouterLink, RouterLinkActive, TranslocoPipe],
  templateUrl: './voivodeship-nav.html',
  styleUrl: './voivodeship-nav.less',
})
export class VoivodeshipNav {
  readonly links = input.required<readonly VoivodeshipNavLink[]>();
}
