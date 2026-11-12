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

async function openVoivodeshipDialog(page: Page): Promise<Locator> {
  const button = page.locator('.map-box .map-dialog-open');
  await expect(button).toBeVisible();
  await button.click();
  const map = page.locator('.ant-modal app-county-map');
  await expect(map).toBeVisible();
  return map;
}

async function expectMapContrast(
  page: Page,
  map: Locator,
): Promise<{
  countyLine: number;
  outline: number;
  dot: number;
  label: number;
  filled: number;
  countyWidth: string;
  outlineWidth: string;
}> {
  const colours = await map.evaluate((root) => {
    const areas = [...root.querySelectorAll('path.area')];
    const filled = root.querySelector('path.area-filled');
    const unfilled = areas.find(
      (area) => !area.classList.contains('area-filled'),
    );
    const outline = root.querySelector('path.outline');
    const dot = root.querySelector('circle.seat-dot');
    const label = root.querySelector('text.seat-label');
    if (filled === null || unfilled === undefined) {
      throw new Error('filled or unfilled area missing');
    }
    if (outline === null) {
      throw new Error('outline missing');
    }
    if (dot === null) {
      throw new Error('seat-dot missing');
    }
    if (label === null) {
      throw new Error('seat-label missing');
    }
    const areaStyle = getComputedStyle(areas[0] as Element);
    const outlineStyle = getComputedStyle(outline);
    return {
      stroke: areaStyle.stroke,
      countyWidth: areaStyle.strokeWidth,
      outlineStroke: outlineStyle.stroke,
      outlineWidth: outlineStyle.strokeWidth,
      dotFill: getComputedStyle(dot).fill,
      labelFill: getComputedStyle(label).fill,
      filledFill: getComputedStyle(filled).fill,
      unfilledFill: getComputedStyle(unfilled).fill,
    };
  });
  const land = parseCssColor(colours.unfilledFill);
  const stroke = parseCssColor(colours.stroke);
  const outline = parseCssColor(colours.outlineStroke);
  const dot = parseCssColor(colours.dotFill);
  const label = parseCssColor(colours.labelFill);
  const filled = parseCssColor(colours.filledFill);
  const ratios = {
    countyLine: contrastRatio(stroke, land),
    outline: contrastRatio(outline, land),
    dot: contrastRatio(dot, land),
    label: contrastRatio(label, land),
    filled: contrastRatio(filled, land),
    countyWidth: colours.countyWidth,
    outlineWidth: colours.outlineWidth,
  };
  expect(ratios.countyWidth).toBe('0.75px');
  expect(parseFloat(ratios.outlineWidth)).toBeGreaterThanOrEqual(1.5);
  expect(ratios.countyLine).toBeGreaterThanOrEqual(3);
  expect(ratios.outline).toBeGreaterThanOrEqual(3);
  expect(ratios.dot).toBeGreaterThanOrEqual(3);
  expect(ratios.label).toBeGreaterThanOrEqual(4.5);
  expect(ratios.filled).toBeGreaterThanOrEqual(3);
  return ratios;
}

async function expectCountryContrast(page: Page): Promise<void> {
  const colours = await page
    .locator('.country-map-box app-county-map')
    .evaluate((root) => {
      const filled = root.querySelector('path.area-filled');
      const tinted = root.querySelector('path.area-tinted');
      const land = [...root.querySelectorAll('path.area')].find(
        (area) =>
          !area.classList.contains('area-filled') &&
          !area.classList.contains('area-tinted'),
      );
      if (filled === null || tinted === null || land === undefined) {
        throw new Error('filled, tinted or land area missing');
      }
      return {
        stroke: getComputedStyle(tinted).stroke,
        filledFill: getComputedStyle(filled).fill,
        tintedFill: getComputedStyle(tinted).fill,
        landFill: getComputedStyle(land).fill,
      };
    });
  const tinted = parseCssColor(colours.tintedFill);
  const land = parseCssColor(colours.landFill);
  const stroke = parseCssColor(colours.stroke);
  const filled = parseCssColor(colours.filledFill);
  expect(contrastRatio(filled, tinted)).toBeGreaterThanOrEqual(3);
  // County lines target ≥ 3:1 on land (G5); tint is a separate fill check above.
  expect(contrastRatio(stroke, land)).toBeGreaterThanOrEqual(3);
}

test('map-result-powiat-highlight', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/plate/DW%2012345');
  const button = page.locator('.map-box .map-dialog-open');
  await expect(button).toBeVisible();
  const car = page.locator('app-car-illustration');
  const mapBox = page.locator('.map-box');
  const carBox = await boxOf(car);
  const box = await boxOf(mapBox);
  expect(Math.abs(carBox.width - 480)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(box.y - carBox.y)).toBeLessThanOrEqual(0.5);
  expect(box.x).toBeGreaterThanOrEqual(carBox.x + carBox.width + 15.5);

  const map = await openVoivodeshipDialog(page);
  await expect(
    map.getByRole('img', {
      name: 'Map: Lower Silesian Voivodeship. Highlighted: Wrocław',
    }),
  ).toBeVisible();
  await expect(map.locator('path.area-filled')).toHaveCount(1);
  await expect(
    map.locator('.seat-label-wide', { hasText: 'Wrocław (DW)' }),
  ).toBeVisible();

  const lightRatios = await expectMapContrast(page, map);
  // Measured ratios are logged for the G5 report (land = unfilled fill).
  console.log('map-dialog-contrast-light', lightRatios);
  await page.emulateMedia({ colorScheme: 'dark' });
  const darkRatios = await expectMapContrast(page, map);
  console.log('map-dialog-contrast-dark', darkRatios);
});

test('map-result-warsaw-districts', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/plate/WE%2012345');
  const map = await openVoivodeshipDialog(page);
  await expect(
    map.getByRole('img', { name: 'Map: Warsaw. Highlighted: Mokotów' }),
  ).toBeVisible();
  await expect(map.locator('circle.seat-dot')).toHaveCount(18);
  await expect(
    map.locator('.seat-label-wide', { hasText: 'Mokotów (WE)' }),
  ).toBeVisible();
  await expect(map.locator('path.area-filled')).toHaveCount(1);
});

test('map-mobile-interaction', { tag: '@mobile' }, async ({ page }) => {
  await page.goto('/plate/CGD%2012345');
  const car = page.locator('app-car-illustration');
  const mapBox = page.locator('.map-box');
  const carBox = await boxOf(car);
  const box = await boxOf(mapBox);
  expect(box.y).toBeGreaterThanOrEqual(carBox.y + carBox.height - 0.5);
  await expect(page.locator('.map-box .map-dialog-open')).toBeVisible();

  await page.locator('.map-box .map-dialog-open').tap();
  const map = page.locator('.ant-modal app-county-map');
  await expect(map).toBeVisible();
  const panel = page.locator('.ant-modal .map-dialog-panel');
  await expect(panel).toContainText('golubsko-dobrzyński');
  const other = map.locator('path.area:not(.area-filled)').first();
  const otherBox = await boxOf(other);
  await page.touchscreen.tap(
    otherBox.x + otherBox.width / 2,
    otherBox.y + otherBox.height / 2,
  );
  await expect(panel.locator('.heading')).not.toContainText(
    'golubsko-dobrzyński',
  );
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
