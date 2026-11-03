import { test, expect } from '@playwright/test';

test('search-complete-navigates', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/');
  const field = page.getByRole('textbox', { name: 'Licence plate number' });
  await field.fill('dw 12345');
  await field.press('Enter');
  await expect(page).toHaveURL(/\/plate\/DW%2012345$/);
  await expect(
    page.getByRole('main').getByText('DW 12345', { exact: true }),
  ).toBeVisible();
});

test('search-incomplete-candidates', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/');
  const main = page.getByRole('main');
  const field = page.getByRole('textbox', { name: 'Licence plate number' });
  await field.fill('O');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page).toHaveURL('/');
  await expect(main.getByRole('heading', { level: 2 })).toHaveText(
    '12 possible counties',
  );
  await expect(main.getByRole('listitem')).toHaveCount(10);
  await expect(
    page.getByText('and 2 more counties — type more characters'),
  ).toBeVisible();
  await field.pressSequentially('P');
  await expect(main.getByRole('heading', { level: 2 })).toHaveCount(0);
});

test('search-submit-mobile', { tag: '@mobile' }, async ({ page }) => {
  await page.goto('/');
  const main = page.getByRole('main');
  const field = page.getByRole('textbox', { name: 'Licence plate number' });
  await field.focus();
  await field.press('Enter');
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  await expect(field).toHaveAccessibleDescription('Enter a plate number.');

  await field.fill('DW');
  await field.press('Enter');
  await expect(main.getByRole('heading', { level: 2 })).toHaveText(
    '3 possible counties',
  );

  await field.fill('DW12345');
  await page.getByRole('button', { name: 'Search' }).tap();
  await expect(page).toHaveURL(/\/plate\/DW12345$/);
});
