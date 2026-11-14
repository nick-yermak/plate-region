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

/** Vertical card order at a single-column width: h1 → map → car → voivodeship. */
async function expectVerticalCardOrder(page: Page): Promise<{
  carCard: Locator;
  car: { x: number; y: number; width: number; height: number };
  list: { x: number; y: number; width: number; height: number };
}> {
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
  expect(mapBox.y).toBeGreaterThan(h1.y + h1.height - 1);
  expect(carBox.y).toBeGreaterThan(mapBox.y + mapBox.height - 1);
  expect(voiBox.y).toBeGreaterThan(carBox.y + carBox.height - 1);
  expect(Math.abs(carBox.x - voiBox.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(voiBox.x - mapBox.x)).toBeLessThanOrEqual(1);

  const car = await boxOf(carCard.locator('app-car-illustration'));
  const list = await boxOf(
    carCard.locator('app-result-reading, app-candidates-list').first(),
  );
  expect(car.width).toBeLessThanOrEqual(220);
  return { carCard, car, list };
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

for (const width of [1200, 1280, 1440, 1920] as const) {
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
      // Soft: must report even when the h1-span check fails first (car is level with h1 today).
      expect.soft(Math.abs(mapBox.y - carBox.y)).toBeLessThanOrEqual(0.5);
      // Full-width h1 over both columns; map leads on the left.
      expect(carBox.x).toBeGreaterThan(mapBox.x + mapBox.width - 1);
      expect(Math.abs(h1.x - mapBox.x)).toBeLessThanOrEqual(0.5);
      expect(
        Math.abs(h1.x + h1.width - (carBox.x + carBox.width)),
      ).toBeLessThanOrEqual(0.5);
      expect(Math.abs(voiBox.x - carBox.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(voiBox.width - carBox.width)).toBeLessThanOrEqual(1);
      expect(voiBox.y).toBeGreaterThan(carBox.y + carBox.height - 1);
      const ratio = carBox.width / mapBox.width;
      expect(Math.abs(ratio - 5 / 6)).toBeLessThanOrEqual(0.02);
      const car = await boxOf(carCard.locator('app-car-illustration'));
      expect(Math.abs(car.width - 220)).toBeLessThanOrEqual(0.5);
    },
  );
}

/**
 * Narrowest window where /plate/GMB%202397T shows the reading beside the car
 * (Playwright Chromium e2e viewport, 900 px tall; D-54 Update #175).
 * Measured 1221 (1220 stacked; 1200 stays stacked).
 */
const RESULT_W_SBS = 1221;

for (const width of [
  1200,
  1280,
  RESULT_W_SBS - 1,
  RESULT_W_SBS,
  1440,
  1920,
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
    expect(Math.abs(car.width - 220)).toBeLessThanOrEqual(0.5);
    if (width < RESULT_W_SBS) {
      // Stacked: reading above car; car centred in the card.
      expect(car.y).toBeGreaterThan(list.y + list.height - 1);
      const cardBox = await boxOf(carCard);
      const carCentre = car.x + car.width / 2;
      const cardCentre = cardBox.x + cardBox.width / 2;
      expect(Math.abs(carCentre - cardCentre)).toBeLessThanOrEqual(1);
    } else {
      // Side by side: reading left, car right (not centred).
      expect(list.x + list.width).toBeLessThan(car.x + 1);
    }
  });
}

test('result-layout-tablet', { tag: '@tablet' }, async ({ page }) => {
  await page.goto('/plate/GMB%202397T');
  // Card ~640 px > 28.25rem: reading left of car.
  const { carCard, car, list } = await expectVerticalCardOrder(page);
  expect(list.x + list.width).toBeLessThan(car.x + 1);
  const voiCard = page.locator('app-card').filter({
    has: page.getByRole('heading', { name: 'Pomeranian Voivodeship' }),
  });
  const mapCard = page.locator('app-card').filter({
    has: page.getByRole('heading', { name: 'Poland – voivodeships' }),
  });
  const carBox = await boxOf(carCard);
  const voiBox = await boxOf(voiCard);
  const mapBox = await boxOf(mapCard);
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
  // Card narrower than 28.25rem: reading above car.
  const { car, list } = await expectVerticalCardOrder(page);
  expect(car.y).toBeGreaterThan(list.y + list.height - 1);
  const mapInner = await boxOf(page.locator('.country-map-box'));
  expect(Math.abs(mapInner.width - 328)).toBeLessThanOrEqual(0.5);
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
  // Single column; card ~640 px > 28.25rem: reading left of car.
  const { car, list } = await expectVerticalCardOrder(page);
  expect(list.x + list.width).toBeLessThan(car.x + 1);

  await page.setViewportSize({ width: 1200, height: 800 });
  const heading = page.getByRole('heading', { level: 1 });
  const carCard = page.locator('app-card').filter({
    has: page.locator('app-car-illustration'),
  });
  const mapCard = page.locator('app-card').filter({
    has: page.getByRole('heading', { name: 'Poland – voivodeships' }),
  });
  const h1 = await boxOf(heading);
  const carBox = await boxOf(carCard);
  const mapBoxWide = await boxOf(mapCard);
  expect.soft(Math.abs(mapBoxWide.y - carBox.y)).toBeLessThanOrEqual(0.5);
  expect(carBox.x).toBeGreaterThan(mapBoxWide.x + mapBoxWide.width - 1);
  expect(Math.abs(h1.x - mapBoxWide.x)).toBeLessThanOrEqual(0.5);
  expect(
    Math.abs(h1.x + h1.width - (carBox.x + carBox.width)),
  ).toBeLessThanOrEqual(0.5);
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
  // Without a map, h1 still spans the full grid; the car stays in the 5fr column.
  expect(Math.abs(haH1.x - haCar.x)).toBeLessThanOrEqual(1);
  expect(haH1.width).toBeGreaterThan(haCar.width + 1);
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
  expect(noMapH1.width).toBeGreaterThan(noMapCar.width + 1);
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

test(
  'result-content-cap-1920-matches-1440',
  { tag: '@desktop' },
  async ({ page }) => {
    async function contentBoxes(): Promise<{
      mainContentWidth: number;
      gridWidth: number;
    }> {
      const main = page.getByRole('main');
      const grid = page.locator('.result-grid');
      await expect(main).toBeVisible();
      await expect(grid).toBeVisible();
      return page.evaluate(() => {
        const mainEl = document.querySelector('[role="main"]');
        const gridEl = document.querySelector('.result-grid');
        if (mainEl === null || gridEl === null) {
          throw new Error('main or result-grid missing');
        }
        const mainStyle = getComputedStyle(mainEl);
        const padInline =
          parseFloat(mainStyle.paddingLeft) +
          parseFloat(mainStyle.paddingRight);
        return {
          mainContentWidth: mainEl.getBoundingClientRect().width - padInline,
          gridWidth: gridEl.getBoundingClientRect().width,
        };
      });
    }

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/plate/GMB%202397T');
    const at1440 = await contentBoxes();
    expect(Math.abs(at1440.mainContentWidth - 1340)).toBeLessThanOrEqual(0.5);

    await page.setViewportSize({ width: 1920, height: 900 });
    const at1920 = await contentBoxes();
    expect(
      Math.abs(at1920.mainContentWidth - at1440.mainContentWidth),
    ).toBeLessThanOrEqual(0.5);
    expect(Math.abs(at1920.gridWidth - at1440.gridWidth)).toBeLessThanOrEqual(
      0.5,
    );
  },
);

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

// Columns level once the map is at least as tall as the side content (~1360 px
// for resolved). Measured bottoms 884.28 at 1440 and 1920 (D-54 Update #175).
for (const width of [1440, 1920] as const) {
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

// Through W_sbs and 1280 the side content is still taller than the map
// (resolved mapHeight 644.70 / 685.64 / 655.44; side bottoms 1042.39 / 862.73 /
// 862.73), so the map keeps its natural height.
for (const width of [1200, 1280, RESULT_W_SBS] as const) {
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

// Two readings stay taller than the map at every width (no level assertion).
// Measured side bottoms 1395.39 / 1325.73 / 1325.73 / 1215.73 / 1215.73.
for (const width of [1200, 1280, RESULT_W_SBS, 1440, 1920] as const) {
  test(
    `result-side-taller-two-readings-${width}`,
    { tag: '@desktop' },
    async ({ page }) => {
      const g = await columnGeometry(page, '/plate/WOO1A', width);
      expect(g.sideBottom).toBeGreaterThan(g.mapBottom + 1);
      expect(
        Math.abs(g.mapBottom - (g.mapContentBottom + g.mapPaddingBottom)),
      ).toBeLessThanOrEqual(1);
    },
  );
}

test('result-map-label-tier-1200', { tag: '@desktop' }, async ({ page }) => {
  // placeSeatLabels lays out country labels for 541 px from 768 px (D-64 Update #161);
  // mirrored 6:5 keeps the box on that tier (measured 541.27 at 1200).
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto('/plate/GMB%202397T');
  const mapBox = page.locator('.country-map-box');
  await expect(mapBox).toBeVisible();
  const box = await boxOf(mapBox);
  expect(box.width).toBeGreaterThanOrEqual(541);
});
