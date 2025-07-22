module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  rules: {
    'no-unused-vars': 'off', // Turn off for interfaces and abstract classes
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-undef': 'off', // Turn off since TypeScript handles this
    'no-unreachable': 'error'
  },
  env: {
    node: true,
    es6: true,
    browser: true
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
    '*.config.js',
    '.eslintrc.js',
    'examples/'
  ]
};
