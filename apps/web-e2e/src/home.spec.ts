import { test, expect } from '@playwright/test';

test(
  'home-no-page-scroll',
  { tag: ['@desktop', '@mobile'] },
  async ({ page }) => {
    await page.goto('/');
    await expect(
      page.locator('[role="main"]:not([aria-busy="true"])'),
    ).toBeVisible();
    const noPageScroll = await page.evaluate(
      () =>
        document.documentElement.scrollHeight ===
        document.documentElement.clientHeight,
    );
    expect(noPageScroll).toBe(true);
  },
);

test('home-short-code-answer', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/');
  const main = page.getByRole('main');
  const field = page.getByRole('textbox', { name: 'Licence plate number' });
  await field.fill('GD');
  await field.press('Enter');
  await expect(page).toHaveURL('/plate/GD');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Gdańsk');
  await expect(main.getByRole('heading', { level: 2 })).toHaveText(
    'Other possible counties',
  );
  await expect(main.getByRole('listitem')).toHaveCount(1);
  await expect(main.getByRole('listitem')).toHaveText(/GDA gdański \(county\)/);
});

test('home-short-code-mobile', { tag: '@mobile' }, async ({ page }) => {
  await page.goto('/');
  const field = page.getByRole('textbox', { name: 'Licence plate number' });
  await field.fill('GD');
  await page.getByRole('button', { name: 'Search' }).tap();
  await expect(page).toHaveURL('/plate/GD');
  await expect(
    page.getByRole('main').getByRole('heading', { level: 1 }),
  ).toHaveText('Gdańsk');
});
