import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Component, input, output } from '@angular/core';
import {
  NzSkeletonElementButtonComponent,
  NzSkeletonElementDirective,
} from 'ng-zorro-antd/skeleton';
import {
  NzMenuDirective,
  NzMenuItemComponent,
  NzMenuModeType,
  NzMenuThemeType,
} from 'ng-zorro-antd/menu';

import { NavLink } from '../layout.types';

@Component({
  selector: 'app-nav-menu',
  imports: [
    RouterLink,
    TranslocoPipe,
    NzMenuDirective,
    NzMenuItemComponent,
    NzSkeletonElementDirective,
    NzSkeletonElementButtonComponent,
  ],
  templateUrl: './nav-menu.html',
})
export class NavMenuComponent {
  readonly links = input.required<readonly NavLink[]>();
  readonly mode = input.required<NzMenuModeType>();
  readonly theme = input<NzMenuThemeType>('light');
  readonly pending = input(false);
  readonly linkSelect = output<NavLink>();
}
