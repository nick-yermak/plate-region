import { test, expect, type Locator, type Page } from '@playwright/test';

const expected = {
  light: {
    bodyBg: 'rgb(255, 255, 255)',
    restingText: 'rgba(0, 0, 0, 0.85)', // 15.13:1 on #fff
    hover: 'rgb(9, 109, 217)', // 5.00:1 on #fff
    active: 'rgb(0, 80, 179)', // 7.50:1 on #fff
    ring: 'rgb(9, 109, 217)', // 5.00:1 on #fff; 4.46:1 on #f0f2f5
    disabledColor: 'rgba(0, 0, 0, 0.25)', // inactive control, exempt
    disabledBg: 'rgb(245, 245, 245)',
    disabledBorder: 'rgb(217, 217, 217)',
    searchNormal: 'rgb(0, 51, 153)', // white icon 10.86:1
    searchHover: 'rgb(26, 77, 173)', // white icon 7.75:1
    searchActive: 'rgb(0, 39, 128)', // white icon 13.11:1
    icon: 'rgb(255, 255, 255)', // against Search fill
  },
  dark: {
    bodyBg: 'rgb(0, 0, 0)',
    restingText: 'rgba(255, 255, 255, 0.85)', // 13.43:1 on #141414
    hover: 'rgb(60, 154, 232)', // 6.12:1 on #141414
    active: 'rgb(101, 183, 243)', // 8.44:1 on #141414
    ring: 'rgb(60, 154, 232)', // 6.12:1 on #141414; 6.98:1 on #000; 5.48:1 on #1f1f1f
    disabledColor: 'rgba(255, 255, 255, 0.3)', // inactive control, exempt
    disabledBg: 'rgba(255, 255, 255, 0.08)',
    disabledBorder: 'rgb(67, 67, 67)',
    searchNormal: 'rgb(0, 51, 153)', // white icon 10.86:1
    searchHover: 'rgb(26, 77, 173)', // white icon 7.75:1
    searchActive: 'rgb(0, 39, 128)', // white icon 13.11:1
    icon: 'rgb(255, 255, 255)', // against Search fill
  },
} as const;

type Theme = keyof typeof expected;

type ButtonStyles = {
  color: string;
  borderColor: string;
  backgroundColor: string;
  outlineColor: string;
  boxShadow: string;
};

type Point = { x: number; y: number };

// Language clicks store pr-lang and theme clicks store pr-theme; clear so every
// navigation starts from the project locale (en-US) and emulateMedia theme.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

async function bodyBackground(page: Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

async function disableTransitions(page: Page): Promise<void> {
  await page.addStyleTag({
    content:
      '*,*::before,*::after{transition:none!important;animation:none!important}',
  });
}

async function openHome(page: Page, theme: Theme): Promise<void> {
  const e = expected[theme];
  await page.emulateMedia({ colorScheme: theme });
  await page.goto('/');
  await expect.poll(() => bodyBackground(page)).toBe(e.bodyBg);
  await disableTransitions(page);
}

async function buttonStyles(locator: Locator): Promise<ButtonStyles> {
  return locator.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      color: style.color,
      borderColor: style.borderColor,
      backgroundColor: style.backgroundColor,
      outlineColor: style.outlineColor,
      boxShadow: style.boxShadow,
    };
  });
}

async function focusViaTab(
  page: Page,
  target: Locator,
  maxTabs = 20,
): Promise<void> {
  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press('Tab');
    if (await target.evaluate((el) => el === document.activeElement)) {
      return;
    }
  }
  throw new Error('focusViaTab: target was not focused');
}

/** Left + 8 px, bottom − 8 px of main — outside every control, not on the header. */
async function awayPointInMain(page: Page): Promise<Point> {
  const box = await page.getByRole('main').boundingBox();
  if (!box) {
    throw new Error('main has no bounding box');
  }
  return { x: box.x + 8, y: box.y + box.height - 8 };
}

/**
 * Press, read active, release off-target (no click), then read focus-after-pointer.
 * Chromium focuses a button on mousedown; toBeFocused is a hard precondition.
 */
async function pressOffTarget(
  page: Page,
  locator: Locator,
  away: Point,
): Promise<{ active: ButtonStyles; focusAfterPointer: ButtonStyles }> {
  await locator.hover();
  await page.mouse.down();
  const active = await buttonStyles(locator);
  await page.mouse.move(away.x, away.y);
  await page.mouse.up();
  await expect(locator).toBeFocused();
  const focusAfterPointer = await buttonStyles(locator);
  return { active, focusAfterPointer };
}

function assertDefaultStateColours(styles: ButtonStyles, colour: string): void {
  expect.soft(styles.color).toBe(colour);
  expect.soft(styles.borderColor).toBe(colour);
}

async function outlineColorOf(
  locator: Locator,
  ancestorSelector: string,
): Promise<string> {
  return locator.evaluate((el, selector) => {
    const ancestor = el.closest(selector);
    if (!ancestor) {
      throw new Error(`ancestor ${selector} not found`);
    }
    return getComputedStyle(ancestor).outlineColor;
  }, ancestorSelector);
}

test('default-button-states', { tag: '@desktop' }, async ({ page }) => {
  const themes = ['light', 'dark'] as const;
  for (const theme of themes) {
    const e = expected[theme];
    await openHome(page, theme);
    const away = await awayPointInMain(page);

    const banner = page.getByRole('banner');
    const lang = banner.getByRole('button', { name: 'Polski' });
    const themeToggle = banner.getByRole('button', {
      name: /Switch to (light|dark) theme/,
    });

    expect.soft((await buttonStyles(lang)).color).toBe(e.restingText);

    await lang.hover();
    assertDefaultStateColours(await buttonStyles(lang), e.hover);
    await page.mouse.move(away.x, away.y);

    const langPress = await pressOffTarget(page, lang, away);
    assertDefaultStateColours(langPress.active, e.active);
    assertDefaultStateColours(langPress.focusAfterPointer, e.hover);
    await lang.evaluate((el) => el.blur());

    await focusViaTab(page, lang);
    const langKb = await buttonStyles(lang);
    assertDefaultStateColours(langKb, e.hover);
    expect.soft(langKb.outlineColor).toBe(e.ring);
    await lang.evaluate((el) => el.blur());

    await themeToggle.hover();
    assertDefaultStateColours(await buttonStyles(themeToggle), e.hover);
    await page.mouse.move(away.x, away.y);

    const themePress = await pressOffTarget(page, themeToggle, away);
    assertDefaultStateColours(themePress.active, e.active);
    assertDefaultStateColours(themePress.focusAfterPointer, e.hover);
    await themeToggle.evaluate((el) => el.blur());

    await focusViaTab(page, themeToggle);
    const themeKb = await buttonStyles(themeToggle);
    assertDefaultStateColours(themeKb, e.hover);
    expect.soft(themeKb.outlineColor).toBe(e.ring);
    await themeToggle.evaluate((el) => el.blur());
  }
});

test('default-button-disabled', { tag: '@desktop' }, async ({ page }) => {
  const themes = ['light', 'dark'] as const;
  for (const theme of themes) {
    const e = expected[theme];
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    await page.route(
      '**/i18n/pl.json',
      async (route) => {
        await gate;
        await route.continue();
      },
      { times: 1 },
    );

    await openHome(page, theme);
    const banner = page.getByRole('banner');
    await banner.getByRole('button', { name: 'Polski' }).click();
    // setLanguage flips the label to English before the held pl.json arrives.
    const lang = banner.getByRole('button', { name: 'English' });
    await expect(lang).toBeDisabled();
    await lang.hover();
    const styles = await buttonStyles(lang);
    expect.soft(styles.color).toBe(e.disabledColor);
    expect.soft(styles.backgroundColor).toBe(e.disabledBg);
    expect.soft(styles.borderColor).toBe(e.disabledBorder);

    const loaded = page.waitForResponse('**/i18n/pl.json');
    release();
    await loaded;
    await expect(lang).toBeEnabled();
  }
});

test(
  'default-button-keyboard-focus-mobile',
  { tag: '@mobile' },
  async ({ page }) => {
    const themes = ['light', 'dark'] as const;
    for (const theme of themes) {
      const e = expected[theme];
      await openHome(page, theme);

      const banner = page.getByRole('banner');
      const targets = [
        banner.getByRole('button', { name: 'Polski' }),
        banner.getByRole('button', { name: /Switch to (light|dark) theme/ }),
        banner.getByRole('button', { name: 'Menu' }),
      ];

      expect.soft((await buttonStyles(targets[0])).color).toBe(e.restingText);

      for (const target of targets) {
        await focusViaTab(page, target);
        const styles = await buttonStyles(target);
        assertDefaultStateColours(styles, e.hover);
        expect.soft(styles.outlineColor).toBe(e.ring);
        await target.evaluate((el) => el.blur());
      }
    }
  },
);

test('search-button-states', { tag: '@desktop' }, async ({ page }) => {
  const themes = ['light', 'dark'] as const;
  for (const theme of themes) {
    const e = expected[theme];
    await openHome(page, theme);
    const away = await awayPointInMain(page);

    const search = page
      .getByRole('main')
      .getByRole('button', { name: 'Search' });

    const resting = await buttonStyles(search);
    expect.soft(resting.backgroundColor).toBe(e.searchNormal);
    expect.soft(resting.color).toBe(e.icon);
    const restingShadow = resting.boxShadow;

    await search.hover();
    const hovered = await buttonStyles(search);
    expect.soft(hovered.backgroundColor).toBe(e.searchHover);
    expect.soft(hovered.color).toBe(e.icon);
    await page.mouse.move(away.x, away.y);

    const pressed = await pressOffTarget(page, search, away);
    expect.soft(pressed.active.backgroundColor).toBe(e.searchActive);
    expect.soft(pressed.active.color).toBe(e.icon);
    expect.soft(pressed.active.boxShadow).toBe(restingShadow);
    expect.soft(pressed.focusAfterPointer.backgroundColor).toBe(e.searchHover);
    expect.soft(pressed.focusAfterPointer.color).toBe(e.icon);
    await search.evaluate((el) => el.blur());

    await focusViaTab(page, search);
    const kb = await buttonStyles(search);
    expect.soft(kb.backgroundColor).toBe(e.searchHover);
    expect.soft(kb.color).toBe(e.icon);
    expect.soft(kb.outlineColor).toBe(e.ring);
    await search.evaluate((el) => el.blur());
  }
});

test('focus-ring-plate-input', { tag: '@desktop' }, async ({ page }) => {
  const themes = ['light', 'dark'] as const;
  for (const theme of themes) {
    const e = expected[theme];
    await openHome(page, theme);

    const field = page
      .getByRole('main')
      .getByRole('textbox', { name: 'Licence plate number' });

    await focusViaTab(page, field);
    await expect(field).toBeFocused();
    expect.soft(await outlineColorOf(field, 'app-plate-input')).toBe(e.ring);
  }
});

test('focus-ring-drawer', { tag: '@mobile' }, async ({ page }) => {
  // nz-drawer 22.1.2 has no role="dialog" (drawer.mjs template); scope via Close /
  // the only navigation present while the drawer is open (same as shell.spec.ts).
  const themes = ['light', 'dark'] as const;
  for (const theme of themes) {
    const e = expected[theme];
    await openHome(page, theme);

    const menu = page.getByRole('banner').getByRole('button', { name: 'Menu' });
    await focusViaTab(page, menu);
    await page.keyboard.press('Enter');

    const closeButton = page.getByRole('button', { name: 'Close' });
    await expect(closeButton).toBeFocused();
    expect.soft((await buttonStyles(closeButton)).outlineColor).toBe(e.ring);

    await page.keyboard.press('Tab');
    const homeLink = page.getByRole('navigation').getByRole('link', {
      name: 'Home',
    });
    await expect(homeLink).toBeFocused();
    // Selected drawer item: 4.55:1 on #e6f7ff (light), 5.77:1 on #111b26 (dark).
    expect.soft(await outlineColorOf(homeLink, '.ant-menu-item')).toBe(e.ring);

    // Non-selected item: text ≠ ring, so an undefined outline var falling back to
    // currentColor cannot pass. Measured surface: #fff 5.00:1 (light), #1f1f1f 5.48:1 (dark).
    await page.keyboard.press('Tab');
    const nextLink = page.getByRole('navigation').getByRole('link').nth(1);
    await expect(nextLink).toBeFocused();
    expect.soft(await outlineColorOf(nextLink, '.ant-menu-item')).toBe(e.ring);

    await page.keyboard.press('Escape');
    await expect(closeButton).toHaveCount(0);
  }
});
