import { spawn, ChildProcess } from 'node:child_process';
import { dirname, join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { findProjectRoot } from '../utils.js';

export function findDashboardPackageRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));

  while (dir !== dirname(dir)) {
    const packageJsonPath = join(dir, 'package.json');
    if (existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        if (pkg.name === '@supaslidev/dashboard') {
          return dir;
        }
      } catch {
        // Continue searching
      }
    }
    dir = dirname(dir);
  }

  throw new Error('Could not find @supaslidev/dashboard package root');
}

const packageRoot = findDashboardPackageRoot();

export async function dev(): Promise<void> {
  const projectRoot = findProjectRoot();

  if (!projectRoot) {
    console.error('Error: Could not find a Supaslidev project.');
    console.error('Make sure you are in a directory with a "presentations" folder.');
    process.exit(1);
  }

  const presentationsDir = join(projectRoot, 'presentations');

  if (!existsSync(presentationsDir)) {
    console.error(`Error: No "presentations" folder found at ${presentationsDir}`);
    process.exit(1);
  }

  console.log(`Starting dashboard for project: ${projectRoot}`);
  console.log(`Presentations directory: ${presentationsDir}`);

  process.env.SUPASLIDEV_PROJECT_ROOT = projectRoot;
  process.env.SUPASLIDEV_PRESENTATIONS_DIR = presentationsDir;

  const generateScript = join(packageRoot, 'scripts', 'generate-presentations.mjs');
  const apiServer = join(packageRoot, 'server', 'api.js');

  const generate = spawn('node', [generateScript], {
    stdio: 'inherit',
    env: process.env,
  });

  generate.on('close', (code) => {
    if (code !== 0) {
      console.error('Failed to generate presentations data');
      process.exit(1);
    }

    const api = spawn('node', [apiServer], {
      stdio: 'inherit',
      env: process.env,
      detached: false,
    });

    const vite = spawn('npx', ['vite', '--config', join(packageRoot, 'vite.config.ts')], {
      cwd: packageRoot,
      stdio: 'inherit',
      env: process.env,
      shell: true,
    });

    const cleanup = (processes: ChildProcess[]) => {
      for (const proc of processes) {
        proc.kill('SIGTERM');
      }
      process.exit(0);
    };

    process.on('SIGINT', () => cleanup([api, vite]));
    process.on('SIGTERM', () => cleanup([api, vite]));
  });
}
