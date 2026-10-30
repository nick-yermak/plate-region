import { test, expect, type Page } from '@playwright/test';

const lightBg = 'rgb(255, 255, 255)';
const darkBg = 'rgb(0, 0, 0)';

async function bodyBackground(page: Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

test('shell-desktop-nav', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/');
  const banner = page.getByRole('banner');

  await banner.getByRole('link', { name: 'Registry' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Registry');

  await banner.getByRole('link', { name: 'Charts' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Charts');

  await banner.getByRole('link', { name: 'About' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('About');

  await banner.getByRole('link', { name: 'Home' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Home');

  const routes: { path: string; heading: string }[] = [
    { path: '/', heading: 'Home' },
    { path: '/plate/WA12345', heading: 'Plate' },
    { path: '/voivodeship/mazowieckie', heading: 'Voivodeship' },
    { path: '/registry', heading: 'Registry' },
    { path: '/charts', heading: 'Charts' },
    { path: '/about', heading: 'About' },
  ];

  for (const route of routes) {
    await page.goto(route.path);
    await page.reload();
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      route.heading,
    );
  }
});

test('shell-mobile-burger', { tag: '@mobile' }, async ({ page }) => {
  await page.goto('/');
  const banner = page.getByRole('banner');
  const bannerLinks = banner.getByRole('link', {
    name: /^(Home|Registry|Charts|About)$/,
    includeHidden: true,
  });
  await expect(bannerLinks).toHaveCount(4);
  for (const link of await bannerLinks.all()) {
    await expect(link).toBeHidden();
  }

  await page.getByRole('button', { name: 'Menu' }).click();
  const closeButton = page.getByRole('button', { name: 'Close' });
  // Closed drawers stay in the DOM off-screen (transform); viewport is the open signal.
  await expect(closeButton).toBeInViewport();
  const aboutInDrawer = page.getByRole('link', { name: 'About' });
  await expect(aboutInDrawer).toBeInViewport();

  await page.keyboard.press('Escape');
  await expect(closeButton).not.toBeInViewport();

  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(closeButton).toBeInViewport();
  await aboutInDrawer.click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('About');
  await expect(closeButton).not.toBeInViewport();
});

test(
  'shell-theme-toggle',
  { tag: ['@desktop', '@mobile'] },
  async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    const toggle = page
      .getByRole('banner')
      .getByRole('button', { name: 'Switch to light theme' });
    await expect(toggle).toBeVisible();
    await expect.poll(() => bodyBackground(page)).toBe(darkBg);
    await toggle.click();
    await expect.poll(() => bodyBackground(page)).toBe(lightBg);
  },
);
