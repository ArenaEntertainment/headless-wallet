module.exports = {
  extends: [
    '../../.eslintrc.js'
  ],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  env: {
    node: true,
    es2020: true
  },
  rules: {
    // Playwright-specific rules
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],

    // Allow console statements in test utilities
    'no-console': ['warn', {
      allow: ['warn', 'error', 'info']
    }],

    // Allow any type in some test scenarios
    '@typescript-eslint/no-explicit-any': 'warn',

    // Allow require in bridge setup for dynamic imports
    '@typescript-eslint/no-require-imports': 'off',

    // Allow unused parameters in fixtures
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      destructuredArrayIgnorePattern: '^_'
    }]
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      rules: {
        // More lenient rules for test files
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off'
      }
    }
  ]
};