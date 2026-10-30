import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MoonOutline, SunOutline } from '@ant-design/icons-angular/icons';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { ThemeService } from './theme.service';
import { ThemeToggleComponent } from './theme-toggle';

describe('ThemeToggleComponent', () => {
  it('shows Switch to dark theme with the moon icon when the theme is light', async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeToggleComponent],
      providers: [
        {
          provide: ThemeService,
          useValue: {
            theme: signal('light').asReadonly(),
            toggle: vi.fn(),
            setTheme: vi.fn(),
          },
        },
        provideNzIcons([SunOutline, MoonOutline]),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ThemeToggleComponent);
    await fixture.whenStable();

    const button = fixture.debugElement.query(By.css('button'));
    expect(button).toBeTruthy();
    expect(button.attributes['aria-label']).toBe('Switch to dark theme');

    const icon = fixture.debugElement.query(By.css('nz-icon, [nz-icon]'));
    expect(icon).toBeTruthy();
    const nzType =
      icon.attributes['nzType'] ??
      icon.attributes['nztype'] ??
      icon.componentInstance?.nzType?.();
    expect(nzType).toBe('moon');
  });

  it('calls toggle on the theme service when clicked', async () => {
    const toggle = vi.fn();
    await TestBed.configureTestingModule({
      imports: [ThemeToggleComponent],
      providers: [
        {
          provide: ThemeService,
          useValue: {
            theme: signal('light').asReadonly(),
            toggle,
            setTheme: vi.fn(),
          },
        },
        provideNzIcons([SunOutline, MoonOutline]),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ThemeToggleComponent);
    await fixture.whenStable();

    const button = fixture.debugElement.query(By.css('button'));
    expect(button).toBeTruthy();
    button.nativeElement.click();
    await fixture.whenStable();
    expect(toggle).toHaveBeenCalled();
  });
});
