import { test, expect, type Page } from '@playwright/test';

const lightBg = 'rgb(255, 255, 255)';
const darkBg = 'rgb(0, 0, 0)';

const closedHiddenByProject = {
  desktop: { navigation: 1, tabPresses: 10 },
  mobile: { navigation: 0, tabPresses: 7 },
} as const;

async function bodyBackground(page: Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

async function activeElementInOverlay(page: Page): Promise<boolean> {
  return page.evaluate(
    () => !!document.activeElement?.closest('.cdk-overlay-container'),
  );
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
  await expect(closeButton).toBeVisible();
  const aboutInDrawer = page.getByRole('link', { name: 'About' });
  await expect(aboutInDrawer).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Close' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.getByRole('button', { name: 'Close' })).toBeVisible();
  await aboutInDrawer.click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('About');
  await expect(page.getByRole('button', { name: 'Close' })).toHaveCount(0);
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

test(
  'shell-drawer-closed-hidden',
  { tag: ['@desktop', '@mobile'] },
  async ({ page }, testInfo) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Close' })).toHaveCount(0);

    const project = testInfo.project.name as keyof typeof closedHiddenByProject;
    const expected = closedHiddenByProject[project];
    if (!expected) {
      throw new Error(`missing closed-hidden expectations for ${project}`);
    }

    await expect(page.getByRole('navigation')).toHaveCount(expected.navigation);

    for (let i = 0; i < expected.tabPresses; i++) {
      await page.keyboard.press('Tab');
      expect(await activeElementInOverlay(page)).toBe(false);
    }
  },
);

test(
  'shell-drawer-hidden-after-close',
  { tag: '@mobile' },
  async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByRole('button', { name: 'Close' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Close' })).toHaveCount(0);
    await expect(page.getByRole('navigation')).toHaveCount(0);

    for (let i = 0; i < 7; i++) {
      await page.keyboard.press('Tab');
      expect(await activeElementInOverlay(page)).toBe(false);
    }
  },
);

test('shell-drawer-reopen-focus', { tag: '@mobile' }, async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.getByRole('button', { name: 'Close' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Menu' })).toBeFocused();

  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.getByRole('button', { name: 'Close' })).toBeFocused();
  expect(await activeElementInOverlay(page)).toBe(true);

  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    expect(await activeElementInOverlay(page)).toBe(true);
  }
});

test('shell-drawer-back-navigation', { tag: '@mobile' }, async ({ page }) => {
  await page.goto('/about');
  await page
    .getByRole('banner')
    .getByRole('link', { name: 'PlateRegion' })
    .click();
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.getByRole('button', { name: 'Close' })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole('button', { name: 'Close' })).toHaveCount(0);
  // Wait for the library close() timer (started on detachments) to restore focus.
  await expect(page.getByRole('button', { name: 'Menu' })).toBeFocused();

  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.getByRole('button', { name: 'Close' })).toBeFocused();
  expect(await activeElementInOverlay(page)).toBe(true);

  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    expect(await activeElementInOverlay(page)).toBe(true);
  }
});

async function outlineStyleOfActive(page: Page): Promise<string> {
  return page.evaluate(
    () => getComputedStyle(document.activeElement!).outlineStyle,
  );
}

async function outlineStyleOfActiveMenuItem(page: Page): Promise<string> {
  return page.evaluate(() => {
    const item = document.activeElement?.closest('.ant-menu-item');
    if (!item) {
      throw new Error('active element is not inside .ant-menu-item');
    }
    return getComputedStyle(item).outlineStyle;
  });
}

test('shell-focus-visible', { tag: '@mobile' }, async ({ page }) => {
  await page.goto('/');

  const burger = page.getByRole('button', { name: 'Menu' });
  for (let i = 0; i < 10; i++) {
    if (await burger.evaluate((el) => el === document.activeElement)) {
      break;
    }
    await page.keyboard.press('Tab');
  }
  await expect(burger).toBeFocused();
  expect(await outlineStyleOfActive(page)).toBe('solid');

  await page.keyboard.press('Enter');
  const closeButton = page.getByRole('button', { name: 'Close' });
  await expect(closeButton).toBeFocused();
  expect(await outlineStyleOfActive(page)).toBe('solid');

  await page.keyboard.press('Tab');
  expect(await outlineStyleOfActiveMenuItem(page)).toBe('solid');

  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Close' })).toHaveCount(0);

  const themeToggle = page
    .getByRole('banner')
    .getByRole('button', { name: /Switch to (light|dark) theme/ });
  await themeToggle.click();
  expect(await outlineStyleOfActive(page)).toBe('none');
});
