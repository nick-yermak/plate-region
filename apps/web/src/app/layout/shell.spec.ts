import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { NzMenuDirective } from 'ng-zorro-antd/menu';
import { NzDrawerComponent } from 'ng-zorro-antd/drawer';
import { DebugElement, getDebugNode } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MenuOutline,
  MoonOutline,
  SunOutline,
} from '@ant-design/icons-angular/icons';

import { ShellComponent } from './shell';
import { appRoutes } from '../app.routes';
import { NAV_LINKS } from './layout.constants';

describe('ShellComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter(appRoutes),
        provideNzIcons([SunOutline, MoonOutline, MenuOutline]),
      ],
    }).compileComponents();
  });

  it('renders one horizontal menu item per NAV_LINKS entry', async () => {
    const fixture = TestBed.createComponent(ShellComponent);
    await fixture.whenStable();

    const hostMenu = fixture.debugElement
      .queryAll(By.directive(NzMenuDirective))
      .find((el) => el.injector.get(NzMenuDirective).nzMode === 'horizontal');
    if (!hostMenu) {
      throw new Error('horizontal menu not found');
    }

    const links = hostMenu.queryAll(By.css('a'));
    expect(links).toHaveLength(NAV_LINKS.length);
    for (const [index, nav] of NAV_LINKS.entries()) {
      expect(links[index].nativeElement.textContent.trim()).toBe(nav.label);
      expect(links[index].nativeElement.getAttribute('href')).toBe(nav.path);
    }
  });

  it('opens the drawer when the burger is clicked', async () => {
    const fixture = TestBed.createComponent(ShellComponent);
    await fixture.whenStable();

    const burger = fixture.debugElement.query(
      By.css('button[aria-label="Menu"]'),
    );
    if (!burger) {
      throw new Error('burger not found');
    }
    burger.nativeElement.click();
    await fixture.whenStable();

    const drawer = fixture.debugElement.query(By.directive(NzDrawerComponent));
    if (!drawer) {
      throw new Error('drawer not found');
    }
    expect(drawer.componentInstance.nzVisible).toBe(true);
  });

  it('closes the drawer when its menu emits nzClick', async () => {
    const fixture = TestBed.createComponent(ShellComponent);
    await fixture.whenStable();

    const burger = fixture.debugElement.query(
      By.css('button[aria-label="Menu"]'),
    );
    if (!burger) {
      throw new Error('burger not found');
    }
    burger.nativeElement.click();
    await fixture.whenStable();

    const drawer = fixture.debugElement.query(By.directive(NzDrawerComponent));
    if (!drawer) {
      throw new Error('drawer not found');
    }
    expect(drawer.componentInstance.nzVisible).toBe(true);

    const menu = drawerMenuDirective(fixture);
    const item = menu.listOfNzMenuItemDirective.get(0);
    if (!item) {
      throw new Error('drawer menu item not found');
    }
    menu.nzClick.emit(item);
    await fixture.whenStable();

    expect(drawer.componentInstance.nzVisible).toBe(false);
  });
});

function drawerMenuDirective(
  fixture: ComponentFixture<ShellComponent>,
): NzMenuDirective {
  const drawer = fixture.debugElement.query(By.directive(NzDrawerComponent));
  const inDrawer = drawer?.query(By.directive(NzMenuDirective));
  if (inDrawer) {
    return inDrawer.injector.get(NzMenuDirective);
  }

  const inline = fixture.debugElement
    .queryAll(By.directive(NzMenuDirective))
    .map((el) => el.injector.get(NzMenuDirective))
    .find((menu) => menu.nzMode === 'inline');
  if (inline) {
    return inline;
  }

  const host = document.querySelector('.ant-drawer [nz-menu]');
  const node = host && getDebugNode(host);
  if (node instanceof DebugElement) {
    return node.injector.get(NzMenuDirective);
  }

  throw new Error('drawer menu not found');
}
