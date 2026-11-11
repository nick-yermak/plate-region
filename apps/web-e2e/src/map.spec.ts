import { expect, test, type Locator, type Page } from '@playwright/test';

import { contrastRatio, parseCssColor } from './support/contrast';

async function boxOf(locator: Locator): Promise<{
  x: number;
  y: number;
  width: number;
  height: number;
}> {
  const box = await locator.boundingBox();
  if (box === null) {
    throw new Error('bounding box missing');
  }
  return box;
}

async function expectMapContrast(page: Page): Promise<void> {
  const colours = await page.locator('app-county-map').evaluate((root) => {
    const areas = [...root.querySelectorAll('path.area')];
    const filled = root.querySelector('path.area-filled');
    const unfilled = areas.find(
      (area) => !area.classList.contains('area-filled'),
    );
    if (filled === null || unfilled === undefined) {
      throw new Error('filled or unfilled area missing');
    }
    return {
      stroke: getComputedStyle(areas[0] as Element).stroke,
      filledFill: getComputedStyle(filled).fill,
      unfilledFill: getComputedStyle(unfilled).fill,
    };
  });
  const unfilled = parseCssColor(colours.unfilledFill);
  const stroke = parseCssColor(colours.stroke);
  const filled = parseCssColor(colours.filledFill);
  expect(contrastRatio(stroke, unfilled)).toBeGreaterThanOrEqual(3);
  expect(contrastRatio(filled, unfilled)).toBeGreaterThanOrEqual(3);
}

test('map-result-powiat-highlight', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/plate/DW%2012345');
  const main = page.getByRole('main');
  await expect(
    main.getByRole('img', {
      name: 'Map: Lower Silesian Voivodeship. Highlighted: Wrocław',
    }),
  ).toBeVisible();
  await expect(page.locator('app-county-map path.area-filled')).toHaveCount(1);

  const car = page.locator('app-car-illustration');
  const mapBox = page.locator('.map-box');
  const carBox = await boxOf(car);
  const box = await boxOf(mapBox);
  expect(Math.abs(carBox.width - 480)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(box.width - 357.07)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(box.height - 357.07)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(box.y - carBox.y)).toBeLessThanOrEqual(0.5);
  expect(box.x).toBeGreaterThanOrEqual(carBox.x + carBox.width + 15.5);

  const dol = page.locator('app-county-map').getByText('DOL', { exact: true });
  const dolBox = await boxOf(dol);
  await page.mouse.move(
    dolBox.x + dolBox.width / 2,
    dolBox.y + dolBox.height / 2,
  );
  await expect(page.locator('app-county-map .hover-outline')).toBeVisible();

  await expectMapContrast(page);
  await page.emulateMedia({ colorScheme: 'dark' });
  await expectMapContrast(page);
});

test('map-result-warsaw-districts', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/plate/WE%2012345');
  const main = page.getByRole('main');
  await expect(
    main.getByRole('img', { name: 'Map: Warsaw. Highlighted: Mokotów' }),
  ).toBeVisible();
  await expect(page.locator('app-county-map text')).toHaveCount(18);
  await expect(
    page.locator('app-county-map').getByText('WE', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('app-county-map path.area-filled')).toHaveCount(1);
});

test('map-mobile-interaction', { tag: '@mobile' }, async ({ page }) => {
  await page.goto('/plate/CGD%2012345');
  const car = page.locator('app-car-illustration');
  const mapBox = page.locator('.map-box');
  const carBox = await boxOf(car);
  const box = await boxOf(mapBox);
  expect(box.y).toBeGreaterThanOrEqual(carBox.y + carBox.height - 0.5);
  expect(Math.abs(box.width - 328)).toBeLessThanOrEqual(0.5);
  await expect(page.locator('.map-tooltip')).toHaveCount(0);

  const cgd = page.locator('app-county-map').getByText('CGD', { exact: true });
  const cgdBox = await boxOf(cgd);
  await page.touchscreen.tap(
    cgdBox.x + cgdBox.width / 2,
    cgdBox.y + cgdBox.height / 2,
  );
  const tooltip = page.locator('.map-tooltip');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText('golubsko-dobrzyński county');
  await expect(tooltip.locator('a')).toHaveAttribute(
    'href',
    '/voivodeship/kujawsko-pomorskie#CGD',
  );

  const heading = page.getByRole('heading', { level: 1 });
  const headingBox = await boxOf(heading);
  await page.touchscreen.tap(
    headingBox.x + headingBox.width / 2,
    headingBox.y + headingBox.height / 2,
  );
  await expect(page.locator('.map-tooltip')).toHaveCount(0);
});
