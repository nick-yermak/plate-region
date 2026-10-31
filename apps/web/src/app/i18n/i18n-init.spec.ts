import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

import { resolveLanguage } from '../language/language';

const scriptPath = resolve(process.cwd(), 'apps/web/public/js/i18n-init.js');

describe('i18n-init', () => {
  let scriptText: string;

  beforeAll(() => {
    try {
      scriptText = readFileSync(scriptPath, 'utf8');
    } catch (error) {
      const wrapped = new Error(
        `i18n-init.js not found. Tried path: ${scriptPath}. ${(error as Error).message}`,
      ) as Error & { cause: unknown };
      wrapped.cause = error;
      throw wrapped;
    }
  });

  beforeEach(() => {
    // Not 'en': a no-op stub would leave lang unchanged and pass en expectations by accident.
    document.documentElement.lang = 'und';
    document.head
      .querySelectorAll('link[rel="preload"]')
      .forEach((node) => node.remove());
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it.each([
    { stored: 'pl', nav: 'en-US', expected: 'pl' as const },
    { stored: 'en', nav: 'pl-PL', expected: 'en' as const },
    { stored: 'xx', nav: 'pl-PL', expected: 'pl' as const },
    { stored: null, nav: 'PL', expected: 'pl' as const },
    { stored: null, nav: 'en-GB', expected: 'en' as const },
    { stored: null, nav: '', expected: 'en' as const },
  ])(
    'sets html lang like resolveLanguage for stored $stored and navigator $nav',
    ({ stored, nav, expected }) => {
      expect(resolveLanguage(stored, nav)).toBe(expected);
      if (stored === null) {
        localStorage.removeItem('pr-lang');
      } else {
        localStorage.setItem('pr-lang', stored);
      }
      vi.stubGlobal('navigator', { language: nav });

      new Function(scriptText)();
      expect(document.documentElement.lang).toBe(expected);
    },
  );

  it('adds one preload link with href i18n/<lang>.json, as fetch and crossorigin anonymous', () => {
    localStorage.setItem('pr-lang', 'en');
    vi.stubGlobal('navigator', { language: 'en-US' });

    new Function(scriptText)();
    const links = document.head.querySelectorAll(
      'link[rel="preload"][as="fetch"]',
    );
    expect(links).toHaveLength(1);
    const link = links[0] as HTMLLinkElement;
    expect(link.getAttribute('href')).toBe('i18n/en.json');
    expect(link.crossOrigin).toBe('anonymous');
  });
});
