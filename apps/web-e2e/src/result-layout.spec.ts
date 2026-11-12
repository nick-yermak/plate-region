import { expect, test, type Locator, type Page } from '@playwright/test';

import { composeOver, contrastRatio, parseCssColor } from './support/contrast';

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

async function primaryContrast(
  page: Page,
  button: Locator,
): Promise<{ rest: number; hover: number }> {
  await page.addStyleTag({
    content:
      '*, *::before, *::after { transition: none !important; animation: none !important; }',
  });
  const measure = async (): Promise<number> => {
    const colours = await button.evaluate((el) => {
      const style = getComputedStyle(el);
      return { color: style.color, background: style.backgroundColor };
    });
    return contrastRatio(
      parseCssColor(colours.color),
      parseCssColor(colours.background),
    );
  };
  const rest = await measure();
  await button.hover({ force: true });
  const hover = await measure();
  return { rest, hover };
}

test('result-layout-desktop', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/plate/GMB%202397T');
  const cards = page.locator('app-card');
  await expect(cards).toHaveCount(3);
  const carCard = cards.nth(0);
  const voivodeshipCard = cards.nth(1);
  const mapCard = cards.nth(2);
  await expect(carCard.locator('app-car-illustration')).toBeVisible();
  await expect(
    voivodeshipCard.getByRole('heading', {
      level: 2,
      name: 'Pomeranian Voivodeship',
    }),
  ).toBeVisible();
  await expect(
    mapCard.getByRole('heading', { level: 2, name: 'Poland – voivodeships' }),
  ).toBeVisible();

  const carBox = await boxOf(carCard);
  const voiBox = await boxOf(voivodeshipCard);
  const mapBox = await boxOf(mapCard);
  expect(Math.abs(carBox.y - mapBox.y)).toBeLessThanOrEqual(1);
  expect(mapBox.x).toBeGreaterThan(carBox.x + carBox.width - 1);
  expect(Math.abs(voiBox.x - carBox.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(voiBox.width - carBox.width)).toBeLessThanOrEqual(1);
  expect(voiBox.y).toBeGreaterThan(carBox.y + carBox.height - 1);
  const ratio = carBox.width / mapBox.width;
  expect(Math.abs(ratio - 5 / 6)).toBeLessThanOrEqual(0.02);
  const list = carCard
    .locator('app-result-reading, app-candidates-list')
    .first();
  const listBox = await boxOf(list);
  const car = await boxOf(carCard.locator('app-car-illustration'));
  expect(listBox.y).toBeGreaterThan(car.y + car.height - 1);
});

test('result-layout-wide', { tag: '@desktop' }, async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/plate/GMB%202397T');
  const carCard = page.locator('app-card').first();
  const car = await boxOf(carCard.locator('app-car-illustration'));
  const list = await boxOf(
    carCard.locator('app-result-reading, app-candidates-list').first(),
  );
  expect(car.x + car.width).toBeLessThan(list.x + 1);
});

test('result-layout-tablet', { tag: '@tablet' }, async ({ page }) => {
  await page.goto('/plate/GMB%202397T');
  const carCard = page.locator('app-card').filter({
    has: page.locator('app-car-illustration'),
  });
  const voiCard = page.locator('app-card').filter({
    has: page.getByRole('heading', { name: 'Pomeranian Voivodeship' }),
  });
  const mapCard = page.locator('app-card').filter({
    has: page.getByRole('heading', { name: 'Poland – voivodeships' }),
  });
  const carBox = await boxOf(carCard);
  const voiBox = await boxOf(voiCard);
  const mapBox = await boxOf(mapCard);
  expect(voiBox.y).toBeGreaterThan(carBox.y);
  expect(mapBox.y).toBeGreaterThan(voiBox.y);
  expect(Math.abs(carBox.x - voiBox.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(voiBox.x - mapBox.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(carBox.width - voiBox.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(voiBox.width - mapBox.width)).toBeLessThanOrEqual(1);
  expect(carBox.width).toBeLessThanOrEqual(640);
});

test('result-layout-mobile', { tag: '@mobile' }, async ({ page }) => {
  await page.goto('/plate/GMB%202397T');
  const noHorizontalScroll = await page.evaluate(() => {
    const { documentElement } = document;
    return documentElement.scrollWidth <= documentElement.clientWidth;
  });
  expect(noHorizontalScroll).toBe(true);
  const mapBox = await boxOf(page.locator('.country-map-box'));
  expect(Math.abs(mapBox.width - 328)).toBeLessThanOrEqual(0.5);
  const car = await boxOf(page.locator('app-car-illustration'));
  expect(car.width).toBeGreaterThanOrEqual(312);
  const viewport = page.viewportSize();
  if (viewport === null) {
    throw new Error('viewport missing');
  }
  for (const locator of [
    page.getByRole('link', { name: 'Codes in the voivodeship' }),
    page.locator('button.map-dialog-open'),
  ]) {
    const box = await boxOf(locator);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 0.5);
  }
});

test('result-actions', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/plate/GMB%202397T');
  await expect(
    page.getByRole('link', { name: 'Codes in the voivodeship' }),
  ).toHaveAttribute('href', '/voivodeship/pomorskie#GMB');
  const button = page.locator('button.map-dialog-open');
  await page.evaluate(() => {
    document.documentElement.style.setProperty(
      'transition',
      'none',
      'important',
    );
    document.documentElement.style.setProperty(
      'animation',
      'none',
      'important',
    );
  });
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    const { rest, hover } = await primaryContrast(page, button);
    expect(rest).toBeGreaterThanOrEqual(4.5);
    expect(hover).toBeGreaterThanOrEqual(4.5);
  }
  await button.focus();
  const ring = await button.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      outline: style.outlineColor,
      focus: getComputedStyle(document.documentElement)
        .getPropertyValue('--pr-focus-ring')
        .trim(),
      // Outline sits outside the button; contrast is against the page surface.
      surface: getComputedStyle(document.body).backgroundColor,
    };
  });
  const outline = parseCssColor(
    await page.evaluate((token) => {
      const probe = document.createElement('span');
      probe.style.color = token;
      document.body.appendChild(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    }, ring.focus || ring.outline),
  );
  expect(
    contrastRatio(outline, parseCssColor(ring.surface)),
  ).toBeGreaterThanOrEqual(3);
});

test('result-layout-breakpoint', { tag: '@desktop' }, async ({ page }) => {
  await page.setViewportSize({ width: 1199, height: 800 });
  await page.goto('/plate/GMB%202397T');
  const cards = page.locator('app-card');
  const voiBox = await boxOf(cards.nth(1));
  const mapBox = await boxOf(cards.nth(2));
  expect(mapBox.y).toBeGreaterThan(voiBox.y);

  await page.setViewportSize({ width: 1200, height: 800 });
  const carBox = await boxOf(cards.nth(0));
  const mapBoxWide = await boxOf(cards.nth(2));
  expect(mapBoxWide.x).toBeGreaterThan(carBox.x + carBox.width - 1);
  expect(Math.abs(mapBoxWide.y - carBox.y)).toBeLessThanOrEqual(1);
});

test('result-card-contrast', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/plate/GMB%202397T');
  const card = page.locator('app-card.card-info').filter({
    has: page.getByRole('heading', { name: 'Pomeranian Voivodeship' }),
  });
  await expect(card).toHaveCount(1);
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    const colours = await card.evaluate((el) => {
      const style = getComputedStyle(el);
      const text = el.querySelector('h2, p') ?? el;
      return {
        color: getComputedStyle(text).color,
        background: style.backgroundColor,
        page: getComputedStyle(document.body).backgroundColor,
      };
    });
    const surface = parseCssColor(colours.page);
    const tint = parseCssColor(colours.background);
    const text = parseCssColor(colours.color);
    // Tint is 12% blue over the page surface; contrast against the composite.
    expect(tint.a).toBeLessThan(1);
    const composed = composeOver(tint, surface);
    const ratio = contrastRatio(text, composed);
    console.log(`result-card-contrast-${scheme}`, ratio);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  }
});

test('result-states-layout', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/plate/HA12345');
  await expect(page.locator('app-voivodeship-card')).toHaveCount(0);
  await expect(page.locator('.country-map-box')).toHaveCount(0);

  await page.goto('/plate/G%2012345');
  const card = page.locator('app-voivodeship-card');
  await expect(card).toBeVisible();
  const codesText = await card.innerText();
  const codes = codesText.match(/[A-Z]{1,3}/g) ?? [];
  expect(new Set(codes).size).toBeGreaterThanOrEqual(5);
  await expect(page.locator('button.map-dialog-open')).toHaveText(
    /Show the voivodeship on the map/,
  );

  await page.goto('/plate/WOO1A');
  await expect(
    page.getByRole('link', { name: 'Codes in the voivodeship' }),
  ).toHaveCount(2);
  await expect(page.locator('button.map-dialog-open')).toHaveCount(1);
  const lastLink = page
    .getByRole('link', { name: 'Codes in the voivodeship' })
    .last();
  const mapButton = page.locator('button.map-dialog-open');
  const linkBox = await boxOf(lastLink);
  const buttonBox = await boxOf(mapButton);
  expect(buttonBox.y).toBeGreaterThanOrEqual(linkBox.y - 1);
});
