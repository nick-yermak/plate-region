import { RouterOutlet } from '@angular/router';
import { NzContentComponent, NzLayoutComponent } from 'ng-zorro-antd/layout';
import {
  NzDrawerComponent,
  NzDrawerContentDirective,
} from 'ng-zorro-antd/drawer';
import {
  NzSkeletonElementButtonComponent,
  NzSkeletonElementDirective,
} from 'ng-zorro-antd/skeleton';
import {
  afterNextRender,
  Component,
  computed,
  effect,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';

import { NAV_LINKS } from '../layout.constants';
import { HeaderComponent } from '../header/header';
import { NavMenuComponent } from '../nav-menu/nav-menu';
import { LanguageService } from '../../language/language.service';
import { ThemeSwitcherComponent } from '../../theme/theme-switcher/theme-switcher';
import { LanguageSwitcherComponent } from '../../language/language-switcher/language-switcher';

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
  private readonly injector = inject(Injector);
  private readonly languageService = inject(LanguageService);

  protected readonly drawerPresent = signal(false);
  protected readonly drawerVisible = signal(false);

  protected readonly navLinks = NAV_LINKS;
  protected readonly contentPending = computed(
    () =>
      !this.languageService.dictionaryReady() &&
      !this.languageService.loadFailed(),
  );
  private readonly drawer = viewChild(NzDrawerComponent);
  private readonly reopenAfterClose = signal(false);

  constructor() {
    effect((onCleanup) => {
      const drawer = this.drawer();
      if (!drawer) {
        return;
      }
      const sub = drawer.afterClose.subscribe(() => this.onDrawerAfterClose());
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected openDrawer(): void {
    if (this.drawerVisible()) {
      return;
    }
    if (this.drawerPresent()) {
      this.reopenAfterClose.set(true);
      return;
    }
    this.drawerPresent.set(true);
    this.drawerVisible.set(true);
  }

  protected requestDrawerClose(): void {
    this.drawerVisible.set(false);
  }

  private onDrawerAfterClose(): void {
    this.drawerPresent.set(false);
    this.drawerVisible.set(false);
    if (this.reopenAfterClose()) {
      this.reopenAfterClose.set(false);
      afterNextRender(
        () => {
          this.drawerPresent.set(true);
          this.drawerVisible.set(true);
        },
        { injector: this.injector },
      );
    }
  }
}
