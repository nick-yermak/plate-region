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
  const colours = await page
    .locator('.map-box app-county-map')
    .evaluate((root) => {
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

async function expectCountryContrast(page: Page): Promise<void> {
  const colours = await page
    .locator('.country-map-box app-county-map')
    .evaluate((root) => {
      const filled = root.querySelector('path.area-filled');
      const tinted = root.querySelector('path.area-tinted');
      if (filled === null || tinted === null) {
        throw new Error('filled or tinted area missing');
      }
      return {
        stroke: getComputedStyle(tinted).stroke,
        filledFill: getComputedStyle(filled).fill,
        tintedFill: getComputedStyle(tinted).fill,
      };
    });
  const tinted = parseCssColor(colours.tintedFill);
  const stroke = parseCssColor(colours.stroke);
  const filled = parseCssColor(colours.filledFill);
  expect(contrastRatio(filled, tinted)).toBeGreaterThanOrEqual(3);
  expect(contrastRatio(stroke, tinted)).toBeGreaterThanOrEqual(3);
}

test('map-result-powiat-highlight', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/plate/DW%2012345');
  const main = page.getByRole('main');
  await expect(
    main.getByRole('img', {
      name: 'Map: Lower Silesian Voivodeship. Highlighted: Wrocław',
    }),
  ).toBeVisible();
  await expect(
    page.locator('.map-box app-county-map path.area-filled'),
  ).toHaveCount(1);

  const car = page.locator('app-car-illustration');
  const mapBox = page.locator('.map-box');
  const carBox = await boxOf(car);
  const box = await boxOf(mapBox);
  expect(Math.abs(carBox.width - 480)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(box.width - 357.07)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(box.height - 357.07)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(box.y - carBox.y)).toBeLessThanOrEqual(0.5);
  expect(box.x).toBeGreaterThanOrEqual(carBox.x + carBox.width + 15.5);

  const dol = page
    .locator('.map-box app-county-map')
    .getByText('DOL', { exact: true });
  const dolBox = await boxOf(dol);
  await page.mouse.move(
    dolBox.x + dolBox.width / 2,
    dolBox.y + dolBox.height / 2,
  );
  await expect(
    page.locator('.map-box app-county-map .hover-outline'),
  ).toBeVisible();

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
  await expect(page.locator('.map-box app-county-map text')).toHaveCount(18);
  await expect(
    page.locator('.map-box app-county-map').getByText('WE', { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('.map-box app-county-map path.area-filled'),
  ).toHaveCount(1);
});

test('map-mobile-interaction', { tag: '@mobile' }, async ({ page }) => {
  await page.goto('/plate/CGD%2012345');
  const car = page.locator('app-car-illustration');
  const mapBox = page.locator('.map-box');
  const carBox = await boxOf(car);
  const box = await boxOf(mapBox);
  expect(box.y).toBeGreaterThanOrEqual(carBox.y + carBox.height - 0.5);
  expect(Math.abs(box.width - 328)).toBeLessThanOrEqual(0.5);
  await expect(page.locator('.map-box .map-tooltip')).toHaveCount(0);

  const cgd = page
    .locator('.map-box app-county-map')
    .getByText('CGD', { exact: true });
  const cgdBox = await boxOf(cgd);
  await page.touchscreen.tap(
    cgdBox.x + cgdBox.width / 2,
    cgdBox.y + cgdBox.height / 2,
  );
  const tooltip = page.locator('.map-box .map-tooltip');
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
  await expect(page.locator('.map-box .map-tooltip')).toHaveCount(0);
});

test('map-country-desktop', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/plate/DW%2012345');
  const main = page.getByRole('main');
  await expect(
    main.getByRole('img', {
      name: 'Map of Poland. Highlighted: Wrocław, Lower Silesian Voivodeship',
    }),
  ).toBeVisible();
  const country = page.locator('.country-map-box');
  const car = page.locator('app-car-illustration');
  const readings = page.locator('app-result-reading');
  const countryBox = await boxOf(country);
  const carBox = await boxOf(car);
  const lastReading = readings.last();
  const readingBox = await boxOf(lastReading);
  expect(Math.abs(countryBox.width - 650)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(countryBox.height - 609.7)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(countryBox.x - carBox.x)).toBeLessThanOrEqual(0.5);
  expect(countryBox.y).toBeGreaterThanOrEqual(readingBox.y + readingBox.height);
  const map = country.locator('app-county-map');
  await expect(map.locator('path.area-tinted')).toHaveCount(30);
  await expect(map.locator('path.area-filled')).toHaveCount(1);
  await expect(map.locator('svg.labels text')).toHaveCount(18);
  await expect(map.getByText('CT', { exact: true })).toBeVisible();
  const fontSize = await map
    .locator('svg.labels text')
    .first()
    .evaluate((el) => getComputedStyle(el).fontSize);
  expect(fontSize).toBe('12px');
  const dwLabel = map.getByText('DW', { exact: true });
  await dwLabel.scrollIntoViewIfNeeded();
  // Playwright boundingBox includes the label stroke; layout boxes keep the ring clear.
  const { dwBottom, markerTop } = await map.evaluate((root) => {
    const text = [...root.querySelectorAll('svg.labels text')].find(
      (node) => node.textContent?.trim() === 'DW',
    );
    const marker = root.querySelector('circle.marker');
    if (text === undefined || marker === null) {
      throw new Error('DW label or marker missing');
    }
    return {
      dwBottom: text.getBoundingClientRect().bottom,
      markerTop: marker.getBoundingClientRect().top,
    };
  });
  expect(dwBottom).toBeLessThanOrEqual(markerTop + 0.5);
  await expectCountryContrast(page);
  await page.emulateMedia({ colorScheme: 'dark' });
  await expectCountryContrast(page);
});

test('map-country-mobile', { tag: '@mobile' }, async ({ page }) => {
  await page.goto('/plate/CGD%2012345');
  const country = page.locator('.country-map-box');
  const box = await boxOf(country);
  expect(Math.abs(box.width - 328)).toBeLessThanOrEqual(0.5);
  const map = country.locator('app-county-map');
  const fontSize = await map
    .locator('svg.labels text')
    .first()
    .evaluate((el) => getComputedStyle(el).fontSize);
  expect(fontSize).toBe('11px');
  await expect(map.getByText('CGD', { exact: true })).toBeVisible();
  const marker = map.locator('circle.marker');
  await marker.scrollIntoViewIfNeeded();
  const markerBox = await boxOf(marker);
  await page.touchscreen.tap(
    markerBox.x + markerBox.width / 2,
    markerBox.y + markerBox.height / 2,
  );
  const tooltip = map.locator('.map-tooltip');
  await expect(tooltip).toContainText('golubsko-dobrzyński county');
  await expect(tooltip.locator('a')).toHaveAttribute(
    'href',
    '/voivodeship/kujawsko-pomorskie#CGD',
  );
});

test('map-country-other-voivodeship', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/plate/DW%2012345');
  const map = page.locator('.country-map-box app-county-map');
  const kr = map.getByText('KR', { exact: true });
  await kr.scrollIntoViewIfNeeded();
  const krBox = await boxOf(kr);
  await page.mouse.click(krBox.x + krBox.width / 2, krBox.y + krBox.height / 2);
  await expect(map.locator('.map-tooltip a')).toHaveAttribute(
    'href',
    '/voivodeship/malopolskie#KR',
  );
});

test('map-country-narrow-capitals', { tag: '@mobile' }, async ({ page }) => {
  await page.goto('/plate/DW%2012345');
  const map = page.locator('.country-map-box app-county-map');
  await expect(map.getByText('CB', { exact: true })).toBeVisible();
  await expect(map.getByText('CT', { exact: true })).toBeHidden();
});

test('map-country-marker-clear', { tag: '@mobile' }, async ({ page }) => {
  await page.goto('/plate/CT%2012345');
  const map = page.locator('.country-map-box app-county-map');
  const ct = map.getByText('CT', { exact: true });
  await ct.scrollIntoViewIfNeeded();
  const ctBox = await boxOf(ct);
  const filledBox = await boxOf(map.locator('path.area-filled'));
  expect(ctBox.y + ctBox.height).toBeLessThanOrEqual(filledBox.y + 0.5);
  await expect(map.locator('circle.marker')).toBeVisible();
});
