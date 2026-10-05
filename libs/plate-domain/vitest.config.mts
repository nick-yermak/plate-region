import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/libs/plate-domain',
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'plate-domain',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      enabled: true,
      include: ['src/**/*.ts'],
      reportsDirectory: '../../coverage/libs/plate-domain',
      provider: 'v8' as const,
      thresholds: {
        lines: 100,
        branches: 100,
      },
    },
  },
}));
