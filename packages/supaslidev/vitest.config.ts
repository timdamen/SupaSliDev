import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 60000,
    hookTimeout: 60000,
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
  },
});
