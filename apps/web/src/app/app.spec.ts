import { TestBed } from '@angular/core/testing';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { MoonOutline, SunOutline } from '@ant-design/icons-angular/icons';

import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideNzIcons([SunOutline, MoonOutline])],
    }).compileComponents();
  });

  it('renders the theme switcher', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-theme-switcher')).not.toBeNull();
  });
});
