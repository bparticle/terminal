import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  clearMocks: true,
  forceExit: true,
  // Set env vars before any test modules are loaded
  setupFiles: ['<rootDir>/src/__tests__/helpers/env-setup.ts'],
};

export default config;
