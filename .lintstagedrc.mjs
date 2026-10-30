export default {
  // eslint runs again after Prettier: wrapping a long import changes its line length for perfectionist/sort-imports (D-49).
  '*.{ts,mts,cts,js,mjs,cjs,html}': [
    'eslint --fix --no-warn-ignored',
    'prettier --write',
    'eslint --fix --no-warn-ignored',
  ],
  '*.{json,md,css,yml,yaml}': 'prettier --write',
};
