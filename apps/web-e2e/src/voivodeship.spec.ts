import { expect, test } from '@playwright/test';

test('voivodeship-powiat-list', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/voivodeship/opolskie');
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(
    'Opole Voivodeship',
  );
  await expect(main.locator('tbody tr')).toHaveCount(13);

  await page.goto('/voivodeship/dolnoslaskie');
  const row = main.locator('tr#DW');
  await expect(row).toBeVisible();
  await expect(row).toContainText('DW');
  await expect(row).toContainText('Wrocław');
  await expect(row.locator('app-plate')).toBeVisible();
  await expect(
    main.getByRole('link', { name: 'Lower Silesian' }),
  ).toHaveAttribute('aria-current', 'page');
});

test('voivodeship-tabs', { tag: ['@desktop', '@mobile'] }, async ({ page }) => {
  await page.goto('/voivodeship/lubuskie');
  const main = page.getByRole('main');
  const currentLink = main.getByRole('link', { name: 'Lubusz' });
  await expect(currentLink).toHaveAttribute('aria-current', 'page');
  const selectedTab = main.locator('[role="tab"][aria-selected="true"]');
  await expect(selectedTab).toBeVisible();
  await expect(selectedTab).toContainText('Lubusz');

  await main.getByRole('link', { name: 'West Pomeranian' }).click();
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
  const plateText = await main.locator('#DW app-plate').innerText();
  await page.reload();
  await expect(main.locator('#DW app-plate')).toHaveText(plateText);
});

test('voivodeship-anchor', { tag: '@desktop' }, async ({ page }) => {
  // Direct loads: the browser scrolls to the fragment once the element appears while the document is loading.
  await page.goto('/voivodeship/mazowieckie');
  const main = page.getByRole('main');
  const lastRow = main.locator('#AZY');
  await expect(lastRow).toBeAttached();
  await expect(lastRow).not.toBeInViewport();

  await page.goto('/voivodeship/mazowieckie#AZY');
  await expect(main.locator('#AZY')).toBeAttached();
  await expect(main.locator('#AZY')).toBeInViewport();

  await page.goto('/plate/DW12345');
  await main
    .getByRole('link', { name: /Wrocław on the voivodeship page/i })
    .click();
  await expect(page).toHaveURL(/\/voivodeship\/dolnoslaskie#DW$/);
  await expect(page.getByRole('main').locator('#DW')).toBeInViewport();

  // In-app navigation to a row below the fold (żyrardowski first code WZY); the browser cannot do this alone.
  await page.goto('/voivodeship/mazowieckie');
  const firstCodeRow = page.getByRole('main').locator('#WZY');
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
  await expect(page.getByRole('main').locator('#WZY')).toBeInViewport();
});

test('voivodeship-mobile-layout', { tag: '@mobile' }, async ({ page }) => {
  await page.goto('/voivodeship/mazowieckie');
  const main = page.getByRole('main');
  const noHorizontalScroll = await page.evaluate(() => {
    const { documentElement } = document;
    return documentElement.scrollWidth <= documentElement.clientWidth;
  });
  expect(noHorizontalScroll).toBe(true);

  const firstRow = main.locator('tr[id]').first();
  await expect(firstRow).toBeVisible();
  const boxes = await firstRow.evaluate((row) => {
    const plate = row.querySelector('app-plate');
    if (plate === null) {
      return null;
    }
    const rowBox = row.getBoundingClientRect();
    const plateBox = plate.getBoundingClientRect();
    return {
      row: {
        left: rowBox.left,
        right: rowBox.right,
        top: rowBox.top,
        bottom: rowBox.bottom,
      },
      plate: {
        left: plateBox.left,
        right: plateBox.right,
        top: plateBox.top,
        bottom: plateBox.bottom,
      },
    };
  });
  expect(boxes).not.toBeNull();
  expect(boxes!.plate.left).toBeGreaterThanOrEqual(boxes!.row.left);
  expect(boxes!.plate.right).toBeLessThanOrEqual(boxes!.row.right);
  expect(boxes!.plate.top).toBeGreaterThanOrEqual(boxes!.row.top);
  expect(boxes!.plate.bottom).toBeLessThanOrEqual(boxes!.row.bottom);
});
