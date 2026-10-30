import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { NavLink } from './layout.types';
import { HeaderComponent } from './header';
import { NavMenuComponent } from './nav-menu';

const LINKS: readonly NavLink[] = [
  { label: 'Home', path: '/' },
  { label: 'Registry', path: '/registry' },
];

@Component({
  imports: [HeaderComponent],
  template: `
    <app-header [links]="links" (menuOpen)="menuOpens = menuOpens + 1">
      <span class="projected-slot">projected</span>
    </app-header>
  `,
})
class HeaderHostComponent {
  readonly links = LINKS;
  menuOpens = 0;
}

describe('HeaderComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderHostComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the brand link to /', async () => {
    const fixture = TestBed.createComponent(HeaderHostComponent);
    await fixture.whenStable();

    const brand = fixture.debugElement
      .query(By.directive(HeaderComponent))
      .queryAll(By.css('a'))
      .find((el) => el.nativeElement.textContent.trim() === 'PlateRegion');
    if (!brand) {
      throw new Error('brand link not found');
    }
    expect(brand.nativeElement.getAttribute('href')).toBe('/');
  });

  it('emits menuOpen when the burger is clicked', async () => {
    const fixture = TestBed.createComponent(HeaderHostComponent);
    await fixture.whenStable();

    const header = fixture.debugElement.query(By.directive(HeaderComponent));
    const burger = header.query(By.css('button[aria-label="Menu"]'));
    if (!burger) {
      throw new Error('burger not found');
    }
    burger.nativeElement.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.menuOpens).toBe(1);
  });

  it('renders projected content in the actions group', async () => {
    const fixture = TestBed.createComponent(HeaderHostComponent);
    await fixture.whenStable();

    const projected = fixture.debugElement.query(
      By.css('.header-actions .projected-slot'),
    );
    expect(projected).toBeTruthy();
    expect(projected.nativeElement.textContent.trim()).toBe('projected');
  });

  it('passes links to NavMenuComponent', async () => {
    const fixture = TestBed.createComponent(HeaderHostComponent);
    await fixture.whenStable();

    const navMenu = fixture.debugElement
      .query(By.directive(NavMenuComponent))
      .injector.get(NavMenuComponent);
    expect(navMenu.links()).toEqual(LINKS);
  });
});
