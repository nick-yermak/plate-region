import { test, expect, type Locator, type Page } from '@playwright/test';

const lightBg = 'rgb(255, 255, 255)';
const darkBg = 'rgb(0, 0, 0)';

const closedHiddenByProject = {
  desktop: { navigation: 1, tabPresses: 10 },
  mobile: { navigation: 0, tabPresses: 7 },
  tablet: { navigation: 0, tabPresses: 7 },
} as const;

async function bodyBackground(page: Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

async function activeElementInOverlay(page: Page): Promise<boolean> {
  return page.evaluate(
    () => !!document.activeElement?.closest('.cdk-overlay-container'),
  );
}

async function disableTransitions(page: Page): Promise<void> {
  await page.addStyleTag({
    content:
      '*,*::before,*::after{transition:none!important;animation:none!important}',
  });
}

async function readyHome(page: Page): Promise<void> {
  await page.goto('/');
  await expect(
    page.locator('[role="main"]:not([aria-busy="true"])'),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await disableTransitions(page);
}

async function boxOf(locator: Locator): Promise<{
  x: number;
  y: number;
  width: number;
  height: number;
}> {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('bounding box missing');
  }
  return box;
}

const homeLinkName = { en: 'Home', pl: 'Strona główna' } as const;

async function setLanguage(page: Page, language: 'en' | 'pl'): Promise<void> {
  const toPolish = page.getByRole('button', { name: 'Polski' });
  const toEnglish = page.getByRole('button', { name: 'English' });
  if (language === 'pl') {
    if (await toPolish.isVisible()) {
      await toPolish.click();
    }
    await expect(toEnglish).toBeVisible();
  } else if (await toEnglish.isVisible()) {
    await toEnglish.click();
    await expect(toPolish).toBeVisible();
  }
}

async function expectMenuCentred(banner: Locator): Promise<void> {
  const nav = banner.getByRole('navigation');
  await expect(nav).toBeVisible();
  const bannerBox = await boxOf(banner);
  const navBox = await boxOf(nav);
  expect(bannerBox.height).toBe(64);
  const offset = Math.abs(
    navBox.x + navBox.width / 2 - (bannerBox.x + bannerBox.width / 2),
  );
  expect(offset).toBeLessThanOrEqual(1);
}

function closedHiddenFor(project: string): {
  navigation: number;
  tabPresses: number;
} {
  const expected =
    closedHiddenByProject[project as keyof typeof closedHiddenByProject];
  if (!expected) {
    throw new Error(`missing closed-hidden expectations for ${project}`);
  }
  return expected;
}

test('header-divider', { tag: ['@desktop', '@mobile'] }, async ({ page }) => {
  const cases = [
    {
      colorScheme: 'light' as const,
      bodyBg: lightBg,
      divider: 'rgb(240, 240, 240)',
    },
    {
      colorScheme: 'dark' as const,
      bodyBg: darkBg,
      divider: 'rgb(48, 48, 48)',
    },
  ];
  for (const c of cases) {
    await page.emulateMedia({ colorScheme: c.colorScheme });
    await page.goto('/');
    await expect.poll(() => bodyBackground(page)).toBe(c.bodyBg);

    const banner = page.getByRole('banner');
    const metrics = await banner.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        height: el.getBoundingClientRect().height,
        borderBottomWidth: style.borderBottomWidth,
        borderBottomColor: style.borderBottomColor,
      };
    });
    expect(metrics.height).toBe(64);
    expect(metrics.borderBottomWidth).toBe('1px');
    expect(metrics.borderBottomColor).toBe(c.divider);
  }
});

test('header-divider-under-menu', { tag: '@desktop' }, async ({ page }) => {
  const cases: {
    width: number;
    language: 'en' | 'pl';
    colorScheme: 'light' | 'dark';
  }[] = [
    { width: 992, language: 'en', colorScheme: 'light' },
    { width: 992, language: 'pl', colorScheme: 'light' },
    { width: 1280, language: 'en', colorScheme: 'light' },
    { width: 1280, language: 'pl', colorScheme: 'light' },
    { width: 1280, language: 'en', colorScheme: 'dark' },
  ];

  for (const c of cases) {
    const label = `${c.width}px ${c.language} ${c.colorScheme}`;
    await page.emulateMedia({ colorScheme: c.colorScheme });
    await readyHome(page);
    await page.setViewportSize({ width: c.width, height: 800 });
    await setLanguage(page, c.language);

    const banner = page.getByRole('banner');
    const nav = banner.getByRole('navigation');
    await expect(nav, label).toBeVisible();

    const bannerBox = await boxOf(banner);
    const bannerBottom = bannerBox.y + bannerBox.height;
    const contentBottom = bannerBottom - 1;

    // Horizontal nz-menu exposes native list/listitem, not menu/menuitem.
    const menu = nav.getByRole('list');
    const menuBox = await boxOf(menu);
    expect
      .soft(
        menuBox.y + menuBox.height,
        `${label} menu ul bottom ≤ ${contentBottom}`,
      )
      .toBeLessThanOrEqual(contentBottom);

    const items = nav.getByRole('listitem');
    const itemCount = await items.count();
    for (let i = 0; i < itemCount; i++) {
      const itemBox = await boxOf(items.nth(i));
      expect
        .soft(
          itemBox.y + itemBox.height,
          `${label} listitem[${i}] bottom ≤ ${contentBottom}`,
        )
        .toBeLessThanOrEqual(contentBottom);
    }

    const selected = nav.getByRole('listitem').filter({
      has: page.getByRole('link', { name: homeLinkName[c.language] }),
    });
    await expect(selected, label).toBeVisible();
    const selectedBox = await boxOf(selected);
    expect
      .soft(
        selectedBox.y + selectedBox.height,
        `${label} selected bottom === ${contentBottom}`,
      )
      .toBe(contentBottom);

    const brandLink = banner.getByRole('link', {
      name: 'Tablicomat',
      exact: true,
    });
    const brandBox = await boxOf(brandLink);
    const gapWidth = menuBox.x - (brandBox.x + brandBox.width);
    expect(
      gapWidth,
      `${label} brand–menu gap ≥ 40px (got ${gapWidth})`,
    ).toBeGreaterThanOrEqual(40);

    const dividerY = bannerBottom - 1;
    await page.mouse.move(0, 0);
    const clipHeight = 1;
    const clipWidth = 40;
    const underMenu = await page.screenshot({
      clip: {
        x: Math.round(menuBox.x + menuBox.width / 2 - 20),
        y: dividerY,
        width: clipWidth,
        height: clipHeight,
      },
    });
    const underSelected = await page.screenshot({
      clip: {
        x: Math.round(selectedBox.x + selectedBox.width / 2 - 20),
        y: dividerY,
        width: clipWidth,
        height: clipHeight,
      },
    });
    const beside = await page.screenshot({
      clip: {
        x: Math.round((brandBox.x + brandBox.width + menuBox.x) / 2 - 20),
        y: dividerY,
        width: clipWidth,
        height: clipHeight,
      },
    });
    expect
      .soft(
        underMenu.equals(beside),
        `${label} under-menu divider pixels === beside`,
      )
      .toBe(true);
    expect
      .soft(
        underSelected.equals(beside),
        `${label} under-selected divider pixels === beside`,
      )
      .toBe(true);
  }
});

test(
  'content-padding-top',
  { tag: ['@desktop', '@mobile'] },
  async ({ page }) => {
    for (const path of ['/', '/registry'] as const) {
      await page.goto(path);
      const main = page.getByRole('main');
      await expect
        .poll(() => main.evaluate((el) => getComputedStyle(el).paddingTop))
        .toBe('24px');
    }
  },
);

test('header-burger-tablet', { tag: '@tablet' }, async ({ page }) => {
  await readyHome(page);
  await page.getByRole('button', { name: 'Polski' }).click();
  await expect(page.getByRole('button', { name: 'English' })).toBeVisible();

  const banner = page.getByRole('banner');
  await expect(banner.getByRole('button', { name: 'Menu' })).toBeVisible();

  const bannerLinks = banner.getByRole('link', {
    name: /^(Strona główna|Rejestr|Wykresy|O aplikacji)$/,
    includeHidden: true,
  });
  await expect(bannerLinks).toHaveCount(4);
  for (const link of await bannerLinks.all()) {
    await expect(link).toBeHidden();
  }

  await banner.getByRole('button', { name: 'Menu' }).click();
  await expect(page.getByRole('button', { name: 'Close' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'O aplikacji' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Close' })).toHaveCount(0);
});

test('header-menu-centred', { tag: '@desktop' }, async ({ page }) => {
  await readyHome(page);
  const banner = page.getByRole('banner');

  await expectMenuCentred(banner);
  await banner.getByRole('button', { name: 'Polski' }).click();
  await expect(banner.getByRole('button', { name: 'English' })).toBeVisible();
  await expectMenuCentred(banner);
});

test('header-threshold-fit-pl', { tag: '@desktop' }, async ({ page }) => {
  await readyHome(page);
  await page.setViewportSize({ width: 992, height: 800 });
  await page.getByRole('button', { name: 'Polski' }).click();
  await expect(page.getByRole('button', { name: 'English' })).toBeVisible();

  const banner = page.getByRole('banner');
  await expect(banner.getByRole('button', { name: 'Menu' })).toHaveCount(0);

  const nav = banner.getByRole('navigation');
  const links = nav.getByRole('link');
  await expect(links).toHaveCount(4);
  const tops = await links.evaluateAll((els) =>
    els.map((el) => el.getBoundingClientRect().top),
  );
  expect(new Set(tops.map((t) => Math.round(t * 10) / 10)).size).toBe(1);

  const brandLink = banner.getByRole('link', { name: 'Tablicomat' });
  await expect(brandLink).toBeVisible();
  const brandBox = await boxOf(brandLink);
  const navBox = await boxOf(nav);
  const englishBox = await boxOf(
    banner.getByRole('button', { name: 'English' }),
  );
  const bannerBox = await boxOf(banner);
  expect(bannerBox.height).toBe(64);
  expect(brandBox.x + brandBox.width).toBeLessThanOrEqual(navBox.x);
  expect(navBox.x + navBox.width).toBeLessThanOrEqual(englishBox.x);
});

test('header-burger-below-threshold', { tag: '@desktop' }, async ({ page }) => {
  await readyHome(page);
  await page.setViewportSize({ width: 991, height: 800 });
  await page.getByRole('button', { name: 'Polski' }).click();
  await expect(page.getByRole('button', { name: 'English' })).toBeVisible();

  const banner = page.getByRole('banner');
  await expect(banner.getByRole('button', { name: 'Menu' })).toBeVisible();

  const bannerLinks = banner.getByRole('link', {
    name: /^(Strona główna|Rejestr|Wykresy|O aplikacji)$/,
    includeHidden: true,
  });
  await expect(bannerLinks).toHaveCount(4);
  for (const link of await bannerLinks.all()) {
    await expect(link).toBeHidden();
  }
});

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
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Decode a Polish plate',
  );

  const routes: { path: string; heading: string }[] = [
    { path: '/', heading: 'Decode a Polish plate' },
    { path: '/plate/WA12345', heading: 'm.st. Warszawa' },
    { path: '/voivodeship/mazowieckie', heading: 'Masovian Voivodeship' },
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
  { tag: ['@desktop', '@mobile', '@tablet'] },
  async ({ page }, testInfo) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Close' })).toHaveCount(0);

    const expected = closedHiddenFor(testInfo.project.name);

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
  const brandLink = page
    .getByRole('banner')
    .getByRole('link', { name: 'Tablicomat' });
  await expect(brandLink).toBeVisible();
  await brandLink.click();
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
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el) {
      throw new Error('no active element');
    }
    return getComputedStyle(el).outlineStyle;
  });
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
  // Mobile tab order: Tablicomat, Polski, theme toggle, Menu.
  for (let i = 0; i < 4; i++) {
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
  await expect(themeToggle).toBeFocused();
  expect(await outlineStyleOfActive(page)).toBe('none');
});

async function expectBrandLogoBox(
  brandLink: Locator,
  banner: Locator,
): Promise<void> {
  const logo = brandLink.getByRole('img', { name: 'Tablicomat', exact: true });
  await expect(logo).toBeVisible();
  const logoBox = await boxOf(logo);
  const bannerBox = await boxOf(banner);
  expect(logoBox.width).toBe(145);
  expect(logoBox.height).toBe(30);
  expect(
    Math.abs(
      logoBox.y + logoBox.height / 2 - (bannerBox.y + bannerBox.height / 2),
    ),
  ).toBeLessThanOrEqual(1);
}

test('header-brand-accessible-name', { tag: '@mobile' }, async ({ page }) => {
  await readyHome(page);
  const brandLink = page.getByRole('banner').getByRole('link', {
    name: 'Tablicomat',
    exact: true,
  });
  await expect(brandLink).toHaveCount(1);
});

test('header-brand-logo-image', { tag: '@mobile' }, async ({ page }) => {
  await readyHome(page);
  const brandLink = page.getByRole('banner').getByRole('link', {
    name: 'Tablicomat',
    exact: true,
  });
  await expect(
    brandLink.getByRole('img', { name: 'Tablicomat', exact: true }),
  ).toHaveCount(1);
});

test(
  'header-brand-logo-box',
  { tag: ['@tablet', '@mobile'] },
  async ({ page }) => {
    await readyHome(page);
    const banner = page.getByRole('banner');
    const brandLink = banner.getByRole('link', {
      name: 'Tablicomat',
      exact: true,
    });
    await expect(brandLink).toBeVisible();
    await expectBrandLogoBox(brandLink, banner);

    await banner.getByRole('button', { name: 'Polski' }).click();
    await expect(banner.getByRole('button', { name: 'English' })).toBeVisible();
    const brandLinkPl = banner.getByRole('link', {
      name: 'Tablicomat',
      exact: true,
    });
    await expect(brandLinkPl).toBeVisible();
    await expectBrandLogoBox(brandLinkPl, banner);
  },
);

test('header-brand-logo-box-desktop', { tag: '@desktop' }, async ({ page }) => {
  await readyHome(page);
  const banner = page.getByRole('banner');
  const widths = [991, 992, 1280] as const;

  for (const width of widths) {
    await page.setViewportSize({ width, height: 800 });
    const brandLink = banner.getByRole('link', {
      name: 'Tablicomat',
      exact: true,
    });
    await expect(brandLink).toBeVisible();
    await expectBrandLogoBox(brandLink, banner);
  }

  await banner.getByRole('button', { name: 'Polski' }).click();
  await expect(banner.getByRole('button', { name: 'English' })).toBeVisible();

  for (const width of widths) {
    await page.setViewportSize({ width, height: 800 });
    const brandLink = banner.getByRole('link', {
      name: 'Tablicomat',
      exact: true,
    });
    await expect(brandLink).toBeVisible();
    await expectBrandLogoBox(brandLink, banner);
  }
});
