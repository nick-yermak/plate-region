import { RouterLink } from '@angular/router';
import { Component, input, output } from '@angular/core';
import {
  NzMenuDirective,
  NzMenuItemComponent,
  NzMenuModeType,
  NzMenuThemeType,
} from 'ng-zorro-antd/menu';

import { NavLink } from './layout.types';

@Component({
  selector: 'app-nav-menu',
  imports: [RouterLink, NzMenuDirective, NzMenuItemComponent],
  templateUrl: './nav-menu.html',
})
export class NavMenuComponent {
  readonly links = input.required<readonly NavLink[]>();
  readonly mode = input.required<NzMenuModeType>();
  readonly theme = input<NzMenuThemeType>('light');
  readonly linkSelect = output<NavLink>();
}
