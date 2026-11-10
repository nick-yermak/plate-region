import { expect, type Locator, type Page } from '@playwright/test';

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
