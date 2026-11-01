import { TranslocoPipe } from '@jsverse/transloco';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { Component, computed, input, output } from '@angular/core';
import { MoonOutline, SunOutline } from '@ant-design/icons-angular/icons';
import { NzIconDirective, provideNzIconsPatch } from 'ng-zorro-antd/icon';

import { Theme } from '../theme.types';

@Component({
  selector: 'app-theme-toggle',
  imports: [NzButtonComponent, NzIconDirective, TranslocoPipe],
  providers: [provideNzIconsPatch([SunOutline, MoonOutline])],
  templateUrl: './theme-toggle.html',
})
export class ThemeToggleComponent {
  readonly theme = input.required<Theme>();
  readonly themeChange = output<Theme>();

  protected readonly labelKey = computed(() =>
    this.theme() === 'light' ? 'theme.switchToDark' : 'theme.switchToLight',
  );

  protected readonly icon = computed(() =>
    this.theme() === 'light' ? 'moon' : 'sun',
  );

  protected requestOppositeTheme(): void {
    this.themeChange.emit(this.theme() === 'light' ? 'dark' : 'light');
  }
}
