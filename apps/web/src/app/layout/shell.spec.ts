import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { NzDrawerComponent } from 'ng-zorro-antd/drawer';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShellComponent } from './shell';
import { appRoutes } from '../app.routes';
import { HeaderComponent } from './header';
import { NavMenuComponent } from './nav-menu';
import { NAV_LINKS } from './layout.constants';

describe('ShellComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [provideRouter(appRoutes)],
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
