import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/**/*.test.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.+)\\.js$': '$1',
  },
};

export default config;
