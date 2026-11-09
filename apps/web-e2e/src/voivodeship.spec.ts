import { expect, test } from '@playwright/test';

test('voivodeship-powiat-list', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/voivodeship/dolnoslaskie');
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(
    'Lower Silesian Voivodeship',
  );
  const row = main.locator('#DW');
  await expect(row).toBeVisible();
  await expect(row).toContainText('DW');
  await expect(row.locator('app-plate')).toBeVisible();
  await expect(
    main.getByRole('navigation').getByRole('link', { name: 'Lower Silesian' }),
  ).toHaveAttribute('aria-current', 'page');
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
});

test('voivodeship-mobile-layout', { tag: '@mobile' }, async ({ page }) => {
  await page.goto('/voivodeship/mazowieckie');
  const main = page.getByRole('main');
  const noHorizontalScroll = await page.evaluate(() => {
    const { documentElement } = document;
    return documentElement.scrollWidth <= documentElement.clientWidth;
  });
  expect(noHorizontalScroll).toBe(true);

  const firstRow = main.locator('li[id]').first();
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
