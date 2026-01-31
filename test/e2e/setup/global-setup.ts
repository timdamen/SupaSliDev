import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  scaffoldProject,
  getBaseProjectPath,
  cleanupTmpDir,
  installDependencies,
  stopAllDashboards,
  closeSharedBrowser,
} from './test-utils.js';

export default async function globalSetup(): Promise<() => Promise<void>> {
  console.log('Cleaning up .tmp directory before tests...');
  cleanupTmpDir();

  const baseProjectPath = getBaseProjectPath();

  console.log('Scaffolding base project for e2e tests...');
  scaffoldProject('base-project');
  console.log('Base project scaffolded at:', baseProjectPath);

  const nodeModulesPath = join(baseProjectPath, 'node_modules');
  if (!existsSync(nodeModulesPath)) {
    console.log('Installing dependencies for base project...');
    installDependencies(baseProjectPath);
    console.log('Dependencies installed.');
  }

  return async () => {
    await stopAllDashboards();
    await closeSharedBrowser();

    const testsFailed = process.exitCode === 1;
    if (!testsFailed) {
      console.log('All tests passed. Cleaning up .tmp directory...');
      cleanupTmpDir();
    } else {
      console.log('Tests failed. Preserving .tmp directory for debugging.');
    }
  };
}
