import { RouterOutlet } from '@angular/router';
import { Component, computed, inject, signal } from '@angular/core';
import { NzContentComponent, NzLayoutComponent } from 'ng-zorro-antd/layout';
import {
  NzDrawerComponent,
  NzDrawerContentDirective,
} from 'ng-zorro-antd/drawer';
import {
  NzSkeletonElementButtonComponent,
  NzSkeletonElementDirective,
} from 'ng-zorro-antd/skeleton';

import { HeaderComponent } from './header';
import { NavMenuComponent } from './nav-menu';
import { NAV_LINKS } from './layout.constants';
import { LanguageService } from '../language/language.service';
import { ThemeSwitcherComponent } from '../theme/theme-switcher';
import { LanguageSwitcherComponent } from '../language/language-switcher';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    NzDrawerComponent,
    NzDrawerContentDirective,
    NzLayoutComponent,
    NzContentComponent,
    NzSkeletonElementDirective,
    NzSkeletonElementButtonComponent,
    HeaderComponent,
    NavMenuComponent,
    LanguageSwitcherComponent,
    ThemeSwitcherComponent,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.less',
})
export class ShellComponent {
  private readonly languageService = inject(LanguageService);

  protected readonly drawerOpen = signal(false);
  protected readonly navLinks = NAV_LINKS;

  protected readonly contentPending = computed(
    () =>
      !this.languageService.dictionaryReady() &&
      !this.languageService.loadFailed(),
  );
}
