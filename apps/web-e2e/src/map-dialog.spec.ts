import { expect, test, type Locator, type Page } from '@playwright/test';

/** Tallest county-map module (F, viewBox height 1495). */
const TALLEST_MODULE_PLATE = 'FG 1YN1';

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

async function openMapDialog(page: Page): Promise<Locator> {
  const button = page.locator('button.map-dialog-open');
  await expect(button).toBeVisible();
  await button.click();
  const dialog = page.locator('.pr-voivodeship-map-dialog-wrap .ant-modal');
  await expect(dialog).toBeVisible();
  return dialog;
}

function dialogMargins(
  box: { x: number; y: number; width: number; height: number },
  viewport: { width: number; height: number },
): {
  inside: boolean;
  marginDelta: number;
} {
  const inside =
    box.x >= -1 &&
    box.y >= -1 &&
    box.x + box.width <= viewport.width + 1 &&
    box.y + box.height <= viewport.height + 1;
  const left = box.x;
  const right = viewport.width - (box.x + box.width);
  return { inside, marginDelta: Math.abs(left - right) };
}

test('map-dialog-desktop', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/plate/GMB%2012345');
  const button = page.locator('button.map-dialog-open');
  await expect(button).toBeVisible();
  await button.focus();
  const dialog = await openMapDialog(page);
  const wrapBox = await boxOf(dialog);
  expect(Math.abs(wrapBox.width - 912)).toBeLessThanOrEqual(1);
  await expect(
    dialog.locator('.seat-label-wide', { hasText: 'Malbork (GMB)' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 10_000 });
  await expect(page.locator('app-voivodeship-map-dialog nz-modal')).toHaveCount(
    0,
  );
  await expect(button).toBeFocused();
  await expect(button).toBeVisible();

  await page.goto(`/plate/${encodeURIComponent(TALLEST_MODULE_PLATE)}`);
  const tallDialog = await openMapDialog(page);
  const tallBox = await boxOf(tallDialog);
  const viewport = page.viewportSize() ?? { width: 0, height: 0 };
  const fit = dialogMargins(tallBox, viewport);
  expect(fit.inside).toBe(true);
  expect(fit.marginDelta).toBeLessThanOrEqual(1);
});

test('map-dialog-tablet', { tag: '@tablet' }, async ({ page }) => {
  await page.goto(`/plate/${encodeURIComponent(TALLEST_MODULE_PLATE)}`);
  const dialog = await openMapDialog(page);
  const box = await boxOf(dialog);
  const viewport = page.viewportSize() ?? { width: 0, height: 0 };
  const fit = dialogMargins(box, viewport);
  expect(fit.inside).toBe(true);
  expect(fit.marginDelta).toBeLessThanOrEqual(1);
});

test('map-dialog-mobile', { tag: '@mobile' }, async ({ page }) => {
  await page.goto('/plate/GMB%2012345');
  const button = page.locator('button.map-dialog-open');
  await button.tap();
  const dialog = page.locator('.ant-modal').first();
  await expect(dialog).toBeVisible();
  const box = await boxOf(dialog);
  const viewport = page.viewportSize() ?? { width: 0, height: 0 };
  expect(Math.abs(box.width - viewport.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(box.height - viewport.height)).toBeLessThanOrEqual(1);
  const map = dialog.locator('app-county-map');
  const panel = dialog.locator('.map-dialog-panel');
  const before = (await panel.locator('.heading').textContent())?.trim() ?? '';
  const county = map.locator('path.area:not(.area-filled)').first();
  const countyBox = await boxOf(county);
  await page.touchscreen.tap(
    countyBox.x + countyBox.width / 2,
    countyBox.y + countyBox.height / 2,
  );
  await expect(panel.locator('.heading')).not.toHaveText(before);

  await page.goto(`/plate/${encodeURIComponent(TALLEST_MODULE_PLATE)}`);
  await page.locator('button.map-dialog-open').tap();
  const tallDialog = page.locator('.ant-modal').first();
  await expect(tallDialog).toBeVisible();
  const tallBox = await boxOf(tallDialog);
  expect(Math.abs(tallBox.width - viewport.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(tallBox.height - viewport.height)).toBeLessThanOrEqual(1);
});

test('map-dialog-warsaw', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/plate/WY%2012345');
  await openMapDialog(page);
  const dialog = page.locator('.ant-modal').first();
  await expect(dialog.locator('app-county-map circle.seat-dot')).toHaveCount(
    18,
  );
});
