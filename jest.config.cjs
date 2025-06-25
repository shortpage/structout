/** @type {import('jest').Config} */
module.exports = {
  /* paths */
  rootDir: '.',
  roots: ['<rootDir>/src'],
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],

  /* compiler / runtime */
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: { '^.+\\.tsx?$': 'ts-jest' },


  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  /* ignore pnpm’s hoists */
  testPathIgnorePatterns: ['/node_modules/', '/\\.ignored_node_modules/'],

  /* ⬇️  NEW: alias vitest to Jest */
  moduleNameMapper: {
      '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
  },

  /* coverage */
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'text-summary'],
  coverageThreshold: {
    global: { lines: 90, branches: 85, functions: 90, statements: 90 },
  },

  /* stability tweaks (optional) */
  maxWorkers: 1,
  watchPlugins: [],
};
