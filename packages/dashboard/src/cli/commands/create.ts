import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';

function findProjectRoot(): string | null {
  let dir = process.cwd();

  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, 'presentations')) && existsSync(join(dir, 'package.json'))) {
      return dir;
    }
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) {
      return dir;
    }
    dir = dirname(dir);
  }

  if (existsSync(join(process.cwd(), 'presentations'))) {
    return process.cwd();
  }

  return null;
}

export async function create(name?: string): Promise<void> {
  const projectRoot = findProjectRoot();

  if (!projectRoot) {
    console.error('Error: Could not find a supaSliDev project.');
    console.error('Make sure you are in a directory with a "presentations" folder.');
    process.exit(1);
  }

  const presentationsDir = join(projectRoot, 'presentations');

  if (!existsSync(presentationsDir)) {
    console.error(`Error: No "presentations" folder found at ${presentationsDir}`);
    process.exit(1);
  }

  const args = ['create', 'slidev'];
  if (name) {
    args.push(name);
  }

  console.log(`Creating new presentation in: ${presentationsDir}`);

  const child = spawn('pnpm', args, {
    cwd: presentationsDir,
    stdio: 'inherit',
    shell: true,
  });

  child.on('close', (code) => {
    if (code !== 0) {
      console.error(`Failed to create presentation (exit code: ${code})`);
      process.exit(1);
    }
    console.log('\nPresentation created successfully!');
    console.log('Run "supaslidev" to start the dashboard and view your presentations.');
  });

  child.on('error', (err) => {
    console.error('Failed to create presentation:', err.message);
    process.exit(1);
  });
}
