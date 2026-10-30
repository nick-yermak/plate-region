import { workspaceRoot } from '@nx/devkit';
import { nxE2EPreset } from '@nx/playwright/preset';
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env['BASE_URL'] || 'http://localhost:4300';

/**
 * See https://playwright.dev/docs/test-configuration.
 *
 * Generated as a .mts file so Node forces ESM regardless of workspace
 * `type`. Playwright routes `.mts` through its ESM loader (dynamic import,
 * bypassing the pirates CJS-compile path), and Nx's native TS strip loads
 * `.mts` directly. Playwright's configLoader auto-discovers
 * `playwright.config.mts` via its extension list
 * (.ts/.js/.mts/.mjs/.cts/.cjs).
 */
export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  /* Production build via serve-static so e2e catches Beasties/media differences. */
  webServer: {
    command: 'npx nx run web:serve-static',
    url: 'http://localhost:4300',
    reuseExistingServer: false,
    cwd: workspaceRoot,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'desktop',
      grep: /@desktop/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'tablet',
      grep: /@tablet/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'mobile',
      grep: /@mobile/,
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 360, height: 740 },
        screen: { width: 360, height: 740 },
      },
    },
  ],
});
