import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  DRAWER_ANIMATE_DURATION,
  NzDrawerComponent,
} from 'ng-zorro-antd/drawer';

import { ShellComponent } from './shell';
import { appRoutes } from '../../app.routes';
import { NAV_LINKS } from '../layout.constants';
import { HeaderComponent } from '../header/header';
import { NavMenuComponent } from '../nav-menu/nav-menu';
import { TRANSLOCO_TESTING } from '../../i18n/testing-langs';
import { LanguageService } from '../../language/language.service';

describe('ShellComponent', () => {
  function provideLanguage(overrides: {
    dictionaryReady?: boolean;
    switching?: boolean;
    loadFailed?: boolean;
  }) {
    return {
      provide: LanguageService,
      useValue: {
        language: signal('en').asReadonly(),
        dictionaryReady: signal(overrides.dictionaryReady ?? true).asReadonly(),
        switching: signal(overrides.switching ?? false).asReadonly(),
        loadFailed: signal(overrides.loadFailed ?? false).asReadonly(),
        setLanguage: vi.fn(),
      },
    };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ShellComponent,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
      providers: [provideRouter(appRoutes), provideLanguage({})],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('passes NAV_LINKS to the header', async () => {
    const fixture = TestBed.createComponent(ShellComponent);
    await fixture.whenStable();

    const header = fixture.debugElement
      .query(By.directive(HeaderComponent))
      .injector.get(HeaderComponent);
    expect(header.links()).toEqual(NAV_LINKS);
  });

  it('does not mount the drawer until the menu opens', async () => {
    const fixture = TestBed.createComponent(ShellComponent);
    await fixture.whenStable();

    expect(
      fixture.debugElement.query(By.directive(NzDrawerComponent)),
    ).toBeNull();
  });

  it('opens the drawer when header emits menuOpen', async () => {
    const fixture = TestBed.createComponent(ShellComponent);
    await fixture.whenStable();

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await openDrawerUnderFakeTimers(fixture);
    await vi.advanceTimersByTimeAsync(DRAWER_ANIMATE_DURATION);
    fixture.detectChanges();

    expect(queryDrawer(fixture).nzVisible).toBe(true);
  });

  it('closes the drawer when drawer nav-menu emits linkSelect', async () => {
    const fixture = TestBed.createComponent(ShellComponent);
    await fixture.whenStable();

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await openDrawerUnderFakeTimers(fixture);
    await vi.advanceTimersByTimeAsync(DRAWER_ANIMATE_DURATION);
    fixture.detectChanges();

    const drawer = queryDrawer(fixture);
    expect(drawer.nzVisible).toBe(true);

    drawerNavMenu(fixture).linkSelect.emit(requireNavLink());
    fixture.detectChanges();

    expect(drawer.nzVisible).toBe(false);

    await vi.advanceTimersByTimeAsync(DRAWER_ANIMATE_DURATION);
    fixture.detectChanges();
  });

  it('unmounts the drawer after close animation completes', async () => {
    const fixture = TestBed.createComponent(ShellComponent);
    await fixture.whenStable();

    // Fake only timer APIs so Promise/microtask-based TestBed work stays real.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await openDrawerUnderFakeTimers(fixture);
    await vi.advanceTimersByTimeAsync(DRAWER_ANIMATE_DURATION);
    fixture.detectChanges();

    drawerNavMenu(fixture).linkSelect.emit(requireNavLink());
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(DRAWER_ANIMATE_DURATION);
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.directive(NzDrawerComponent)),
    ).toBeNull();
  });

  it('remounts an open drawer when menu opens during close', async () => {
    const fixture = TestBed.createComponent(ShellComponent);
    await fixture.whenStable();

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await openDrawerUnderFakeTimers(fixture);
    await vi.advanceTimersByTimeAsync(DRAWER_ANIMATE_DURATION);
    fixture.detectChanges();

    const previous = queryDrawer(fixture);

    drawerNavMenu(fixture).linkSelect.emit(requireNavLink());
    fixture.detectChanges();

    emitMenuOpen(fixture);
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(DRAWER_ANIMATE_DURATION);
    fixture.detectChanges();

    const next = queryDrawer(fixture);
    expect(next).not.toBe(previous);
    expect(next.nzVisible).toBe(true);
  });

  it('renders a busy main without a page heading while the dictionary is not ready', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        ShellComponent,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
      providers: [
        provideRouter(appRoutes),
        provideLanguage({ dictionaryReady: false, loadFailed: false }),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ShellComponent);
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();

    const main = fixture.debugElement.query(By.css('[role="main"]'));
    expect(main.attributes['aria-busy']).toBe('true');
    expect(fixture.debugElement.query(By.css('h1'))).toBeNull();
  });

  it('renders the page heading while switching', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        ShellComponent,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
      providers: [
        provideRouter(appRoutes),
        provideLanguage({
          dictionaryReady: true,
          switching: true,
          loadFailed: false,
        }),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ShellComponent);
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();

    const heading = fixture.debugElement.query(By.css('h1'));
    expect(heading).toBeTruthy();
    expect(heading.nativeElement.textContent.trim()).toBe('Home');
  });
});

function queryDrawer(
  fixture: ComponentFixture<ShellComponent>,
): NzDrawerComponent {
  const drawer = fixture.debugElement.query(By.directive(NzDrawerComponent));
  if (!drawer) {
    throw new Error('drawer not found');
  }
  return drawer.injector.get(NzDrawerComponent);
}

function drawerNavMenu(
  fixture: ComponentFixture<ShellComponent>,
): NavMenuComponent {
  const drawer = fixture.debugElement.query(By.directive(NzDrawerComponent));
  if (!drawer) {
    throw new Error('drawer not found');
  }
  const menu = drawer.query(By.directive(NavMenuComponent));
  if (!menu) {
    throw new Error('drawer nav-menu not found');
  }
  return menu.injector.get(NavMenuComponent);
}

function requireNavLink() {
  const link = NAV_LINKS[0];
  if (!link) {
    throw new Error('NAV_LINKS entry not found');
  }
  return link;
}

function emitMenuOpen(fixture: ComponentFixture<ShellComponent>): void {
  const header = fixture.debugElement.query(By.directive(HeaderComponent));
  if (!header) {
    throw new Error('header not found');
  }
  header.injector.get(HeaderComponent).menuOpen.emit();
}

/**
 * Open under fake timers. Uses detectChanges instead of whenStable because
 * whenStable can hang while setTimeout is faked (C12).
 */
async function openDrawerUnderFakeTimers(
  fixture: ComponentFixture<ShellComponent>,
): Promise<void> {
  fixture.detectChanges();
  emitMenuOpen(fixture);
  fixture.detectChanges();
}
