import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  // Global ignores
  {
    ignores: ['**/node_modules/', '**/dist/', '**/coverage/', 'backend/backups/'],
  },

  // Base config for all TS files
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Backend rules
  {
    files: ['backend/src/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Frontend rules
  {
    files: ['frontend/src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // Seed/CLI scripts — allow console for user-facing output
  {
    files: [
      'backend/src/seed*.ts',
      'backend/src/utils/seed*.ts',
      'backend/src/utils/update-*.ts',
      'backend/src/utils/migrate.ts',
      'backend/src/utils/remove-duplicates.ts',
      'backend/src/utils/add-bourbons.ts',
    ],
    rules: {
      'no-console': 'off',
    },
  },

  // Config files — relaxed rules
  {
    files: ['*.config.{ts,js,mjs}', '**/*.config.{ts,js,mjs}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // Prettier compat — must be last
  eslintConfigPrettier
);
