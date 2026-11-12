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
  const button = page.locator('button.map-dialog-open');
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
      const borders = root.querySelector('path.borders');
      const marker = root.querySelector('circle.marker');
      const capital = root.querySelector('circle.capital-marker');
      const label = root.querySelector('text.seat-label, svg.labels text');
      if (filled === null || tinted === null || land === undefined) {
        throw new Error('filled, tinted or land area missing');
      }
      if (borders === null) {
        throw new Error('borders missing');
      }
      if (marker === null) {
        throw new Error('selected marker missing');
      }
      if (capital === null) {
        throw new Error('capital marker missing');
      }
      if (label === null) {
        throw new Error('label missing');
      }
      return {
        countyStroke: getComputedStyle(tinted).stroke,
        borderStroke: getComputedStyle(borders).stroke,
        markerStroke: getComputedStyle(marker).stroke,
        capitalStroke: getComputedStyle(capital).stroke,
        labelFill: getComputedStyle(label).fill,
        filledFill: getComputedStyle(filled).fill,
        tintedFill: getComputedStyle(tinted).fill,
        landFill: getComputedStyle(land).fill,
      };
    });
  const tinted = parseCssColor(colours.tintedFill);
  const land = parseCssColor(colours.landFill);
  const countyStroke = parseCssColor(colours.countyStroke);
  const borderStroke = parseCssColor(colours.borderStroke);
  const markerStroke = parseCssColor(colours.markerStroke);
  const capitalStroke = parseCssColor(colours.capitalStroke);
  const labelFill = parseCssColor(colours.labelFill);
  const filled = parseCssColor(colours.filledFill);
  // Selected fill vs tint ≥ 3:1.
  expect(contrastRatio(filled, tinted)).toBeGreaterThanOrEqual(3);
  // County lines decorative: below 3:1 against land.
  expect(contrastRatio(countyStroke, land)).toBeLessThan(3);
  // Voivodeship borders, selected ring, capital markers ≥ 3:1 against land.
  expect(contrastRatio(borderStroke, land)).toBeGreaterThanOrEqual(3);
  expect(contrastRatio(markerStroke, land)).toBeGreaterThanOrEqual(3);
  expect(contrastRatio(capitalStroke, land)).toBeGreaterThanOrEqual(3);
  // Labels ≥ 4.5:1 against land.
  expect(contrastRatio(labelFill, land)).toBeGreaterThanOrEqual(4.5);
}

test('map-result-powiat-highlight', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/plate/DW%2012345');
  await expect(page.locator('button.map-dialog-open')).toBeVisible();

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
  await expect(page.locator('button.map-dialog-open')).toBeVisible();

  await page.locator('button.map-dialog-open').tap();
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
  const countryBox = await boxOf(country);
  const carBox = await boxOf(car);
  // Two-column result grid from 1200 px: map card on the right, width min(100%, 650).
  expect(Math.abs(countryBox.width - 584.921875)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(countryBox.height - 548.65625)).toBeLessThanOrEqual(0.5);
  expect(countryBox.x).toBeGreaterThan(carBox.x + carBox.width - 1);
  const map = country.locator('app-county-map');
  await expect(map.locator('path.area-tinted')).toHaveCount(30);
  await expect(map.locator('path.area-filled')).toHaveCount(1);
  await expect(
    map.locator('text.seat-label-wide', { hasText: 'Wrocław (DW)' }),
  ).toBeVisible();
  await expect(
    map.locator('text.seat-label-wide', { hasText: 'Toruń (CT)' }),
  ).toBeVisible();
  await expect(map.locator('circle.capital-marker')).toHaveCount(17);
  await expect(
    map.locator('svg.voivodeship-button path[role="button"]'),
  ).toBeVisible();
  const fontSize = await map
    .locator('text.seat-label-wide')
    .first()
    .evaluate((el) => getComputedStyle(el).fontSize);
  expect(fontSize).toBe('12px');
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
    .locator('text.seat-label-narrow')
    .first()
    .evaluate((el) => getComputedStyle(el).fontSize);
  expect(fontSize).toBe('11px');
  await expect(
    page.getByText('Click the highlighted voivodeship to see its map.'),
  ).toBeVisible();
  await expect(map.locator('.map-tooltip')).toHaveCount(0);
});

test('map-country-other-voivodeship', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/plate/DW%2012345');
  const map = page.locator('.country-map-box app-county-map');
  const kr = map.locator('path.area[data-id="KR"]');
  await kr.dispatchEvent('click');
  await expect(map.locator('.map-tooltip')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('map-country-marker-clear', { tag: '@mobile' }, async ({ page }) => {
  await page.goto('/plate/CT%2012345');
  const map = page.locator('.country-map-box app-county-map');
  await expect(
    map.locator('text.seat-label-narrow', { hasText: 'Toruń (CT)' }),
  ).toBeVisible();
  await expect(map.locator('circle.marker')).toBeVisible();
});
