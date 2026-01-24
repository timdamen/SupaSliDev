import { spawn } from 'node:child_process';
import { join, basename, resolve } from 'node:path';
import {
  existsSync,
  readdirSync,
  statSync,
  mkdirSync,
  cpSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { addImportedPresentation, findWorkspaceRoot } from 'create-supaslidev';
import { findProjectRoot, getPresentations, getVersionDivergences } from '../utils.js';

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  '.nuxt',
  '.output',
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  '.DS_Store',
];

interface PackageJson {
  name?: string;
  private?: boolean;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

function validateName(name: string): void {
  if (!/^[a-z0-9-]+$/.test(name)) {
    throw new Error('Name must be lowercase alphanumeric with hyphens only');
  }
  if (name.startsWith('-') || name.endsWith('-')) {
    throw new Error('Name cannot start or end with a hyphen');
  }
}

function validateSourceDirectory(sourcePath: string): void {
  if (!existsSync(sourcePath)) {
    throw new Error(`Source directory does not exist: ${sourcePath}`);
  }

  if (!statSync(sourcePath).isDirectory()) {
    throw new Error(`Source path is not a directory: ${sourcePath}`);
  }

  const slidesPath = join(sourcePath, 'slides.md');
  if (!existsSync(slidesPath)) {
    throw new Error(`No slides.md found in source directory: ${sourcePath}`);
  }

  const packageJsonPath = join(sourcePath, 'package.json');
  if (!existsSync(packageJsonPath)) {
    throw new Error(`No package.json found in source directory: ${sourcePath}`);
  }
}

function shouldIgnore(name: string): boolean {
  return IGNORE_PATTERNS.includes(name);
}

function copyDirectorySelective(source: string, destination: string): void {
  mkdirSync(destination, { recursive: true });

  const entries = readdirSync(source);

  for (const entry of entries) {
    if (shouldIgnore(entry)) {
      continue;
    }

    const sourcePath = join(source, entry);
    const destPath = join(destination, entry);
    const stat = statSync(sourcePath);

    if (stat.isDirectory()) {
      cpSync(sourcePath, destPath, { recursive: true });
    } else {
      cpSync(sourcePath, destPath);
    }
  }
}

function transformPackageJson(sourcePath: string, name: string): string {
  const packageJsonPath = join(sourcePath, 'package.json');
  const content = readFileSync(packageJsonPath, 'utf-8');
  const packageJson = JSON.parse(content) as PackageJson;

  packageJson.name = `@supaslidev/${name}`;
  packageJson.private = true;

  packageJson.scripts = {
    dev: 'slidev --open',
    build: 'slidev build',
    export: 'slidev export',
  };

  return JSON.stringify(packageJson, null, 2) + '\n';
}

function runPnpmInstall(projectRoot: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('\nRunning pnpm install...');

    const child = spawn('pnpm', ['install'], {
      cwd: projectRoot,
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`pnpm install failed with exit code ${code}`));
        return;
      }
      resolve();
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

export interface ImportOptions {
  name?: string;
  install?: boolean;
}

export async function importPresentation(
  source: string,
  options: ImportOptions = {},
): Promise<void> {
  const { name, install = true } = options;
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

  const sourcePath = resolve(source);

  try {
    validateSourceDirectory(sourcePath);
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : 'Invalid source'}`);
    process.exit(1);
  }

  const presentationName =
    name ??
    basename(sourcePath)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-');

  try {
    validateName(presentationName);
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : 'Invalid name'}`);
    process.exit(1);
  }

  const existingPresentations = getPresentations(presentationsDir);
  if (existingPresentations.includes(presentationName)) {
    console.error(`Error: Presentation "${presentationName}" already exists`);
    process.exit(1);
  }

  const destinationPath = join(presentationsDir, presentationName);

  console.log(`Importing presentation from: ${sourcePath}`);
  console.log(`Destination: ${destinationPath}`);

  copyDirectorySelective(sourcePath, destinationPath);

  const transformedPackageJson = transformPackageJson(sourcePath, presentationName);
  writeFileSync(join(destinationPath, 'package.json'), transformedPackageJson);

  console.log('\nFiles copied successfully!');
  console.log('Ignored: ' + IGNORE_PATTERNS.join(', '));

  if (install) {
    await runPnpmInstall(projectRoot);
  } else {
    console.log(
      '\nSkipped pnpm install. Run "pnpm install" manually before using the presentation.',
    );
  }

  const workspaceRoot = findWorkspaceRoot(projectRoot);
  if (workspaceRoot) {
    const divergences = getVersionDivergences(projectRoot, presentationName);
    addImportedPresentation(workspaceRoot, {
      name: presentationName,
      importedAt: new Date().toISOString(),
      sourcePath,
      divergentDependencies: divergences,
    });
  }

  console.log('\nPresentation imported successfully!');
  console.log(`Run "supaslidev present ${presentationName}" to start a dev server.`);
}
