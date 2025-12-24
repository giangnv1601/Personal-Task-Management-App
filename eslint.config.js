// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format

import js from '@eslint/js'
import importPlugin from 'eslint-plugin-import'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import storybook from "eslint-plugin-storybook";
import globals from 'globals'

export default [
  { 
    ignores: [
      'dist',
      'coverage',
      'node_modules',
      '**/*.test.{js,jsx}',
      '**/*.spec.{js,jsx}',
      'jest.setup.js',
      'test/**',
      '**/__tests__/**',
    ] 
  },
  
  // Main config for all files
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
  plugins: {
    'react-hooks': reactHooks,
    'react-refresh': reactRefresh,
    'jsx-a11y': jsxA11y,
    'import': importPlugin,
  },
  rules: {
    ...js.configs.recommended.rules,
    ...reactHooks.configs.recommended.rules,
    ...jsxA11y.configs.recommended.rules,
    'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],

  /* Sắp xếp import ổn định, nhóm & chèn dòng trống giữa nhóm */
  'import/order': ['error', {
    'groups': [
      'builtin', 
      'external',
      'internal',
      ['parent', 'sibling', 'index'],
      'object', 'type'
    ],
    'newlines-between': 'always',
    'alphabetize': { order: 'asc', caseInsensitive: true }
  }],

  /* Một vài luật a11y tối thiểu cho form/button/label/link */
  'jsx-a11y/label-has-associated-control': ['warn', { assert: 'either' }],
  'jsx-a11y/anchor-is-valid': 'warn',
  'jsx-a11y/interactive-supports-focus': 'warn',
  'jsx-a11y/no-autofocus': 'warn',
  },
},

// Test files config - Add Jest globals
{
  files: ['**/*.test.{js,jsx}', '**/*.spec.{js,jsx}', '**/jest.setup.js', '**/test/**/*.js'],
  languageOptions: {
    globals: {
      ...globals.jest,
      ...globals.node,
    },
  },
  rules: {
    'no-undef': 'off', // Jest globals are safe
  },
},

...storybook.configs["flat/recommended"],
];
