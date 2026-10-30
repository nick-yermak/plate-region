import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MoonOutline, SunOutline } from '@ant-design/icons-angular/icons';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { ThemeService } from './theme.service';
import { ThemeSwitcherComponent } from './theme-switcher';
import { ThemeToggleComponent } from './theme-toggle';

describe('ThemeSwitcherComponent', () => {
  async function createSwitcher(setTheme = vi.fn()) {
    await TestBed.configureTestingModule({
      imports: [ThemeSwitcherComponent],
      providers: [
        {
          provide: ThemeService,
          useValue: {
            theme: signal('light').asReadonly(),
            setTheme,
          },
        },
        provideNzIcons([SunOutline, MoonOutline]),
      ],
    }).compileComponents();
    return {
      fixture: TestBed.createComponent(ThemeSwitcherComponent),
      setTheme,
    };
  }

  it('renders the toggle labelled Switch to dark theme when the service theme is light', async () => {
    const { fixture } = await createSwitcher();
    await fixture.whenStable();

    const button = fixture.debugElement.query(By.css('button'));
    expect(button).toBeTruthy();
    expect(button.attributes['aria-label']).toBe('Switch to dark theme');
  });

  it('calls setTheme with dark when the toggle emits themeChange', async () => {
    const { fixture, setTheme } = await createSwitcher();
    await fixture.whenStable();

    const toggle = fixture.debugElement.query(
      By.directive(ThemeToggleComponent),
    );
    toggle.componentInstance.themeChange.emit('dark');
    await fixture.whenStable();
    expect(setTheme).toHaveBeenCalledTimes(1);
    expect(setTheme).toHaveBeenCalledWith('dark');
  });
});
