import { test, expect } from '@playwright/test';

test('i18n-switch-language', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Home');
  await expect(
    page.getByRole('banner').getByRole('link', { name: 'Registry' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Polski' }).click();

  await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Strona główna',
  );
  await expect(
    page.getByRole('banner').getByRole('link', { name: 'Rejestr' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'English' })).toBeVisible();
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(
    page.getByRole('button', { name: 'Przełącz na ciemny motyw' }),
  ).toBeVisible();
  await expect(page.getByLabel('Numer rejestracyjny')).toBeVisible();

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Strona główna',
  );
  await expect(
    page.getByRole('banner').getByRole('link', { name: 'Rejestr' }),
  ).toBeVisible();
});

test('i18n-switch-language-mobile', { tag: '@mobile' }, async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Polski' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
  await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible();

  await page.getByRole('button', { name: 'Menu' }).click();
  const aboutInDrawer = page.getByRole('link', { name: 'O aplikacji' });
  await expect(aboutInDrawer).toBeVisible();
  await aboutInDrawer.click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'O aplikacji',
  );

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'O aplikacji',
  );
});

test('i18n-first-load-skeleton', { tag: '@desktop' }, async ({ page }) => {
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route('**/i18n/en.json', async (route) => {
    await gate;
    await route.continue();
  });

  const navigation = page.goto('/');
  const banner = page.getByRole('banner');
  const nav = banner.getByRole('navigation');
  await expect(nav).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('main')).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(0);
  await expect(nav.getByRole('link')).toHaveCount(0);

  release();
  await navigation;
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Home');
  await expect(nav).not.toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('main')).not.toHaveAttribute('aria-busy', 'true');
});

test('i18n-active-dictionary-once', { tag: '@desktop' }, async ({ page }) => {
  const dictionaryRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname === '/i18n/en.json') {
      dictionaryRequests.push(url.pathname);
    }
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Home');
  expect(dictionaryRequests).toHaveLength(1);

  const preload = await page.evaluate(() => {
    const links = Array.from(
      document.querySelectorAll('link[rel="preload"][as="fetch"]'),
    );
    if (links.length !== 1) {
      return { count: links.length, href: null, crossOrigin: null };
    }
    const link = links[0] as HTMLLinkElement;
    return {
      count: 1,
      href: link.getAttribute('href'),
      crossOrigin: link.crossOrigin,
    };
  });
  expect(preload).toEqual({
    count: 1,
    href: 'i18n/en.json',
    crossOrigin: 'anonymous',
  });
});
