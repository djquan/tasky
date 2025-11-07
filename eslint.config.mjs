import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        crypto: 'readonly',
        navigator: 'readonly',
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLElement: 'readonly',
        MouseEvent: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react/prop-types': 'off', // Using TypeScript for prop validation
      'no-undef': 'off', // TypeScript handles this
      'react-hooks/set-state-in-effect': 'warn', // Allow setState in effects for state reset patterns
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'dev-dist/**',
      'coverage/**',
      '*.config.{js,ts}',
      '**/*.d.ts',
      '**/registerSW.js', // Generated service worker registration file
    ],
  },
];
