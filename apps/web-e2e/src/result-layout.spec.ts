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

async function mapGaps(
  page: Page,
  size: { width: number; height: number },
): Promise<{ leftGap: number; rightGap: number; width: number }> {
  await page.setViewportSize(size);
  await page.goto('/plate/DW%20783JW');
  const mapCard = page.locator('app-card').filter({
    has: page.getByRole('heading', {
      level: 2,
      name: 'Poland – voivodeships',
    }),
  });
  const map = mapCard.locator('svg[role="img"]');
  await expect(map).toBeVisible();
  return mapCard.evaluate((card) => {
    const svg = card.querySelector('svg[role="img"]');
    if (svg === null) {
      throw new Error('map svg missing');
    }
    const cardBox = card.getBoundingClientRect();
    const svgBox = svg.getBoundingClientRect();
    return {
      leftGap: svgBox.left - cardBox.left,
      rightGap: cardBox.right - svgBox.right,
      width: svgBox.width,
    };
  });
}

test(
  'centres the map of Poland in its card',
  { tag: '@desktop' },
  async ({ page }) => {
    const at1280 = await mapGaps(page, { width: 1280, height: 800 });
    expect(Math.abs(at1280.leftGap - at1280.rightGap)).toBeLessThanOrEqual(1);
    const at1920 = await mapGaps(page, { width: 1920, height: 1080 });
    expect(Math.abs(at1920.leftGap - at1920.rightGap)).toBeLessThanOrEqual(1);
    expect(Math.abs(at1920.width - 650)).toBeLessThanOrEqual(0.5);
  },
);

for (const width of [1200, 1280, 1440] as const) {
  test(
    `result-layout-desktop-${width}`,
    { tag: '@desktop' },
    async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/plate/GMB%202397T');
      const heading = page.getByRole('heading', { level: 1 });
      const carCard = page.locator('app-card').filter({
        has: page.locator('app-car-illustration'),
      });
      const voivodeshipCard = page.locator('app-card').filter({
        has: page.getByRole('heading', {
          level: 2,
          name: 'Pomeranian Voivodeship',
        }),
      });
      const mapCard = page.locator('app-card').filter({
        has: page.getByRole('heading', {
          level: 2,
          name: 'Poland – voivodeships',
        }),
      });
      await expect(carCard.locator('app-car-illustration')).toBeVisible();
      await expect(voivodeshipCard).toBeVisible();
      await expect(mapCard).toBeVisible();

      const h1 = await boxOf(heading);
      const carBox = await boxOf(carCard);
      const voiBox = await boxOf(voivodeshipCard);
      const mapBox = await boxOf(mapCard);
      // Map leads in the left column; car + voivodeship share the right.
      expect(carBox.x).toBeGreaterThan(mapBox.x + mapBox.width - 1);
      expect(Math.abs(h1.x - mapBox.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(mapBox.y - (h1.y + h1.height + 16))).toBeLessThanOrEqual(
        1,
      );
      expect(Math.abs(carBox.y - h1.y)).toBeLessThanOrEqual(1);
      expect(Math.abs(voiBox.x - carBox.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(voiBox.width - carBox.width)).toBeLessThanOrEqual(1);
      expect(voiBox.y).toBeGreaterThan(carBox.y + carBox.height - 1);
      const ratio = carBox.width / mapBox.width;
      expect(Math.abs(ratio - 5 / 6)).toBeLessThanOrEqual(0.02);
    },
  );
}

/**
 * Narrowest window where /plate/GMB%202397T shows the reading beside the car
 * (Playwright Chromium e2e viewport; D-54 Update #173, corrected from 1390).
 */
const RESULT_W_SBS = 1388;

for (const width of [
  1200,
  1280,
  RESULT_W_SBS - 1,
  RESULT_W_SBS,
  1440,
] as const) {
  test(`result-car-width-${width}`, { tag: '@desktop' }, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/plate/GMB%202397T');
    const carCard = page.locator('app-card').filter({
      has: page.locator('app-car-illustration'),
    });
    const car = await boxOf(carCard.locator('app-car-illustration'));
    const list = await boxOf(
      carCard.locator('app-result-reading, app-candidates-list').first(),
    );
    expect(car.width).toBeLessThanOrEqual(304);
    if (width < RESULT_W_SBS) {
      expect(list.y).toBeGreaterThan(car.y + car.height - 1);
      const cardBox = await boxOf(carCard);
      const carCentre = car.x + car.width / 2;
      const cardCentre = cardBox.x + cardBox.width / 2;
      expect(Math.abs(carCentre - cardCentre)).toBeLessThanOrEqual(1);
    } else {
      expect(car.x + car.width).toBeLessThan(list.x + 1);
    }
  });
}

test('result-layout-tablet', { tag: '@tablet' }, async ({ page }) => {
  await page.goto('/plate/GMB%202397T');
  const h1 = await boxOf(page.getByRole('heading', { level: 1 }));
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
  expect(carBox.y).toBeGreaterThan(h1.y + h1.height - 1);
  expect(voiBox.y).toBeGreaterThan(carBox.y);
  expect(mapBox.y).toBeGreaterThan(voiBox.y);
  expect(Math.abs(carBox.x - voiBox.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(voiBox.x - mapBox.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(carBox.width - voiBox.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(voiBox.width - mapBox.width)).toBeLessThanOrEqual(1);
  expect(carBox.width).toBeLessThanOrEqual(640);
  const car = await boxOf(carCard.locator('app-car-illustration'));
  const list = await boxOf(
    carCard.locator('app-result-reading, app-candidates-list').first(),
  );
  expect(car.width).toBeLessThanOrEqual(304);
  expect(car.x + car.width).toBeLessThan(list.x + 1);
});

test('result-layout-mobile', { tag: '@mobile' }, async ({ page }) => {
  await page.goto('/plate/GMB%202397T');
  const noHorizontalScroll = await page.evaluate(() => {
    const { documentElement } = document;
    return documentElement.scrollWidth <= documentElement.clientWidth;
  });
  expect(noHorizontalScroll).toBe(true);
  const h1 = await boxOf(page.getByRole('heading', { level: 1 }));
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
  expect(carBox.y).toBeGreaterThan(h1.y + h1.height - 1);
  expect(voiBox.y).toBeGreaterThan(carBox.y);
  expect(mapBox.y).toBeGreaterThan(voiBox.y);
  const mapInner = await boxOf(page.locator('.country-map-box'));
  expect(Math.abs(mapInner.width - 328)).toBeLessThanOrEqual(0.5);
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
  const heading = page.getByRole('heading', { level: 1 });
  const carCard = page.locator('app-card').filter({
    has: page.locator('app-car-illustration'),
  });
  const voiCard = page.locator('app-card').filter({
    has: page.getByRole('heading', { name: 'Pomeranian Voivodeship' }),
  });
  const mapCard = page.locator('app-card').filter({
    has: page.getByRole('heading', { name: 'Poland – voivodeships' }),
  });
  const h1Narrow = await boxOf(heading);
  const carNarrow = await boxOf(carCard);
  const voiBox = await boxOf(voiCard);
  const mapBox = await boxOf(mapCard);
  expect(carNarrow.y).toBeGreaterThan(h1Narrow.y + h1Narrow.height - 1);
  expect(mapBox.y).toBeGreaterThan(voiBox.y);

  await page.setViewportSize({ width: 1200, height: 800 });
  const h1 = await boxOf(heading);
  const carBox = await boxOf(carCard);
  const mapBoxWide = await boxOf(mapCard);
  expect(carBox.x).toBeGreaterThan(mapBoxWide.x + mapBoxWide.width - 1);
  expect(Math.abs(h1.x - mapBoxWide.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(carBox.y - h1.y)).toBeLessThanOrEqual(1);
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
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/plate/HA12345');
  await expect(page.locator('app-voivodeship-card')).toHaveCount(0);
  await expect(page.locator('.country-map-box')).toHaveCount(0);
  const haHeading = page.getByRole('heading', { level: 1 });
  const haCarCard = page.locator('app-card').filter({
    has: page.locator('app-car-illustration'),
  });
  const haH1 = await boxOf(haHeading);
  const haCar = await boxOf(haCarCard);
  expect(Math.abs(haH1.x - haCar.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(haH1.width - haCar.width)).toBeLessThanOrEqual(1);
  expect(haCar.y).toBeGreaterThan(haH1.y + haH1.height - 1);

  await page.goto('/plate/2A12345');
  await expect(page.locator('.country-map-box')).toHaveCount(0);
  const noMapHeading = page.getByRole('heading', { level: 1 });
  const noMapCarCard = page.locator('app-card').filter({
    has: page.locator('app-car-illustration'),
  });
  const noMapH1 = await boxOf(noMapHeading);
  const noMapCar = await boxOf(noMapCarCard);
  expect(Math.abs(noMapH1.x - noMapCar.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(noMapH1.width - noMapCar.width)).toBeLessThanOrEqual(1);
  expect(noMapCar.y).toBeGreaterThan(noMapH1.y + noMapH1.height - 1);

  await page.goto('/plate/GMB%202397T');
  const gmbCar = await boxOf(
    page
      .locator('app-card')
      .filter({ has: page.locator('app-car-illustration') }),
  );
  expect(Math.abs(haCar.width - gmbCar.width)).toBeLessThanOrEqual(1);

  await page.goto('/plate/G%2012345');
  const card = page.locator('app-voivodeship-card');
  await expect(card).toBeVisible();
  await expect(card.getByRole('listitem').first()).toHaveText(/GD — Gdańsk/);
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

async function columnGeometry(
  page: Page,
  platePath: string,
  width: number,
): Promise<{
  sideBottom: number;
  mapBottom: number;
  sideHeight: number;
  mapHeight: number;
  mapContentBottom: number;
  mapPaddingBottom: number;
}> {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(platePath);
  const side = page.locator('.result-main');
  const mapCard = page.locator('app-card.map-card');
  await expect(side).toBeVisible();
  await expect(mapCard).toBeVisible();
  await expect(mapCard.locator('svg[role="img"]')).toBeVisible();
  return page.evaluate(() => {
    const sideEl = document.querySelector('.result-main');
    const mapEl = document.querySelector('app-card.map-card');
    if (sideEl === null || mapEl === null) {
      throw new Error('side column or map card missing');
    }
    const mapBox = mapEl.getBoundingClientRect();
    const paddingBottom = parseFloat(getComputedStyle(mapEl).paddingBottom);
    let contentBottom = mapBox.top;
    for (const child of mapEl.children) {
      contentBottom = Math.max(
        contentBottom,
        (child as HTMLElement).getBoundingClientRect().bottom,
      );
    }
    return {
      sideBottom: sideEl.getBoundingClientRect().bottom,
      mapBottom: mapBox.bottom,
      sideHeight: sideEl.getBoundingClientRect().height,
      mapHeight: mapBox.height,
      mapContentBottom: contentBottom,
      mapPaddingBottom: paddingBottom,
    };
  });
}

for (const width of [RESULT_W_SBS, 1440] as const) {
  for (const [name, path] of [
    ['resolved', '/plate/GMB%202397T'],
    ['candidates', '/plate/G%2012345'],
  ] as const) {
    test(
      `result-columns-level-${name}-${width}`,
      { tag: '@desktop' },
      async ({ page }) => {
        const { sideBottom, mapBottom } = await columnGeometry(
          page,
          path,
          width,
        );
        expect(Math.abs(sideBottom - mapBottom)).toBeLessThanOrEqual(1);
      },
    );
  }
}

for (const width of [1200, 1280] as const) {
  for (const [name, path] of [
    ['resolved', '/plate/GMB%202397T'],
    ['candidates', '/plate/G%2012345'],
  ] as const) {
    test(
      `result-side-taller-${name}-${width}`,
      { tag: '@desktop' },
      async ({ page }) => {
        const g = await columnGeometry(page, path, width);
        expect(g.sideBottom).toBeGreaterThan(g.mapBottom + 1);
        expect(
          Math.abs(g.mapBottom - (g.mapContentBottom + g.mapPaddingBottom)),
        ).toBeLessThanOrEqual(1);
      },
    );
  }
}
