import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  {
    // 1. Restrict type checking ONLY to TypeScript source files
    files: ['**/*.ts', '**/*.tsx'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-console': 'off',

      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
    },
  },
  prettierConfig,
  {
    // 2. Globally ignore build outputs, dependencies, and generated library files
    ignores: [
      'node_modules/**', 
      '.next/**', 
      'dist/**', 
      'coverage/**', 
      'public/**',
      'lib/**'
    ],
  },
);