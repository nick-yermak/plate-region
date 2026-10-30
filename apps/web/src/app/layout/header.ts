import { RouterLink } from '@angular/router';
import { NzFlexDirective } from 'ng-zorro-antd/flex';
import { Component, input, output } from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzHeaderComponent } from 'ng-zorro-antd/layout';
import { MenuOutline } from '@ant-design/icons-angular/icons';
import { NzIconDirective, provideNzIconsPatch } from 'ng-zorro-antd/icon';

import { NavLink } from './layout.types';
import { NavMenuComponent } from './nav-menu';

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    NzFlexDirective,
    NzIconDirective,
    NzButtonComponent,
    NzHeaderComponent,
    NavMenuComponent,
  ],
  providers: [provideNzIconsPatch([MenuOutline])],
  templateUrl: './header.html',
  styleUrl: './header.less',
})
export class HeaderComponent {
  readonly links = input.required<readonly NavLink[]>();
  readonly menuOpen = output<void>();
}
