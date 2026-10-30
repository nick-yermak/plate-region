import nx from '@nx/eslint-plugin';
import perfectionist from 'eslint-plugin-perfectionist';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc', '**/vitest.config.*.timestamp*'],
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    rules: {
      // Dependency direction: app/e2e → domain → data. Domain and data stay
      // framework-free (no @angular/*). Wildcard *→* is intentionally absent.
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: ['type:domain', 'type:data'],
            },
            {
              sourceTag: 'type:e2e',
              onlyDependOnLibsWithTags: ['type:domain', 'type:data'],
            },
            {
              sourceTag: 'type:domain',
              onlyDependOnLibsWithTags: ['type:data'],
              bannedExternalImports: ['@angular/*'],
            },
            {
              sourceTag: 'type:data',
              onlyDependOnLibsWithTags: [],
              bannedExternalImports: ['@angular/*'],
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
    ignores: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      // A wrong `!` in a spec fails the test; in production it hides a branch (D-37).
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.mts',
      '**/*.cts',
      '**/*.js',
      '**/*.mjs',
      '**/*.cjs',
    ],
    plugins: {
      perfectionist,
    },
    rules: {
      // D-49: four source groups, shorter line first. Prettier does not sort imports.
      'perfectionist/sort-imports': [
        'error',
        {
          type: 'line-length',
          order: 'asc',
          fallbackSort: { type: 'alphabetical', order: 'asc' },
          newlinesBetween: 1,
          groups: [
            ['builtin', 'external'],
            'namespace',
            'plate-region',
            ['parent', 'sibling', 'index'],
            'unknown',
          ],
          customGroups: [
            {
              groupName: 'namespace',
              modifiers: ['wildcard'],
            },
            {
              groupName: 'plate-region',
              elementNamePattern: '^@plate-region/',
            },
          ],
        },
      ],
      // D-49: D-48 groups by access and initializer text; names inside a group stay as written.
      'perfectionist/sort-classes': [
        'error',
        {
          type: 'unsorted',
          newlinesBetween: 'ignore',
          ignoreCallbackDependenciesPatterns: ['^computed$', '^linkedSignal$'],
          customGroups: [
            {
              groupName: 'static-arrow',
              selector: 'function-property',
              modifiers: ['static'],
            },
            {
              groupName: 'inject',
              selector: 'property',
              elementValuePattern: '^inject\\b',
            },
            {
              groupName: 'signal-io',
              selector: 'property',
              elementValuePattern: ['^input\\b', '^output\\b', '^model\\b'],
            },
            {
              groupName: 'public-arrow',
              selector: 'function-property',
              modifiers: ['public'],
            },
            {
              groupName: 'protected-arrow',
              selector: 'function-property',
              modifiers: ['protected'],
            },
            {
              groupName: 'private-arrow',
              selector: 'function-property',
              modifiers: ['private'],
            },
          ],
          groups: [
            [
              'index-signature',
              'readonly-index-signature',
              'static-index-signature',
              'static-readonly-index-signature',
            ],
            [
              'static-block',
              'static-property',
              'static-accessor-property',
              'static-get-method',
              'static-set-method',
              'protected-static-property',
              'protected-static-accessor-property',
              'protected-static-get-method',
              'protected-static-set-method',
              'private-static-property',
              'private-static-accessor-property',
              'private-static-get-method',
              'private-static-set-method',
              'static-method',
              'static-function-property',
              'static-arrow',
              'protected-static-method',
              'protected-static-function-property',
              'private-static-method',
              'private-static-function-property',
            ],
            'inject',
            'signal-io',
            ['property', 'accessor-property', 'get-method', 'set-method'],
            [
              'protected-property',
              'protected-accessor-property',
              'protected-get-method',
              'protected-set-method',
            ],
            [
              'private-property',
              'private-accessor-property',
              'private-get-method',
              'private-set-method',
            ],
            'constructor',
            ['method', 'public-arrow'],
            ['protected-method', 'protected-arrow'],
            ['private-method', 'private-arrow'],
            'unknown',
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
