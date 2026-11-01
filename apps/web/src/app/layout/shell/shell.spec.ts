import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { NzDrawerComponent } from 'ng-zorro-antd/drawer';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ComponentFixture, TestBed } from '@angular/core/testing';

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

  it('passes NAV_LINKS to the header', async () => {
    const fixture = TestBed.createComponent(ShellComponent);
    await fixture.whenStable();

    const header = fixture.debugElement
      .query(By.directive(HeaderComponent))
      .injector.get(HeaderComponent);
    expect(header.links()).toEqual(NAV_LINKS);
  });

  it('opens the drawer when header emits menuOpen', async () => {
    const fixture = TestBed.createComponent(ShellComponent);
    await openDrawer(fixture);

    const drawer = fixture.debugElement.query(By.directive(NzDrawerComponent));
    if (!drawer) {
      throw new Error('drawer not found');
    }
    expect(drawer.injector.get(NzDrawerComponent).nzVisible).toBe(true);
  });

  it('closes the drawer when drawer nav-menu emits linkSelect', async () => {
    const fixture = TestBed.createComponent(ShellComponent);
    await openDrawer(fixture);

    const drawer = fixture.debugElement.query(By.directive(NzDrawerComponent));
    if (!drawer) {
      throw new Error('drawer not found');
    }
    expect(drawer.injector.get(NzDrawerComponent).nzVisible).toBe(true);

    const drawerMenu = drawer.query(By.directive(NavMenuComponent));
    if (!drawerMenu) {
      throw new Error('drawer nav-menu not found');
    }
    const link = NAV_LINKS[0];
    if (!link) {
      throw new Error('NAV_LINKS entry not found');
    }
    drawerMenu.injector.get(NavMenuComponent).linkSelect.emit(link);
    await fixture.whenStable();

    expect(drawer.injector.get(NzDrawerComponent).nzVisible).toBe(false);
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

async function openDrawer(
  fixture: ComponentFixture<ShellComponent>,
): Promise<void> {
  await fixture.whenStable();
  const header = fixture.debugElement.query(By.directive(HeaderComponent));
  if (!header) {
    throw new Error('header not found');
  }
  header.injector.get(HeaderComponent).menuOpen.emit();
  await fixture.whenStable();
}
