import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NzMenuDirective } from 'ng-zorro-antd/menu';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { NavLink } from '../layout.types';
import { NavMenuComponent } from './nav-menu';
import { TRANSLOCO_TESTING } from '../../i18n/testing-langs';

const LINKS: readonly NavLink[] = [
  { labelKey: 'layout.nav.home', path: '/' },
  { labelKey: 'layout.nav.about', path: '/about' },
];

const VISIBLE_LABELS = ['Home', 'About'] as const;

describe('NavMenuComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NavMenuComponent,
        TranslocoTestingModule.forRoot(TRANSLOCO_TESTING),
      ],
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
      expect(anchors[index].nativeElement.textContent.trim()).toBe(
        VISIBLE_LABELS[index],
      );
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

  it('renders skeleton placeholders instead of links and sets aria-busy on the nav while pending', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        NavMenuComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: { layout: { nav: { main: '' } } } },
          preloadLangs: true,
          translocoConfig: {
            availableLangs: ['en'],
            defaultLang: 'en',
            // Empty values are otherwise treated as missing and return the key.
            missingHandler: { allowEmpty: true, logMissingKey: false },
          },
        }),
      ],
      providers: [provideRouter([{ path: '**', children: [] }])],
    }).compileComponents();

    const fixture = TestBed.createComponent(NavMenuComponent);
    fixture.componentRef.setInput('links', LINKS);
    fixture.componentRef.setInput('mode', 'horizontal');
    fixture.componentRef.setInput('pending', true);
    await fixture.whenStable();

    const nav = fixture.debugElement.query(By.css('nav'));
    expect(nav.attributes['aria-busy']).toBe('true');
    expect(nav.nativeElement.hasAttribute('aria-label')).toBe(false);
    expect(fixture.debugElement.queryAll(By.css('a'))).toHaveLength(0);
    expect(
      fixture.debugElement.queryAll(By.css('[aria-hidden="true"]')).length,
    ).toBeGreaterThan(0);
  });
});
