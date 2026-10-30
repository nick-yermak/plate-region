import { NzIconDirective } from 'ng-zorro-antd/icon';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { Component, computed, input, output } from '@angular/core';

import { Theme } from './theme.types';

@Component({
  selector: 'app-theme-toggle',
  imports: [NzButtonComponent, NzIconDirective],
  templateUrl: './theme-toggle.html',
})
export class ThemeToggleComponent {
  readonly theme = input.required<Theme>();
  readonly themeChange = output<Theme>();

  protected readonly label = computed(() =>
    this.theme() === 'light' ? 'Switch to dark theme' : 'Switch to light theme',
  );

  protected readonly icon = computed(() =>
    this.theme() === 'light' ? 'moon' : 'sun',
  );

  protected requestOppositeTheme(): void {
    this.themeChange.emit(this.theme() === 'light' ? 'dark' : 'light');
  }
}
