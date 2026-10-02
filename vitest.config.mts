import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Only JS libs (plate-domain, plate-data). apps/web uses @angular/build:unit-test.
    projects: ['libs/*/vitest.config.mts'],
  },
});
