import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 120000,
    hookTimeout: 120000,
    globalSetup: './setup/global-setup.ts',
    globalTeardown: './setup/global-teardown.ts',
    include: ['**/*.e2e.test.ts'],
  },
});
