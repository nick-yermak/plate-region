import { test, expect } from '@playwright/test';

import { fullCodes, registry, type Region2 } from '@plate-region/plate-data';

function countyForCode(code: string): Region2 {
  for (const region1 of registry.region1) {
    for (const region2 of registry.region2) {
      if (region2.region1Letter !== region1.letters[0]) {
        continue;
      }
      if (fullCodes(region1, region2).includes(code)) {
        return region2;
      }
    }
  }
  throw new Error(`no county with code ${code}`);
}

function answerHeadingForCode(code: string): string {
  const region2 = countyForCode(code);
  return region2.kind === 'city' ? region2.name : `${region2.name} county`;
}

test('home-short-code-answer', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/');
  const main = page.getByRole('main');
  const field = page.getByRole('textbox', { name: 'Licence plate number' });
  await field.fill('GD');
  await field.press('Enter');
  await expect(page).toHaveURL('/');
  await expect(main.getByRole('heading', { level: 2 })).toHaveText([
    'Gdańsk',
    'Other possible counties',
  ]);
  await expect(main.getByText('Voivodeship: Pomeranian')).toBeVisible();
  await expect(main.getByRole('listitem')).toHaveCount(1);
  await expect(main.getByRole('listitem')).toHaveText(/GDA gdański \(county\)/);
});

test('home-example-tap', { tag: '@mobile' }, async ({ page }) => {
  await page.goto('/');
  const main = page.getByRole('main');
  const examples = main.getByRole('group');
  const first = examples.getByRole('button').first();
  const text = (await first.innerText()).trim();
  const expected = answerHeadingForCode(text);
  await first.tap();
  await expect(
    page.getByRole('textbox', { name: 'Licence plate number' }),
  ).toHaveValue(text);
  await expect(first).toBeFocused();
  await expect(main.getByRole('heading', { level: 2 }).first()).toHaveText(
    expected,
  );
  await expect(page.locator('[aria-live="polite"]')).toHaveText(expected);
  await expect(page).toHaveURL('/');
});
