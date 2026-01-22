import { existsSync } from 'node:fs';
import { scaffoldProject, getBaseProjectPath, cleanupTmpDir } from './test-utils.js';

export default async function globalSetup(): Promise<void> {
  cleanupTmpDir();

  const baseProjectPath = getBaseProjectPath();

  if (!existsSync(baseProjectPath)) {
    console.log('Scaffolding base project for e2e tests...');
    scaffoldProject('base-project');
    console.log('Base project scaffolded at:', baseProjectPath);
  }
}
