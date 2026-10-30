import { RouterOutlet } from '@angular/router';
import { Component, signal } from '@angular/core';

import { ThemeSwitcherComponent } from '../theme/theme-switcher';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, ThemeSwitcherComponent],
  template: `
    <app-theme-switcher />
    <router-outlet />
  `,
})
export class ShellComponent {
  protected readonly drawerOpen = signal(false);
}
