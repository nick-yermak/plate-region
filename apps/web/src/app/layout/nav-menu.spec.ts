import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NzMenuDirective } from 'ng-zorro-antd/menu';

import { NavLink } from './layout.types';
import { NavMenuComponent } from './nav-menu';

const LINKS: readonly NavLink[] = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
];

describe('NavMenuComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavMenuComponent],
      providers: [provideRouter([{ path: '**', children: [] }])],
    }).compileComponents();
  });

  it('renders one item per link', async () => {
    const fixture = TestBed.createComponent(NavMenuComponent);
    fixture.componentRef.setInput('links', LINKS);
    fixture.componentRef.setInput('mode', 'horizontal');
    await fixture.whenStable();

    const menu = fixture.debugElement.query(By.directive(NzMenuDirective));
    const anchors = menu.queryAll(By.css('a'));
    expect(anchors).toHaveLength(LINKS.length);
    for (const [index, link] of LINKS.entries()) {
      expect(anchors[index].nativeElement.textContent.trim()).toBe(link.label);
      expect(anchors[index].nativeElement.getAttribute('href')).toBe(link.path);
    }
  });

  it('passes mode and theme to NzMenuDirective', async () => {
    const fixture = TestBed.createComponent(NavMenuComponent);
    fixture.componentRef.setInput('links', LINKS);
    fixture.componentRef.setInput('mode', 'inline');
    fixture.componentRef.setInput('theme', 'dark');
    await fixture.whenStable();

    const menu = fixture.debugElement
      .query(By.directive(NzMenuDirective))
      .injector.get(NzMenuDirective);
    expect(menu.nzMode).toBe('inline');
    expect(menu.nzTheme).toBe('dark');
  });

  it('emits linkSelect with the clicked link', async () => {
    const fixture = TestBed.createComponent(NavMenuComponent);
    fixture.componentRef.setInput('links', LINKS);
    fixture.componentRef.setInput('mode', 'horizontal');
    await fixture.whenStable();

    const emissions: NavLink[] = [];
    fixture.componentInstance.linkSelect.subscribe((link) => {
      emissions.push(link);
    });

    const target = LINKS[1];
    if (!target) {
      throw new Error('LINKS entry not found');
    }
    const anchor = fixture.debugElement
      .queryAll(By.css('a'))
      .find((el) => el.nativeElement.getAttribute('href') === target.path);
    if (!anchor) {
      throw new Error(`link for ${target.path} not found`);
    }
    anchor.nativeElement.click();
    await fixture.whenStable();

    expect(emissions).toEqual([target]);
  });
});
