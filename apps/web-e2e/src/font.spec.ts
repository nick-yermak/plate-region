import { test, expect, type Page, type Response } from '@playwright/test';

const interFontPath = '/fonts/inter/InterVariable.woff2';
const polishHomeTitle = 'Rozszyfruj polską tablicę';

async function disableTransitions(page: Page): Promise<void> {
  await page.addStyleTag({
    content:
      '*,*::before,*::after{transition:none!important;animation:none!important}',
  });
}

async function switchToPolish(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Polski' }).click();
}

async function openPolishHome(page: Page): Promise<void> {
  await page.goto('/');
  await expect(
    page.locator('[role="main"]:not([aria-busy="true"])'),
  ).toBeVisible();
  await switchToPolish(page);
  await expect(
    page.getByRole('main').getByRole('heading', { level: 1 }),
  ).toHaveText(polishHomeTitle);
  await disableTransitions(page);
}

async function waitForInterLoaded(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(() =>
        [...document.fonts].some(
          (face) => face.family === 'Inter' && face.status === 'loaded',
        ),
      ),
    )
    .toBe(true);
}

async function waitForInterError(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(() =>
        [...document.fonts].some(
          (face) => face.family === 'Inter' && face.status === 'error',
        ),
      ),
    )
    .toBe(true);
}

async function twoAnimationFrames(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      }),
  );
}

async function waitForFontsSettled(page: Page): Promise<void> {
  await twoAnimationFrames(page);
  await page.evaluate(() => document.fonts.ready);
}

async function measureHeadingTextBox(
  page: Page,
): Promise<{ width: number; height: number }> {
  return page.evaluate(() => {
    const heading = document.querySelector('[role="main"] h1');
    if (!heading) {
      throw new Error('main h1 missing');
    }
    const textNode = [...heading.childNodes].find(
      (node) =>
        node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').length > 0,
    );
    if (!textNode) {
      throw new Error('h1 text node missing');
    }
    const range = document.createRange();
    range.selectNodeContents(textNode);
    const rect = range.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
}

test(
  'body text in Polish is rendered by Inter alone',
  { tag: '@desktop' },
  async ({ page }) => {
    await openPolishHome(page);
    await waitForFontsSettled(page);

    const client = await page.context().newCDPSession(page);
    await client.send('DOM.enable');
    await client.send('CSS.enable');
    const { root } = await client.send('DOM.getDocument');
    const { nodeId } = await client.send('DOM.querySelector', {
      nodeId: root.nodeId,
      selector: '[role="main"] h1',
    });
    const { fonts } = await client.send('CSS.getPlatformFontsForNode', {
      nodeId,
    });
    expect(
      fonts.map((font) => ({
        familyName: font.familyName,
        isCustomFont: font.isCustomFont,
      })),
    ).toEqual([{ familyName: 'Inter Variable', isCustomFont: true }]);
  },
);

test(
  'the body font is downloaded once from our origin',
  { tag: '@desktop' },
  async ({ page }) => {
    const responses: Response[] = [];
    page.on('response', (response) => {
      responses.push(response);
    });

    await page.goto('/');
    await expect(
      page.locator('[role="main"]:not([aria-busy="true"])'),
    ).toBeVisible();
    await waitForFontsSettled(page);

    const fontResponses = responses.filter(
      (response) => new URL(response.url()).pathname === interFontPath,
    );
    expect(fontResponses).toHaveLength(1);
    expect(fontResponses[0].status()).toBe(200);
    expect(fontResponses[0].headers()['content-type']).toBe('font/woff2');
  },
);

test(
  'font swap does not shift the layout',
  { tag: '@mobile' },
  async ({ page }) => {
    let releaseGate: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      releaseGate = resolve;
    });
    await page.route(`**${interFontPath}`, async (route) => {
      await gate;
      await route.continue();
    });
    await page.addInitScript(() => {
      localStorage.setItem('pr-lang', 'pl');
      (window as unknown as { __prFontCls: number }).__prFontCls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as LayoutShift;
          if (!shift.hadRecentInput) {
            (window as unknown as { __prFontCls: number }).__prFontCls +=
              shift.value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });

    // Preload of Inter is held by the gate; 'load' would deadlock.
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(
      page.locator('[role="main"]:not([aria-busy="true"])'),
    ).toBeVisible();
    await expect(
      page.getByRole('main').getByRole('heading', { level: 1 }),
    ).toHaveText(polishHomeTitle);
    await twoAnimationFrames(page);
    await expect
      .poll(() =>
        page.evaluate(() => {
          const face = [...document.fonts].find(
            (entry) => entry.family === 'Inter',
          );
          return face?.status ?? 'missing';
        }),
      )
      .not.toBe('loaded');

    const fontResponse = page.waitForResponse(
      (response) => new URL(response.url()).pathname === interFontPath,
      { timeout: 5_000 },
    );
    releaseGate();
    await fontResponse;
    await waitForInterLoaded(page);
    await twoAnimationFrames(page);

    const cls = await page.evaluate(
      () => (window as unknown as { __prFontCls: number }).__prFontCls,
    );
    expect(cls).toBeLessThanOrEqual(0.01);
  },
);

test(
  'fallback metrics keep the heading box the same size as Inter',
  { tag: '@desktop' },
  async ({ page, browser }) => {
    await page.route(`**${interFontPath}`, (route) => route.abort());
    await openPolishHome(page);
    await waitForInterError(page);
    const boxA = await measureHeadingTextBox(page);

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await openPolishHome(pageB);
    await waitForInterLoaded(pageB);
    const boxB = await measureHeadingTextBox(pageB);
    await contextB.close();

    expect(Math.abs(boxA.width - boxB.width) / boxB.width).toBeLessThanOrEqual(
      0.03,
    );
    expect(Math.abs(boxA.height - boxB.height)).toBeLessThanOrEqual(1);
  },
);
