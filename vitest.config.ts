import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 60000,
    hookTimeout: 60000,
    projects: [
      {
        test: {
          name: 'cli',
          root: './packages/cli',
          include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'supaslidev',
          root: './packages/supaslidev',
          include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
        },
      },
    ],
  },
});
