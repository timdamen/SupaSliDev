import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';

export interface ExportOptions {
  output?: string;
}

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

function printAvailablePresentations(presentations: string[]): void {
  console.error('\nAvailable presentations:');

  if (presentations.length === 0) {
    console.error('  No presentations found');
  } else {
    for (const name of presentations) {
      console.error(`  ${name}`);
    }
  }
}

export async function exportPdf(name: string, options: ExportOptions): Promise<void> {
  const projectRoot = findProjectRoot();

  if (!projectRoot) {
    console.error('Error: Could not find a supaSliDev project.');
    console.error('Make sure you are in a directory with a "presentations" folder.');
    process.exit(1);
  }

  const presentationsDir = join(projectRoot, 'presentations');
  const distDir = join(projectRoot, 'dist');
  const presentations = getPresentations(presentationsDir);

  if (!presentations.includes(name)) {
    console.error(`Error: Presentation "${name}" not found`);
    printAvailablePresentations(presentations);
    process.exit(1);
  }

  const presentationDir = join(presentationsDir, name);
  const outputPath = options.output ?? join(distDir, `${name}.pdf`);

  if (!existsSync(dirname(outputPath))) {
    mkdirSync(dirname(outputPath), { recursive: true });
  }

  console.log('\n' + '='.repeat(50));
  console.log(`  Exporting PDF: ${name}`);
  console.log(`  Output: ${outputPath}`);
  console.log('='.repeat(50) + '\n');

  const slidev = spawn('npx', ['slidev', 'export', '--output', outputPath], {
    cwd: presentationDir,
    stdio: 'inherit',
    shell: true,
  });

  slidev.on('error', (err) => {
    console.error(`Failed to export presentation: ${err.message}`);
    process.exit(1);
  });

  slidev.on('close', (code) => {
    if (code !== 0) {
      console.error(`\nExport failed with exit code ${code}`);
      process.exit(code ?? 1);
    }

    console.log('\n' + '='.repeat(50));
    console.log(`  Export complete!`);
    console.log(`  Output: ${outputPath}`);
    console.log('='.repeat(50) + '\n');
  });
}
