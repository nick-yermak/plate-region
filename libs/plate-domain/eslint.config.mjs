import { builtinModules } from 'node:module';

import baseConfig from '../../eslint.config.mjs';

const purityMessage =
  'Core libraries must stay pure (D-41): no Node built-ins, no Math.random, Date.now, Date, console or fetch.';

export default [
  ...baseConfig,
  {
    files: ['src/**/*.ts'],
    ignores: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: builtinModules
            .filter((name) => !name.startsWith('node:'))
            .map((name) => ({
              name,
              message: purityMessage,
            })),
          patterns: [
            {
              group: ['node:*'],
              message: purityMessage,
            },
          ],
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: purityMessage,
        },
        {
          object: 'Date',
          property: 'now',
          message: purityMessage,
        },
        {
          object: 'console',
          message: purityMessage,
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date']",
          message: purityMessage,
        },
        {
          selector: "CallExpression[callee.name='Date']",
          message: purityMessage,
        },
        {
          selector: "CallExpression[callee.name='fetch']",
          message: purityMessage,
        },
      ],
    },
  },
];
