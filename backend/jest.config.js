/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/index.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 90,
      lines: 85,
      statements: 85,
    },
  },
  setupFiles: ['<rootDir>/__tests__/setup.js'],
  setupFilesAfterEnv: [],
  testTimeout: 10000,
  globalTeardown: '<rootDir>/__tests__/teardown.js',
};
