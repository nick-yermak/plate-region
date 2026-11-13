import { test, expect } from '@playwright/test';

import {
  PLATE_TEXT_TOLERANCE_PX,
  plateTextAndBoxRects,
  waitForPlateFont,
} from './support/plate';

test('result-resolved-svg-car', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/plate/DW%2012345');
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(
    'Wrocław (city)',
  );
  await expect(
    page.locator('app-car-illustration > svg[aria-hidden="true"]'),
  ).toBeVisible();
  await expect(
    page.locator('app-car-illustration').getByText('DW 12345', { exact: true }),
  ).toBeVisible();
  await expect(
    main.getByRole('link', { name: 'Codes in the voivodeship' }),
  ).toHaveAttribute('href', '/voivodeship/dolnoslaskie#DW');
});

test('result-invalid-input', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/plate/2A12345');
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(
    'This is not a Polish plate format.',
  );
  await expect(
    main.getByRole('link', { name: 'Search for another plate' }),
  ).toHaveAttribute('href', '/');
  await expect(main.locator('a[href^="/voivodeship/"]')).toHaveCount(0);
});

test('result-not-in-registry', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/plate/HA12345');
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(
    'This code is not in the registry.',
  );
  await expect(
    main.getByRole('link', { name: 'Search for another plate' }),
  ).toHaveAttribute('href', '/');
  await expect(main.locator('a[href^="/voivodeship/"]')).toHaveCount(0);
});

test('result-share-reload', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/');
  const field = page.getByRole('textbox', { name: 'Licence plate number' });
  await field.fill('dw 12345');
  await field.press('Enter');
  await expect(page).toHaveURL(/\/plate\/DW%2012345$/);
  await page.reload();
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(
    'Wrocław (city)',
  );
  await expect(
    page.locator('app-car-illustration > svg[aria-hidden="true"]'),
  ).toBeVisible();
  await expect(
    main.getByRole('link', { name: 'Codes in the voivodeship' }),
  ).toHaveAttribute('href', '/voivodeship/dolnoslaskie#DW');
});

test('result-warsaw-district', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/plate/WE%2012345');
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(
    'Warszawa – Mokotów',
  );
  await expect(
    main.getByRole('term').filter({ hasText: 'District' }),
  ).toBeVisible();
  await expect(
    main.getByRole('definition').filter({ hasText: 'Mokotów' }),
  ).toBeVisible();
});

test('result-mobile-layout', { tag: '@mobile' }, async ({ page }) => {
  await page.goto('/plate/CGD12345');
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(
    'Golub-Dobrzyń, golubsko-dobrzyński county',
  );
  const noHorizontalScroll = await page.evaluate(() => {
    const { documentElement } = document;
    return documentElement.scrollWidth <= documentElement.clientWidth;
  });
  expect(noHorizontalScroll).toBe(true);
  const carBox = await page.locator('app-car-illustration').boundingBox();
  const plateBox = await page.locator('app-plate').boundingBox();
  expect(carBox).toEqual(
    expect.objectContaining({
      x: expect.any(Number),
      width: expect.any(Number),
    }),
  );
  expect(plateBox).toEqual(
    expect.objectContaining({
      x: expect.any(Number),
      width: expect.any(Number),
    }),
  );
  const car = carBox as { x: number; width: number };
  const plate = plateBox as { x: number; width: number };
  expect(car.x).toBeGreaterThanOrEqual(0);
  expect(car.x + car.width).toBeLessThanOrEqual(360);
  expect(plate.x).toBeGreaterThanOrEqual(0);
  expect(plate.x + plate.width).toBeLessThanOrEqual(360);
});

test(
  'result-plate-fit-dww',
  { tag: ['@desktop', '@mobile'] },
  async ({ page }) => {
    await page.goto('/plate/DWW%20800WW');
    const plate = page.locator('app-plate');
    await expect(plate).toBeVisible();
    await waitForPlateFont(page);
    const { textLeft, textRight, boxLeft, boxRight } =
      await plateTextAndBoxRects(plate);
    expect(textLeft).toBeGreaterThanOrEqual(boxLeft - PLATE_TEXT_TOLERANCE_PX);
    expect(textRight).toBeLessThanOrEqual(boxRight + PLATE_TEXT_TOLERANCE_PX);
  },
);

test('result-single-candidate', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Polski' }).click();
  await page.goto('/plate/GMB3837');
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(
    'Malbork, powiat malborski',
  );
  await expect(main.locator('p.note')).toHaveText(
    'Tablica jest niekompletna; pasuje do niej tylko ten powiat.',
  );
  await expect(
    main.getByRole('term').filter({ hasText: 'Rodzaj tablicy' }),
  ).toHaveCount(0);
  await expect(
    main.getByRole('term').filter({ hasText: 'Możliwe rodzaje tablicy' }),
  ).toHaveCount(0);
  const country = page.locator('.country-map-box app-county-map');
  await expect(country.locator('path.area-filled')).toHaveCount(1);
  await expect(
    country.locator('.seat-label-wide', { hasText: 'Malbork (GMB)' }),
  ).toBeVisible();
  await page.locator('button.map-dialog-open').click();
  const dialog = page.locator('.ant-modal').first();
  await expect(dialog).toBeVisible();
  await expect(
    dialog.locator('.seat-label-wide', { hasText: 'Malbork (GMB)' }),
  ).toBeVisible();
});
