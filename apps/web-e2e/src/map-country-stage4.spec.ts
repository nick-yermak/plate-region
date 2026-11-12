import { expect, test, type Locator, type Page } from '@playwright/test';

import { contrastRatio, parseCssColor } from './support/contrast';

/** One plate per voivodeship primary letter (first county code). */
const ONE_PER_VOIVODESHIP = [
  'DW 12345',
  'CB 12345',
  'LU 12345',
  'FG 12345',
  'EL 12345',
  'KR 12345',
  'WA 12345',
  'OP 12345',
  'RZ 12345',
  'BI 12345',
  'GD 12345',
  'SK 12345',
  'TK 12345',
  'NO 12345',
  'PO 12345',
  'ZS 12345',
] as const;

async function countryMap(page: Page): Promise<Locator> {
  const map = page.locator('.country-map-box app-county-map');
  await expect(map).toBeVisible();
  return map;
}

function seatCodeFromPlate(plate: string): string {
  return plate.split(/\s+/)[0] ?? plate;
}

test(
  'map-country-voivodeship-button-keyboard',
  { tag: '@desktop' },
  async ({ page }) => {
    await page.goto('/plate/DW%2012345');
    const map = await countryMap(page);
    const button = map.locator('svg.voivodeship-button path[role="button"]');
    await expect(button).toBeVisible();
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 10_000 });
    await expect(button).toBeFocused();
  },
);

test(
  'map-country-voivodeship-button-space-no-scroll',
  {
    tag: '@desktop',
  },
  async ({ page }) => {
    await page.goto('/plate/DW%2012345');
    const map = await countryMap(page);
    await map.scrollIntoViewIfNeeded();
    const button = map.locator('svg.voivodeship-button path[role="button"]');
    await button.focus();
    const scrollBefore = await page.evaluate(() => window.scrollY);
    await page.keyboard.press('Space');
    await expect(page.getByRole('dialog')).toBeVisible();
    const scrollAfter = await page.evaluate(() => window.scrollY);
    expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThanOrEqual(1);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 10_000 });
    await expect(button).toBeFocused();
  },
);

test(
  'map-country-voivodeship-button-click',
  { tag: '@desktop' },
  async ({ page }) => {
    await page.goto('/plate/DW%2012345');
    const map = await countryMap(page);
    const button = map.locator('svg.voivodeship-button path[role="button"]');
    await button.click();
    await expect(page.getByRole('dialog')).toBeVisible();
  },
);

test(
  'map-country-no-county-interaction',
  { tag: '@desktop' },
  async ({ page }) => {
    await page.goto('/plate/DW%2012345');
    const map = await countryMap(page);
    const foreign = map.locator('path.area[data-id="KR"]');
    await foreign.dispatchEvent('click');
    await expect(map.locator('.map-tooltip')).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  },
);

test('map-country-no-tooltip', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/plate/DW%2012345');
  const map = await countryMap(page);
  const filled = map.locator('path.area-filled');
  await filled.dispatchEvent('pointerenter');
  await filled.dispatchEvent('click');
  await expect(map.locator('.map-tooltip')).toHaveCount(0);
});

test('map-country-focusable-count', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/plate/DW%2012345');
  const map = await countryMap(page);
  const focusable = map.locator(
    'a[href], button, [tabindex]:not([tabindex="-1"]), [role="button"]',
  );
  await expect(focusable).toHaveCount(1);
});

test('map-country-button-contrast', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/plate/DW%2012345');
  const map = await countryMap(page);
  const button = map.locator('svg.voivodeship-button path[role="button"]');
  await button.focus();
  const colours = await map.evaluate((root) => {
    const path = root.querySelector(
      'svg.voivodeship-button path[role="button"]',
    );
    const land = [...root.querySelectorAll('path.area')].find(
      (area) =>
        !area.classList.contains('area-filled') &&
        !area.classList.contains('area-tinted'),
    );
    const tinted = root.querySelector('path.area-tinted');
    if (path === null || land === undefined || tinted === null) {
      throw new Error('button, land or tint missing');
    }
    return {
      stroke: getComputedStyle(path).stroke,
      land: getComputedStyle(land).fill,
      tint: getComputedStyle(tinted).fill,
    };
  });
  const stroke = parseCssColor(colours.stroke);
  const land = parseCssColor(colours.land);
  const tint = parseCssColor(colours.tint);
  expect(contrastRatio(stroke, land)).toBeGreaterThanOrEqual(3);
  expect(contrastRatio(stroke, tint)).toBeGreaterThanOrEqual(3);
});

async function expectLabelsClear(
  page: Page,
  plate: string,
  minFullLabels: number,
): Promise<void> {
  await page.goto(`/plate/${encodeURIComponent(plate)}`);
  const map = await countryMap(page);
  await map.scrollIntoViewIfNeeded();
  const code = seatCodeFromPlate(plate);
  const selectedLabel = map.locator(
    `text.seat-label:visible[data-area-id="${code}"]`,
  );
  await expect(selectedLabel).toBeVisible();
  const selectedText = (await selectedLabel.textContent())?.trim() ?? '';
  // Selected prefers "Seat (CODE)"; crowded tiers may fall back to the code.
  expect(
    selectedText === code ||
      new RegExp(`^.+ \\(${code}\\)$`).test(selectedText),
  ).toBe(true);

  const report = await map.evaluate((root) => {
    const img = root.querySelector('svg[role="img"]');
    if (img === null) {
      throw new Error('map image missing');
    }
    const mapBox = img.getBoundingClientRect();
    const labels = [...root.querySelectorAll('text.seat-label')]
      .filter((node) => {
        const style = getComputedStyle(node);
        return style.display !== 'none' && style.visibility !== 'hidden';
      })
      .map((node) => {
        const box = node.getBoundingClientRect();
        return {
          text: node.textContent?.trim() ?? '',
          left: box.left,
          right: box.right,
          top: box.top,
          bottom: box.bottom,
        };
      })
      .filter((l) => l.text.length > 0);
    const markers = [
      ...root.querySelectorAll(
        'circle.marker, circle.capital-marker, circle.seat-dot',
      ),
    ].map((node) => {
      const box = node.getBoundingClientRect();
      return {
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
        cx: (box.left + box.right) / 2,
        cy: (box.top + box.bottom) / 2,
      };
    });
    const overlaps: string[] = [];
    for (let i = 0; i < labels.length; i++) {
      const a = labels[i];
      if (a === undefined) {
        continue;
      }
      // Map of Poland: labels must stay inside the SVG box (margin 0).
      if (
        a.left < mapBox.left - 1 ||
        a.right > mapBox.right + 1 ||
        a.top < mapBox.top - 1 ||
        a.bottom > mapBox.bottom + 1
      ) {
        overlaps.push(`${a.text} outside map`);
      }
      for (let j = i + 1; j < labels.length; j++) {
        const b = labels[j];
        if (b === undefined) {
          continue;
        }
        if (
          a.left < b.right &&
          a.right > b.left &&
          a.top < b.bottom &&
          a.bottom > b.top
        ) {
          overlaps.push(`${a.text}×${b.text}`);
        }
      }
      for (const m of markers) {
        const hits =
          a.left < m.right &&
          a.right > m.left &&
          a.top < m.bottom &&
          a.bottom > m.top;
        if (!hits) {
          continue;
        }
        const own =
          m.cx >= a.left &&
          m.cx <= a.right &&
          m.cy >= a.top &&
          m.cy <= a.bottom;
        if (!own) {
          overlaps.push(`${a.text} hits foreign marker`);
        }
      }
    }
    const fullLabels = labels.filter((l) => /^.+ \([A-Z]{1,3}\)$/.test(l.text));
    return {
      labelCount: labels.length,
      fullCount: fullLabels.length,
      overlaps,
    };
  });
  expect(report.labelCount).toBeGreaterThan(0);
  expect(report.fullCount).toBeGreaterThanOrEqual(minFullLabels);
  expect(report.overlaps).toEqual([]);
}

test(
  'map-country-labels-apart-desktop',
  { tag: '@desktop' },
  async ({ page }) => {
    for (const plate of ONE_PER_VOIVODESHIP) {
      await expectLabelsClear(page, plate, 10);
    }
    expect(ONE_PER_VOIVODESHIP).toHaveLength(16);
  },
);

test(
  'map-country-labels-apart-mobile',
  { tag: '@mobile' },
  async ({ page }) => {
    for (const plate of ONE_PER_VOIVODESHIP) {
      await expectLabelsClear(page, plate, 8);
    }
    expect(ONE_PER_VOIVODESHIP).toHaveLength(16);
  },
);
