import { test, expect, type Page } from '@playwright/test';

const lightBg = 'rgb(255, 255, 255)';
const darkBg = 'rgb(0, 0, 0)';

async function bodyBackground(page: Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

test.describe('theme-follows-system', () => {
  test('light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expect.poll(() => bodyBackground(page)).toBe(lightBg);
  });

  test('dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await expect.poll(() => bodyBackground(page)).toBe(darkBg);
  });

  test('live change', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expect.poll(() => bodyBackground(page)).toBe(lightBg);
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect.poll(() => bodyBackground(page)).toBe(darkBg);
  });
});

test.describe('theme-stored-choice', () => {
  test('stored dark overrides system light', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pr-theme', 'dark');
    });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expect.poll(() => bodyBackground(page)).toBe(darkBg);
  });

  test('invalid stored blue follows system dark', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pr-theme', 'blue');
    });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await expect.poll(() => bodyBackground(page)).toBe(darkBg);
  });
});

test('theme-toggle', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect.poll(() => bodyBackground(page)).toBe(darkBg);
  await page.reload();
  await expect.poll(() => bodyBackground(page)).toBe(darkBg);
});
