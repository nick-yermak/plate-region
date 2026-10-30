import { TestBed } from '@angular/core/testing';
import { STORAGE_KEYS } from '../shared/storage-keys';
import { THEME_LINK_ID } from './theme.constants';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  const addedLinks = new Set<HTMLLinkElement>();

  function themeLinks(): HTMLLinkElement[] {
    return Array.from(document.head.querySelectorAll('link[rel="stylesheet"]'));
  }

  function installPrThemeLink(href: string): HTMLLinkElement {
    const link = document.createElement('link');
    link.id = THEME_LINK_ID;
    link.rel = 'stylesheet';
    link.href = href;
    document.head.append(link);
    addedLinks.add(link);
    return link;
  }

  function appendedSince(before: HTMLLinkElement[]): HTMLLinkElement[] {
    const beforeSet = new Set(before);
    return themeLinks().filter((link) => !beforeSet.has(link));
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    document.documentElement.classList.remove('light', 'dark');
    for (const link of addedLinks) {
      link.remove();
    }
    addedLinks.clear();
    for (const link of themeLinks()) {
      if (
        link.id === THEME_LINK_ID ||
        /(?:^|\/)(?:light|dark)\.css$/.test(link.href)
      ) {
        link.remove();
      }
    }
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('reads dark from the html class at creation', () => {
    document.documentElement.classList.add('dark');
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('dark');
  });

  it('defaults to light when html has no theme class', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('light');
  });

  it('writes nothing to localStorage on creation', () => {
    document.documentElement.classList.add('dark');
    TestBed.configureTestingModule({});
    TestBed.inject(ThemeService);
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBeNull();
  });

  it('stores dark under pr-theme after setTheme load', () => {
    document.documentElement.classList.add('light');
    installPrThemeLink('light.css');
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);
    const before = themeLinks();
    service.setTheme('dark');
    const [pending] = appendedSince(before);
    expect(pending).toBeTruthy();
    addedLinks.add(pending);
    pending.dispatchEvent(new Event('load'));
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe('dark');
  });

  it('stores dark under pr-theme after toggle load from light', () => {
    document.documentElement.classList.add('light');
    installPrThemeLink('light.css');
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);
    const before = themeLinks();
    service.toggle();
    const [pending] = appendedSince(before);
    expect(pending).toBeTruthy();
    addedLinks.add(pending);
    pending.dispatchEvent(new Event('load'));
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe('dark');
  });

  it('appends a dark.css link while keeping the old link, class and storage until load', () => {
    document.documentElement.classList.add('light');
    const oldLink = installPrThemeLink('light.css');
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);
    const before = themeLinks();
    service.setTheme('dark');
    const appended = appendedSince(before);
    expect(appended).toHaveLength(1);
    const pending = appended[0];
    addedLinks.add(pending);
    expect(pending.getAttribute('href')).toBe('dark.css');
    expect(pending.rel).toBe('stylesheet');
    expect(document.getElementById(THEME_LINK_ID)).toBe(oldLink);
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBeNull();
  });

  it('on load removes the old link, ids the new one, switches the class and updates the signal', () => {
    document.documentElement.classList.add('light');
    const oldLink = installPrThemeLink('light.css');
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);
    const before = themeLinks();
    service.setTheme('dark');
    const [pending] = appendedSince(before);
    expect(pending).toBeTruthy();
    addedLinks.add(pending);
    pending.dispatchEvent(new Event('load'));
    expect(document.contains(oldLink)).toBe(false);
    expect(pending.id).toBe(THEME_LINK_ID);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
    expect(service.theme()).toBe('dark');
  });

  it('ignores toggle while a switch is pending', () => {
    document.documentElement.classList.add('light');
    installPrThemeLink('light.css');
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);
    const before = themeLinks();
    service.setTheme('dark');
    service.toggle();
    const appended = appendedSince(before);
    expect(appended).toHaveLength(1);
    addedLinks.add(appended[0]);
  });

  it('on error removes the new link and leaves theme, class and storage unchanged', () => {
    document.documentElement.classList.add('light');
    installPrThemeLink('light.css');
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);
    const before = themeLinks();
    service.setTheme('dark');
    const appended = appendedSince(before);
    expect(appended).toHaveLength(1);
    const pending = appended[0];
    addedLinks.add(pending);
    pending.dispatchEvent(new Event('error'));
    expect(document.contains(pending)).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBeNull();
    expect(service.theme()).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('setTheme with the current theme appends no link and writes nothing', () => {
    document.documentElement.classList.add('light');
    installPrThemeLink('light.css');
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);
    const before = themeLinks();
    service.setTheme('light');
    expect(appendedSince(before)).toHaveLength(0);
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBeNull();
    expect(service.theme()).toBe('light');
  });
});
