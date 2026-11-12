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
