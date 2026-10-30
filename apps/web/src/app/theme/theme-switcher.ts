import { Component, inject } from '@angular/core';
import { ThemeService } from './theme.service';
import { ThemeToggleComponent } from './theme-toggle';

@Component({
  selector: 'app-theme-switcher',
  imports: [ThemeToggleComponent],
  templateUrl: './theme-switcher.html',
})
export class ThemeSwitcherComponent {
  protected readonly themeService = inject(ThemeService);
}
