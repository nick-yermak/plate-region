import { RouterOutlet } from '@angular/router';
import { Component, signal } from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzContentComponent, NzLayoutComponent } from 'ng-zorro-antd/layout';
import {
  NzDrawerComponent,
  NzDrawerContentDirective,
} from 'ng-zorro-antd/drawer';

import { HeaderComponent } from './header';
import { NavMenuComponent } from './nav-menu';
import { NAV_LINKS } from './layout.constants';
import { ThemeSwitcherComponent } from '../theme/theme-switcher';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    NzButtonComponent,
    NzDrawerComponent,
    NzDrawerContentDirective,
    NzLayoutComponent,
    NzContentComponent,
    HeaderComponent,
    NavMenuComponent,
    ThemeSwitcherComponent,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.less',
})
export class ShellComponent {
  protected readonly drawerOpen = signal(false);
  protected readonly navLinks = NAV_LINKS;
}
