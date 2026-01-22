import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { findProjectRoot } from '../utils.js';

function validateName(name: string): void {
  if (!/^[a-z0-9-]+$/.test(name)) {
    throw new Error('Name must be lowercase alphanumeric with hyphens only');
  }
  if (name.startsWith('-') || name.endsWith('-')) {
    throw new Error('Name cannot start or end with a hyphen');
  }
}

export async function create(name?: string): Promise<void> {
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

  if (name) {
    try {
      validateName(name);
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : 'Invalid name'}`);
      process.exit(1);
    }
  }

  const args = ['create', 'slidev'];
  if (name) {
    args.push(name);
  }

  console.log(`Creating new presentation in: ${presentationsDir}`);

  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', args, {
      cwd: presentationsDir,
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      if (code !== 0) {
        console.error(`Failed to create presentation (exit code: ${code})`);
        reject(new Error(`Process exited with code ${code}`));
        return;
      }
      console.log('\nPresentation created successfully!');
      console.log('Run "supaslidev" to start the dashboard and view your presentations.');
      resolve();
    });

    child.on('error', (err) => {
      console.error('Failed to create presentation:', err.message);
      reject(err);
    });
  });
}
