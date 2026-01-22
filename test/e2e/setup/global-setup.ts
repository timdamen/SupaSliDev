import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  scaffoldProject,
  getBaseProjectPath,
  cleanupTmpDir,
  installDependencies,
  stopDashboard,
} from './test-utils.js';

export default async function globalSetup(): Promise<() => Promise<void>> {
  cleanupTmpDir();

  const baseProjectPath = getBaseProjectPath();

  if (!existsSync(baseProjectPath)) {
    console.log('Scaffolding base project for e2e tests...');
    scaffoldProject('base-project');
    console.log('Base project scaffolded at:', baseProjectPath);

    const nodeModulesPath = join(baseProjectPath, 'node_modules');
    if (!existsSync(nodeModulesPath)) {
      console.log('Installing dependencies for base project...');
      installDependencies(baseProjectPath);
      console.log('Dependencies installed.');
    }
  }

  return async () => {
    stopDashboard();
    const testsFailed = process.env.VITEST_TESTS_FAILED === 'true';
    if (!testsFailed) {
      console.log('All tests passed. Cleaning up .tmp directory...');
      cleanupTmpDir();
    } else {
      console.log('Tests failed. Preserving .tmp directory for debugging.');
    }
  };
}
