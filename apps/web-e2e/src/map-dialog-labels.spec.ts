import { expect, test, type Page } from '@playwright/test';

import {
  labelGeometryViolations,
  MAP_DIALOG_LABEL_PLATES,
} from './support/map-dialog-labels';

async function openDialogForPlate(page: Page, plate: string): Promise<void> {
  await page.goto(`/plate/${encodeURIComponent(plate)}`);
  const button = page.locator('button.map-dialog-open');
  await expect(button).toBeVisible();
  await page.evaluate(() => document.fonts.load('600 12px Inter'));
  await page.evaluate(() => document.fonts.ready);
  await button.click();
  await expect(page.locator('.ant-modal')).toBeVisible();
}

async function collectLabelViolations(page: Page): Promise<string[]> {
  const violations: string[] = [];
  for (const plate of MAP_DIALOG_LABEL_PLATES) {
    await openDialogForPlate(page, plate);
    const found = await labelGeometryViolations(page);
    for (const item of found) {
      violations.push(`${plate}: ${item}`);
    }
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 10_000 });
  }
  return violations;
}

test(
  'map-dialog-labels-apart-desktop',
  { tag: '@desktop' },
  async ({ page }) => {
    expect(await collectLabelViolations(page)).toEqual([]);
  },
);

test('map-dialog-labels-apart-mobile', { tag: '@mobile' }, async ({ page }) => {
  expect(await collectLabelViolations(page)).toEqual([]);
});

type VisibleSeatLabelShot = {
  readonly id: string;
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

async function visibleSeatLabelSnapshot(
  page: Page,
): Promise<VisibleSeatLabelShot[]> {
  return page.locator('.ant-modal').evaluate((modal) => {
    const round = (n: number): number => Math.round(n * 10) / 10;
    return [...modal.querySelectorAll('svg.labels text[data-area-id]')]
      .filter((el) => getComputedStyle(el).display !== 'none')
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          id: el.getAttribute('data-area-id') ?? '',
          text: el.textContent?.replace(/\s+/g, ' ').trim() ?? '',
          x: round(r.x),
          y: round(r.y),
          width: round(r.width),
          height: round(r.height),
        };
      });
  });
}

test(
  'map-dialog-labels-static-on-click',
  { tag: '@desktop' },
  async ({ page }) => {
    await openDialogForPlate(page, 'GD 16743');
    const ids = ['GTC', 'GSZ', 'GST'] as const;
    for (const id of ids) {
      await expect(
        page.locator(`.ant-modal circle.seat-dot[data-area-id="${id}"]`),
      ).toHaveCount(1);
    }
    const baseline = await visibleSeatLabelSnapshot(page);
    expect(baseline.length).toBeGreaterThan(0);
    const panel = page.locator('.ant-modal .map-dialog-panel .heading');
    for (const id of ids) {
      const before = (await panel.textContent())?.trim() ?? '';
      const box = await page
        .locator(`.ant-modal circle.seat-dot[data-area-id="${id}"]`)
        .boundingBox();
      if (box === null) {
        throw new Error(`no bounding box for seat-dot ${id}`);
      }
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await expect(
        page.locator('.ant-modal path.select-outline'),
      ).toBeVisible();
      await expect(panel).not.toHaveText(before);
      expect(await visibleSeatLabelSnapshot(page)).toEqual(baseline);
    }
  },
);
