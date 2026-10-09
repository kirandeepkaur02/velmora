import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  {
    files: ['**/*.js'],
    ignores: ['node_modules/**'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  eslintConfigPrettier,
];
