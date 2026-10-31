import { test, expect } from '@playwright/test';

test(
  'plate-readonly-renders',
  { tag: ['@desktop', '@mobile'] },
  async ({ page }) => {
    const fontResponse = page.waitForResponse((r) =>
      new URL(r.url()).pathname.startsWith('/fonts/dinish/'),
    );
    await page.goto('/plate/wa12345');
    const response = await fontResponse;
    expect(response.ok()).toBe(true);
    expect(new URL(response.url()).origin).toBe(new URL(page.url()).origin);

    const plateText = page.getByText('wa12345', { exact: true });
    await expect(plateText).toBeVisible();
    await expect(plateText).toHaveCSS('text-transform', 'uppercase');

    const dinishLoaded = await page.evaluate(async () => {
      await document.fonts.ready;
      for (const face of document.fonts) {
        const family = face.family.replaceAll(/['"]/g, '');
        if (family === 'DINish Condensed' && face.status === 'loaded') {
          return true;
        }
      }
      return false;
    });
    expect(dinishLoaded).toBe(true);
  },
);

test(
  'plate-input-editable',
  { tag: ['@desktop', '@mobile'] },
  async ({ page }) => {
    await page.goto('/');
    const field = page.getByRole('textbox', { name: 'Licence plate number' });
    await field.pressSequentially('wa 12345');
    await expect(field).toHaveValue('wa 12345');
    await expect(field).toHaveCSS('text-transform', 'uppercase');
  },
);
