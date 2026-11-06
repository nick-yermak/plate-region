import { test, expect } from '@playwright/test';

test('document-title', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Tablicomat');
});

test('head-icon-links', { tag: '@desktop' }, async ({ page }) => {
  await page.goto('/');
  await expect(
    page.locator('link[rel="icon"][type="image/svg+xml"]'),
  ).toHaveAttribute('href', /icon\.svg$/);
  await expect(page.locator('link[rel="icon"][sizes="32x32"]')).toHaveAttribute(
    'href',
    /favicon\.ico$/,
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    'href',
    /apple-touch-icon\.png$/,
  );
});

test('icon-files-served', { tag: '@desktop' }, async ({ request }) => {
  const checks: { path: string; type: RegExp }[] = [
    { path: '/icon.svg', type: /^image\/svg\+xml(;|$)/ },
    {
      path: '/favicon.ico',
      type: /^image\/(x-icon|vnd\.microsoft\.icon)(;|$)/,
    },
    { path: '/apple-touch-icon.png', type: /^image\/png(;|$)/ },
  ];

  for (const check of checks) {
    const response = await request.get(check.path);
    expect(response.status(), check.path).toBe(200);
    expect(response.headers()['content-type'] ?? '', check.path).toMatch(
      check.type,
    );
  }
});
