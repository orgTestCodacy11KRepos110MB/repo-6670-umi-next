import { createJestConfig } from '@umijs/test';

export default createJestConfig(
  {
    testMatch: ['**/packages/*/src/**/*.test.ts'],
    testTimeout: 30000,
    modulePathIgnorePatterns: [
      '<rootDir>/packages/.+/compiled',
      '<rootDir>/packages/.+/fixtures',
    ],
  },
  { useEsbuild: true, hasE2e: false, svgr: false },
);
