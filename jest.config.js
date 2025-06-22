/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: [
    '**/__tests__/**/*.+(js)',
    '**/*.(test|spec).+(js)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'dist/**/*.{js,ts}',
    '!dist/**/*.d.ts',
    '!dist/**/*.test.{js,ts}',
    '!dist/**/*.spec.{js,ts}'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['js', 'json', 'node'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],
};
