#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const presentationsDir = join(rootDir, 'presentations');

const CATALOG_DEPENDENCIES = [
  '@slidev/cli',
  '@slidev/theme-default',
  '@slidev/theme-seriph',
  'vue',
  '@vue/compiler-sfc',
  'typescript',
  'vue-tsc',
];

function printUsage() {
  console.error('Usage: pnpm create:presentation <name>');
  console.error('\nThis invokes the Slidev wizard to create a new presentation.');
}

function validateName(name) {
  if (!/^[a-z0-9-]+$/.test(name)) {
    console.error('Error: Name must be lowercase alphanumeric with hyphens only');
    process.exit(1);
  }
  if (name.startsWith('-') || name.endsWith('-')) {
    console.error('Error: Name cannot start or end with a hyphen');
    process.exit(1);
  }
}

function updatePackageJson(presentationPath, name) {
  const packageJsonPath = join(presentationPath, 'package.json');

  if (!existsSync(packageJsonPath)) {
    console.warn('Warning: package.json not found, skipping catalog update');
    return;
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  packageJson.name = `@supaslidev/${name}`;
  packageJson.private = true;

  for (const dep of CATALOG_DEPENDENCIES) {
    if (packageJson.dependencies?.[dep]) {
      packageJson.dependencies[dep] = 'catalog:';
    }
    if (packageJson.devDependencies?.[dep]) {
      packageJson.devDependencies[dep] = 'catalog:';
    }
  }

  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');
  console.log('\nUpdated package.json to use catalog versions');
}

function runSlidevWizard(name) {
  return new Promise((resolve, reject) => {
    console.log(`\nCreating presentation "${name}" using Slidev wizard...\n`);

    const child = spawn('pnpm', ['create', 'slidev@latest', name], {
      cwd: presentationsDir,
      stdio: 'inherit',
      shell: true,
    });

    child.on('error', reject);

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Slidev wizard exited with code ${code}`));
      }
    });
  });
}

async function createPresentation(name) {
  const presentationPath = join(presentationsDir, name);

  if (existsSync(presentationPath)) {
    console.error(`Error: Presentation "${name}" already exists`);
    process.exit(1);
  }

  try {
    await runSlidevWizard(name);

    updatePackageJson(presentationPath, name);

    console.log(`\nPresentation created at presentations/${name}/`);
    console.log(`\nNext steps:`);
    console.log(`  pnpm install`);
    console.log(`  pnpm dev ${name}`);
  } catch (error) {
    console.error(`\nFailed to create presentation: ${error.message}`);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const name = args[0];

  if (!name) {
    console.error('Error: Presentation name is required');
    printUsage();
    process.exit(1);
  }

  validateName(name);
  await createPresentation(name);
}

main();
