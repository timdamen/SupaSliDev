import { defineConfig } from 'vitest/config';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    root: __dirname,
    globals: true,
    testTimeout: 120000,
    hookTimeout: 120000,
    globalSetup: './setup/global-setup.ts',
    globalTeardown: './setup/global-teardown.ts',
    include: ['**/*.e2e.test.ts'],
    fileParallelism: false,
  },
});
