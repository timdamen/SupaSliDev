import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: 'playwright',
      instances: [{ browser: 'chromium' }],
    },
    testTimeout: 60000,
    hookTimeout: 60000,
    expect: {
      timeout: 10000,
    },
    include: ['**/*.browser.test.ts'],
  },
});
