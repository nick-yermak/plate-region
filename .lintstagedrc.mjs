export default {
  '*.{ts,mts,cts,js,mjs,cjs,html}': [
    'eslint --fix --no-warn-ignored',
    'prettier --write',
  ],
  '*.{json,md,css,yml,yaml}': 'prettier --write',
};
