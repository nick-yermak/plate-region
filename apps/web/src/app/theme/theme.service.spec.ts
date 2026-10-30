import { TestBed } from '@angular/core/testing';
import { STORAGE_KEYS } from '../shared/storage/storage.constants';
import { StorageService } from '../shared/storage/storage.service';
import { DARK_SCHEME_QUERY, THEME_LINK_IDS } from './theme.constants';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  type FakeMql = MediaQueryList & {
    matches: boolean;
    fire: (matches: boolean) => void;
  };

  let mql: FakeMql;
  let matchMediaMock: ReturnType<typeof vi.fn>;

  function installThemeLinks(): void {
    const light = document.createElement('link');
    light.id = THEME_LINK_IDS.light;
    light.rel = 'stylesheet';
    light.href = 'light.css';
    light.media = '(prefers-color-scheme: light)';
    const dark = document.createElement('link');
    dark.id = THEME_LINK_IDS.dark;
    dark.rel = 'stylesheet';
    dark.href = 'dark.css';
    dark.media = '(prefers-color-scheme: dark)';
    document.head.append(light, dark);
  }

  function stubMatchMedia(matches: boolean): FakeMql {
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    const fake = {
      matches,
      media: DARK_SCHEME_QUERY,
      onchange: null,
      addEventListener: (
        type: string,
        listener: EventListenerOrEventListenerObject,
      ) => {
        if (type === 'change' && typeof listener === 'function') {
          listeners.add(listener as (event: MediaQueryListEvent) => void);
        }
      },
      removeEventListener: (
        type: string,
        listener: EventListenerOrEventListenerObject,
      ) => {
        if (type === 'change' && typeof listener === 'function') {
          listeners.delete(listener as (event: MediaQueryListEvent) => void);
        }
      },
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
      fire: (next: boolean) => {
        fake.matches = next;
        const event = {
          matches: next,
          media: DARK_SCHEME_QUERY,
        } as MediaQueryListEvent;
        for (const listener of listeners) {
          listener(event);
        }
      },
    } as FakeMql;
    matchMediaMock = vi.fn(() => fake);
    vi.stubGlobal('matchMedia', matchMediaMock);
    return fake;
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    installThemeLinks();
    mql = stubMatchMedia(false);
    TestBed.configureTestingModule({
      providers: [StorageService],
    });
  });

  afterEach(() => {
    document.getElementById(THEME_LINK_IDS.light)?.remove();
    document.getElementById(THEME_LINK_IDS.dark)?.remove();
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('defaults to light when there is no stored choice and the system is light', () => {
    mql.matches = false;
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('light');
  });

  it('uses dark when there is no stored choice and the system is dark', () => {
    mql.matches = true;
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('dark');
  });

  it('uses stored dark over a light system preference', () => {
    localStorage.setItem(STORAGE_KEYS.theme, 'dark');
    mql.matches = false;
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('dark');
  });

  it('ignores an invalid stored choice and follows the dark system preference', () => {
    localStorage.setItem(STORAGE_KEYS.theme, 'blue');
    mql.matches = true;
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('dark');
  });

  it('writes nothing to storage on creation', () => {
    localStorage.setItem(STORAGE_KEYS.theme, 'dark');
    mql.matches = false;
    TestBed.inject(ThemeService);
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe('dark');
  });

  it('follows a system change from light to dark when there is no stored choice', () => {
    mql.matches = false;
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('light');
    mql.fire(true);
    expect(service.theme()).toBe('dark');
  });

  it('keeps a stored dark choice when the system changes to light', () => {
    localStorage.setItem(STORAGE_KEYS.theme, 'dark');
    mql.matches = true;
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('dark');
    mql.fire(false);
    expect(service.theme()).toBe('dark');
  });

  it('setTheme dark forces the dark link and stores the choice', () => {
    mql.matches = false;
    const service = TestBed.inject(ThemeService);
    service.setTheme('dark');
    expect(
      (document.getElementById(THEME_LINK_IDS.dark) as HTMLLinkElement | null)
        ?.media,
    ).toBe('all');
    expect(
      (document.getElementById(THEME_LINK_IDS.light) as HTMLLinkElement | null)
        ?.media,
    ).toBe('not all');
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe('dark');
    expect(service.theme()).toBe('dark');
  });

  it('setTheme light forces the light link under a dark system preference', () => {
    mql.matches = true;
    const service = TestBed.inject(ThemeService);
    service.setTheme('light');
    expect(
      (document.getElementById(THEME_LINK_IDS.light) as HTMLLinkElement | null)
        ?.media,
    ).toBe('all');
    expect(
      (document.getElementById(THEME_LINK_IDS.dark) as HTMLLinkElement | null)
        ?.media,
    ).toBe('not all');
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe('light');
    expect(service.theme()).toBe('light');
  });

  it('toggle from light stores and applies dark', () => {
    mql.matches = false;
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('light');
    service.toggle();
    expect(service.theme()).toBe('dark');
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe('dark');
  });
});
