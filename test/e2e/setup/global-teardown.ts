import { cleanupTmpDir, stopDashboard } from './test-utils.js';

export default async function globalTeardown(): Promise<void> {
  stopDashboard();

  const testsFailed = process.env.VITEST_TESTS_FAILED === 'true';

  if (!testsFailed) {
    console.log('All tests passed. Cleaning up .tmp directory...');
    cleanupTmpDir();
  } else {
    console.log('Tests failed. Preserving .tmp directory for debugging.');
  }
}
