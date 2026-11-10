import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  overflowingPlateTexts,
  plateTextAndBoxRects,
  waitForPlateFont,
} from './support/plate';

async function offendingPlateCodes(page: Page): Promise<string[]> {
  // Compare with clientWidth: in mobile emulation innerWidth grows with
  // overflowing content (measured 370 and 396 at a 360 viewport).
  return page.evaluate(() =>
    [
      ...document.querySelectorAll('app-voivodeship-codes-table app-plate'),
    ].flatMap((el) => {
      const box = el.getBoundingClientRect();
      const tr = el.closest('tr');
      const withId =
        tr === null ? null : tr.matches('[id]') ? tr : tr.querySelector('[id]');
      const code = withId?.id ?? '?';
      const limit = document.documentElement.clientWidth;
      return box.left < -0.5 || box.right > limit + 0.5 ? [code] : [];
    }),
  );
}

function requireBoundingBox(
  box: { x: number; y: number; width: number; height: number } | null,
): { x: number; y: number; width: number; height: number } {
  if (box === null) {
    throw new Error('tabs nav missing box');
  }
  return box;
}

async function voivodeshipTabHrefs(
  main: Locator,
  label: string,
): Promise<string[]> {
  const hrefs = await main
    .getByRole('navigation', { name: label })
    .getByRole('link')
    .evaluateAll((links) =>
      links.map((link) => {
        const href = (link as HTMLAnchorElement).getAttribute('href');
        if (href === null) {
          throw new Error('voivodeship tab link missing href');
        }
        return href;
      }),
    );
  expect(hrefs).toHaveLength(16);
  return hrefs;
}

async function expectRowGeometryInViewport(row: Locator): Promise<void> {
  await expect(row).toBeVisible();
  // Rows sit on fractional offsets while scrollY is an integer; measured top
  // −0.17 with the row scroll, about −16 with the element scroll.
  const { top, bottom, viewportHeight } = await row.evaluate((tr) => {
    const { top, bottom } = tr.getBoundingClientRect();
    return { top, bottom, viewportHeight: window.innerHeight };
  });
  expect(top).toBeGreaterThanOrEqual(-0.5);
  expect(bottom).toBeLessThanOrEqual(viewportHeight + 0.5);
}

async function expectRowScrolledAndHighlighted(row: Locator): Promise<void> {
  await expectRowGeometryInViewport(row);
  const { cellBg, token } = await row
    .locator('td')
    .first()
    .evaluate((td) => {
      const norm = (value) => value.replace(/\s+/g, '').replace(/,\./g, ',0.');
      return {
        cellBg: norm(getComputedStyle(td).backgroundColor),
        token: norm(
          getComputedStyle(document.documentElement)
            .getPropertyValue('--pr-row-target-bg')
            .trim(),
        ),
      };
    });
  expect(cellBg).toBe(token);
}

test('voivodeship-powiat-list', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/voivodeship/opolskie');
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(
    'Opole Voivodeship',
  );
  await expect(main.locator('tbody tr')).toHaveCount(12);

  await page.goto('/voivodeship/dolnoslaskie');
  const row = main.locator('tr:has(#DW)');
  await expect(row).toBeVisible();
  await expect(row).toContainText('DW, DX, VW, VX');
  await expect(row).toContainText('Wrocław');
  await expect(row.locator('app-plate')).toBeVisible();
  await expect(
    main.getByRole('link', { name: 'Lower Silesian' }),
  ).toHaveAttribute('aria-current', 'page');
});

test('voivodeship-tabs', { tag: ['@desktop', '@mobile'] }, async ({ page }) => {
  await page.goto('/voivodeship/lubuskie');
  const main = page.getByRole('main');
  const nav = main.getByRole('navigation', { name: 'Voivodeships' });
  const currentLink = nav.getByRole('link', { name: 'Lubusz' });
  await expect(currentLink).toHaveAttribute('aria-current', 'page');
  const selectedTab = main.locator('[role="tab"][aria-selected="true"]');
  await expect(selectedTab).toBeVisible();
  await expect(selectedTab).toContainText('Lubusz');

  await nav.getByRole('link', { name: 'West Pomeranian' }).click();
  await expect(page).toHaveURL(/\/voivodeship\/zachodniopomorskie$/);
});

test('voivodeship-slug-examples', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/voivodeship/mazowieckie');
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(
    'Masovian Voivodeship',
  );

  await page.goto('/voivodeship/slaskie');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(
    'Silesian Voivodeship',
  );

  await page.goto('/voivodeship/warminsko-mazurskie');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(
    'Warmian-Masurian Voivodeship',
  );

  await page.goto('/voivodeship/foo');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(
    'Voivodeship not found',
  );
  await expect(
    main.getByRole('link', { name: 'Search for another plate' }),
  ).toHaveAttribute('href', '/');

  await page.goto('/voivodeship/dolnoslaskie');
  const plateText = await main.locator('tr:has(#DW) app-plate').innerText();
  await page.reload();
  await expect(main.locator('tr:has(#DW) app-plate')).toHaveText(plateText);
});

test('voivodeship-anchor', { tag: '@desktop' }, async ({ page }) => {
  // Direct loads: the browser scrolls to the fragment once the element appears while the document is loading.
  await page.goto('/voivodeship/mazowieckie');
  const main = page.getByRole('main');
  const lastRow = main.locator('tr:has(#AZY)');
  await expect(lastRow).toBeAttached();
  await expect(lastRow).not.toBeInViewport();

  await page.goto('/voivodeship/mazowieckie#AZY');
  await expect(main.locator('tr:has(#AZY)')).toBeAttached();
  await expect(main.locator('tr:has(#AZY)')).toBeInViewport();

  await page.goto('/plate/DW12345');
  await main
    .getByRole('link', { name: /Wrocław on the voivodeship page/i })
    .click();
  await expect(page).toHaveURL(/\/voivodeship\/dolnoslaskie#DW$/);
  await expectRowGeometryInViewport(
    page.getByRole('main').locator('tr:has(a#DW)'),
  );

  // In-app navigation to a row below the fold (żyrardowski first code WZY); the browser cannot do this alone.
  await page.goto('/voivodeship/mazowieckie');
  const firstCodeRow = page.getByRole('main').locator('tr:has(#WZY)');
  await expect(firstCodeRow).toBeAttached();
  await expect(firstCodeRow).not.toBeInViewport();
  const plateText = (
    await firstCodeRow.locator('app-plate').innerText()
  ).trim();
  await page.goto(`/plate/${encodeURIComponent(plateText)}`);
  await expect(
    page.getByRole('main').getByRole('heading', { level: 1 }),
  ).toHaveText('żyrardowski county');
  await page
    .getByRole('main')
    .getByRole('link', { name: /żyrardowski on the voivodeship page/i })
    .click();
  await expect(page).toHaveURL(/\/voivodeship\/mazowieckie#WZY$/);
  await expect(page.getByRole('main').locator('tr:has(#WZY)')).toBeInViewport();

  // The next row may carry Ant's hover background from the pointer position
  // left by the click, so the cell is compared with the token.
  const { cellBg, token } = await page
    .locator('tr:has(#WZY) td')
    .first()
    .evaluate((td) => {
      const norm = (value) => value.replace(/\s+/g, '').replace(/,\./g, ',0.');
      return {
        cellBg: norm(getComputedStyle(td).backgroundColor),
        token: norm(
          getComputedStyle(document.documentElement)
            .getPropertyValue('--pr-row-target-bg')
            .trim(),
        ),
      };
    });
  expect(cellBg).toBe(token);

  await page.goBack();
  await expect(page).toHaveURL(/\/plate\//);
});

test(
  'voivodeship-result-link-reading',
  { tag: '@desktop' },
  async ({ page }) => {
    await page.goto('/plate/WY12345');
    await page
      .getByRole('main')
      .getByRole('link', {
        name: /m\.st\. Warszawa on the voivodeship page/i,
      })
      .click();
    await expect(page).toHaveURL(/\/voivodeship\/mazowieckie#WY$/);
    await expectRowScrolledAndHighlighted(
      page.getByRole('main').locator('tr:has(a#WY)'),
    );
  },
);

test(
  'voivodeship-result-link-candidates',
  { tag: '@desktop' },
  async ({ page }) => {
    await page.goto('/plate/WW');
    await page
      .getByRole('main')
      .getByRole('link', {
        name: /m\.st\. Warszawa on the voivodeship page/i,
      })
      .click();
    await expect(page).toHaveURL(/\/voivodeship\/mazowieckie#WW$/);
    await expectRowScrolledAndHighlighted(
      page.getByRole('main').locator('tr:has(a#WW)'),
    );
  },
);

test('voivodeship-code-link', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/voivodeship/dolnoslaskie');
  const main = page.getByRole('main');
  await main.getByRole('link', { name: 'DW', exact: true }).click();
  await expect(page).toHaveURL('/plate/DW');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Wrocław');
});

test('voivodeship-codes-once', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/voivodeship/dolnoslaskie');
  const main = page.getByRole('main');
  await expect(
    main.locator('app-voivodeship-codes-table a[id]').first(),
  ).toBeVisible();
  const hrefs = await voivodeshipTabHrefs(main, 'Voivodeships');
  const ids: string[] = [];
  for (const href of hrefs) {
    await page.goto(href);
    const codeLinks = main.locator('app-voivodeship-codes-table a[id]');
    await expect(codeLinks.first()).toBeVisible();
    const pageIds = await codeLinks.evaluateAll((anchors) =>
      anchors.map((a) => a.id),
    );
    ids.push(...pageIds);
  }
  expect(ids).toHaveLength(689);
  expect(new Set(ids).size).toBe(689);
});

test('voivodeship-warsaw-districts', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/voivodeship/mazowieckie');
  const row = page.getByRole('main').locator('tr:has(#WW)');
  await expect(row).toContainText(
    'm.st. Warszawa — Rembertów, Wilanów, and Włochy',
  );
  await expect(row.locator('#AW')).toBeAttached();
});

test('voivodeship-language-switch', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/voivodeship/dolnoslaskie');
  await page
    .getByRole('banner')
    .getByRole('button', { name: 'Polski' })
    .click();
  await expect(page.locator('tr:has(#DBL)')).toContainText(
    'Powiat bolesławiecki',
  );
  await expect(page.getByRole('main')).toContainText('30 powiatów · 64 kody');
});

async function collectMobileLayoutOffenders(
  page: Page,
  tabsLabel: string,
): Promise<string[]> {
  const main = page.getByRole('main');
  await expect(main.locator('tbody tr').first()).toBeVisible();
  const hrefs = await voivodeshipTabHrefs(main, tabsLabel);
  const offenders: string[] = [];
  for (const href of hrefs) {
    await page.goto(href);
    await expect(main.locator('tbody tr').first()).toBeVisible();
    const scroll = await page.evaluate(() => {
      const { documentElement } = document;
      return {
        scrollWidth: documentElement.scrollWidth,
        clientWidth: documentElement.clientWidth,
      };
    });
    if (scroll.scrollWidth > scroll.clientWidth) {
      offenders.push(
        `${href}: scrollWidth ${scroll.scrollWidth} > clientWidth ${scroll.clientWidth}`,
      );
    }
    for (const code of await offendingPlateCodes(page)) {
      offenders.push(`${href}: plate ${code}`);
    }
  }
  return offenders;
}

test('voivodeship-mobile-layout-en', { tag: '@mobile' }, async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('pr-lang', 'en');
  });
  await page.goto('/voivodeship/mazowieckie');
  const main = page.getByRole('main');
  await expect(
    main.getByRole('columnheader', { name: /codes/i }),
  ).toBeVisible();
  expect(await collectMobileLayoutOffenders(page, 'Voivodeships')).toEqual([]);
});

test('voivodeship-mobile-layout-pl', { tag: '@mobile' }, async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('pr-lang', 'pl');
  });
  await page.goto('/voivodeship/dolnoslaskie');
  const main = page.getByRole('main');
  await expect(
    main.getByRole('columnheader', { name: /wyróżniki/i }),
  ).toBeVisible();
  expect(await collectMobileLayoutOffenders(page, 'Województwa')).toEqual([]);
});

// At 360 the table is 328 px. Widest unbreakable county word 128.75
// ('wysokomazowiecki') and 'WWW,' 45.83, +4 % for Linux CI → 133.9 + 47.7,
// cell padding 3 × 16 = 48: 229.6, so the plate ≤ 98.4 → 96 px
// (font-size 96 × 114 / 520 = 21.05px). Plate header longest word pl 86.08 ≤ 96.
// A 160 px plate needs a 389.6 px table → 421.6 px viewport → breakpoint 424.
test('voivodeship-plate-breakpoint', { tag: '@desktop' }, async ({ page }) => {
  await page.setViewportSize({ width: 424, height: 740 });
  await page.goto('/voivodeship/podlaskie');
  await page
    .getByRole('banner')
    .getByRole('button', { name: 'Polski' })
    .click();
  const main = page.getByRole('main');
  const plates = main.locator('app-voivodeship-codes-table app-plate');
  await expect(plates.first()).toBeVisible();
  for (const plate of await plates.all()) {
    const width = await plate.evaluate(
      (el) => el.getBoundingClientRect().width,
    );
    expect(Math.abs(width - 160)).toBeLessThanOrEqual(0.5);
  }
  expect(await offendingPlateCodes(page)).toEqual([]);
  expect(
    await page.evaluate(() => {
      const { documentElement } = document;
      return documentElement.scrollWidth <= documentElement.clientWidth;
    }),
  ).toBe(true);

  await page.setViewportSize({ width: 423, height: 740 });
  for (const plate of await plates.all()) {
    const width = await plate.evaluate(
      (el) => el.getBoundingClientRect().width,
    );
    expect(Math.abs(width - 96)).toBeLessThanOrEqual(0.5);
  }
  expect(await offendingPlateCodes(page)).toEqual([]);
  expect(
    await page.evaluate(() => {
      const { documentElement } = document;
      return documentElement.scrollWidth <= documentElement.clientWidth;
    }),
  ).toBe(true);
});
test(
  'voivodeship-plate-fit-nwe',
  { tag: ['@desktop', '@mobile'] },
  async ({ page }) => {
    await page.goto('/voivodeship/warminsko-mazurskie');
    const plate = page.locator('tr:has(#NWE) app-plate');
    await expect(plate).toBeVisible();
    await waitForPlateFont(page);
    const { textLeft, textRight, boxLeft, boxRight } =
      await plateTextAndBoxRects(plate);
    expect(textLeft).toBeGreaterThanOrEqual(boxLeft);
    expect(textRight).toBeLessThanOrEqual(boxRight);
  },
);

test('voivodeship-plate-fit-xmb-en', { tag: '@desktop' }, async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('pr-lang', 'en');
  });
  await page.goto('/voivodeship/pomorskie');
  // XMB is not the first code of its county (GMB, XMB); keep the row via #XMB.
  const plate = page.locator('tr:has(#XMB) app-plate');
  await expect(plate).toBeVisible();
  await waitForPlateFont(page);
  const { textLeft, textRight, boxLeft, boxRight } =
    await plateTextAndBoxRects(plate);
  expect(textLeft).toBeGreaterThanOrEqual(boxLeft);
  expect(textRight).toBeLessThanOrEqual(boxRight);
});

test(
  'voivodeship-plate-fit-all',
  { tag: ['@desktop', '@mobile'] },
  async ({ page }) => {
    await page.goto('/voivodeship/dolnoslaskie');
    const main = page.getByRole('main');
    await expect(main.locator('tbody tr').first()).toBeVisible();
    await waitForPlateFont(page);
    const hrefs = await voivodeshipTabHrefs(main, 'Voivodeships');
    const offenders: string[] = [];
    for (const href of hrefs) {
      await page.goto(href);
      await expect(main.locator('tbody tr').first()).toBeVisible();
      await waitForPlateFont(page);
      for (const entry of await overflowingPlateTexts(page)) {
        offenders.push(`${href}: ${entry}`);
      }
    }
    expect(offenders).toEqual([]);
  },
);

test('voivodeship-tabs-line', { tag: '@desktop' }, async ({ page }) => {
  const captureStrip = async () => {
    const nav = page.locator('.ant-tabs-nav');
    const box = requireBoundingBox(await nav.boundingBox());
    const y = Math.floor(box.y + box.height) - 2;
    const x = Math.floor(box.x) + 1;
    const width = Math.floor(box.width) - 2;
    return page.screenshot({
      clip: { x, y, width, height: 4 },
    });
  };

  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/voivodeship/mazowieckie');
  const beforeColor = await page.locator('.ant-tabs-nav').evaluate((el) => {
    const before = getComputedStyle(el, '::before');
    return before.borderBottomColor;
  });
  expect(beforeColor).toBe('rgb(217, 217, 217)');

  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/voivodeship/mazowieckie');
    const withLine = await captureStrip();
    await page.addStyleTag({
      content: '.ant-tabs-nav::before { visibility: hidden !important; }',
    });
    const withoutLine = await captureStrip();
    expect(withLine.equals(withoutLine)).toBe(false);
  }
});

test('voivodeship-tabs-ink', { tag: '@desktop' }, async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/voivodeship/mazowieckie');
  const ink = await page.locator('.ant-tabs-ink-bar').evaluate((el) => {
    return getComputedStyle(el).backgroundColor;
  });
  expect(ink).toBe('rgb(9, 109, 217)');
});
