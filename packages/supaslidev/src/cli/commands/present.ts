import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { findProjectRoot, getVersionDivergences, printVersionDivergenceWarning } from '../utils.js';

function getPresentations(presentationsDir: string): string[] {
  if (!existsSync(presentationsDir)) {
    return [];
  }

  return readdirSync(presentationsDir)
    .filter((name) => {
      const fullPath = join(presentationsDir, name);
      return statSync(fullPath).isDirectory() && existsSync(join(fullPath, 'slides.md'));
    })
    .sort();
}

function printAvailable(presentations: string[]): void {
  console.error('\nAvailable presentations:');

  if (presentations.length === 0) {
    console.error('  No presentations found');
  } else {
    presentations.forEach((name) => {
      console.error(`  ${name}`);
    });
  }
}

export async function present(name: string): Promise<void> {
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

  const presentations = getPresentations(presentationsDir);

  if (!presentations.includes(name)) {
    console.error(`Error: Presentation "${name}" not found`);
    printAvailable(presentations);
    process.exit(1);
  }

  const packageName = `@supaslidev/${name}`;

  const divergences = getVersionDivergences(projectRoot, name);
  printVersionDivergenceWarning(divergences);

  console.log(`\nStarting dev server for ${name}...\n`);

  return new Promise((resolve, reject) => {
    const pnpm = spawn('pnpm', ['--filter', packageName, 'dev'], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true,
    });

    pnpm.on('error', (err) => {
      console.error(`Failed to start dev server: ${err.message}`);
      reject(err);
    });

    pnpm.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}`));
        return;
      }
      resolve();
    });
  });
}
