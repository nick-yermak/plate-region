import { expect, type Locator, type Page } from '@playwright/test';

// text bounds differ between platforms by a fraction of a pixel ("DWW 800WW"
// starts 0.05 px further left on the Linux CI runner than on macOS); the fit
// checks allow 0.25 CSS px, above that difference and below one device pixel
// at DPR 3 (0.33 CSS px), so a visible overflow still fails.
export const PLATE_TEXT_TOLERANCE_PX = 0.25;

export async function plateTextAndBoxRects(plate: Locator): Promise<{
  textLeft: number;
  textRight: number;
  boxLeft: number;
  boxRight: number;
}> {
  return plate.locator('.plate-text').evaluate((box) => {
    const range = document.createRange();
    range.selectNodeContents(box);
    const textRect = range.getBoundingClientRect();
    const boxRect = box.getBoundingClientRect();
    return {
      textLeft: textRect.left,
      textRight: textRect.right,
      boxLeft: boxRect.left,
      boxRight: boxRect.right,
    };
  });
}

export async function waitForPlateFont(page: Page): Promise<void> {
  const statuses = await page.evaluate(async () => {
    const faces = await document.fonts.load('500 1em "DINish Condensed"');
    return faces.map((face) => face.status);
  });
  expect(statuses).toEqual(['loaded']);
}

export async function overflowingPlateTexts(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [
      ...document.querySelectorAll(
        '[role="main"] tbody tr app-plate .plate-text',
      ),
    ].flatMap((box) => {
      const range = document.createRange();
      range.selectNodeContents(box);
      const textRect = range.getBoundingClientRect();
      const boxRect = box.getBoundingClientRect();
      const leftOverflow = boxRect.left - textRect.left;
      const rightOverflow = textRect.right - boxRect.right;
      if (leftOverflow <= 0 && rightOverflow <= 0) {
        return [];
      }
      const tr = box.closest('tr');
      const withId =
        tr === null ? null : tr.matches('[id]') ? tr : tr.querySelector('[id]');
      const rowId = withId?.id ?? '?';
      return [
        `${rowId} L${leftOverflow.toFixed(2)} R${rightOverflow.toFixed(2)}`,
      ];
    }),
  );
}
