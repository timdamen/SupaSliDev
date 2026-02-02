import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { findProjectRoot } from '../utils.js';

function validateName(name: string): void {
  if (!/^[a-z0-9-]+$/.test(name)) {
    throw new Error('Name must be lowercase alphanumeric with hyphens only');
  }
  if (name.startsWith('-') || name.endsWith('-')) {
    throw new Error('Name cannot start or end with a hyphen');
  }
}

function checkDuplicateName(presentationsDir: string, name: string): void {
  const presentationPath = join(presentationsDir, name);
  if (existsSync(presentationPath)) {
    throw new Error(`Presentation "${name}" already exists`);
  }
}

function hasSharedPackage(projectRoot: string): boolean {
  const sharedPackagePath = join(projectRoot, 'packages', 'shared', 'package.json');
  return existsSync(sharedPackagePath);
}

function addSharedAddonToSlides(slidesPath: string): void {
  const content = readFileSync(slidesPath, 'utf-8');
  const frontmatterMatch = content.match(/^(---\n)([\s\S]*?)\n(---)/);
  if (!frontmatterMatch) return;

  const [fullMatch, openDelim, frontmatter, closeDelim] = frontmatterMatch;
  const restOfFile = content.slice(fullMatch.length);

  if (frontmatter.includes('addons:')) return;

  const themeMatch = frontmatter.match(/^(theme:\s*.+)$/m);
  if (themeMatch) {
    const updatedFrontmatter = frontmatter.replace(
      themeMatch[1],
      `${themeMatch[1]}\naddons:\n  - '@supaslidev/shared'`,
    );
    writeFileSync(slidesPath, `${openDelim}${updatedFrontmatter}\n${closeDelim}${restOfFile}`);
  }
}

function addSharedDependencyToPackageJson(packageJsonPath: string): void {
  const content = readFileSync(packageJsonPath, 'utf-8');
  const packageJson = JSON.parse(content);

  if (!packageJson.dependencies) {
    packageJson.dependencies = {};
  }

  if (!packageJson.dependencies['@supaslidev/shared']) {
    packageJson.dependencies['@supaslidev/shared'] = 'workspace:*';
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  }
}

function getExistingPresentations(presentationsDir: string): Set<string> {
  if (!existsSync(presentationsDir)) return new Set();
  return new Set(
    readdirSync(presentationsDir).filter((name) => {
      const fullPath = join(presentationsDir, name);
      return statSync(fullPath).isDirectory();
    }),
  );
}

function configureSharedPackage(projectRoot: string, presentationDir: string): void {
  if (!hasSharedPackage(projectRoot)) return;

  const slidesPath = join(presentationDir, 'slides.md');
  const packageJsonPath = join(presentationDir, 'package.json');

  if (existsSync(slidesPath)) {
    addSharedAddonToSlides(slidesPath);
  }

  if (existsSync(packageJsonPath)) {
    addSharedDependencyToPackageJson(packageJsonPath);
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
      checkDuplicateName(presentationsDir, name);
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : 'Invalid name'}`);
      process.exit(1);
    }
  }

  const existingPresentations = getExistingPresentations(presentationsDir);

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

      const presentationName = name ?? findNewPresentation(presentationsDir, existingPresentations);

      if (presentationName) {
        const presentationDir = join(presentationsDir, presentationName);
        configureSharedPackage(projectRoot, presentationDir);
      }

      console.log('\nPresentation created successfully!');
      console.log('Run "supaslidev present <name>" to start a dev server for your presentation.');
      resolve();
    });

    child.on('error', (err) => {
      console.error('Failed to create presentation:', err.message);
      reject(err);
    });
  });
}

function findNewPresentation(
  presentationsDir: string,
  existingPresentations: Set<string>,
): string | null {
  const currentPresentations = getExistingPresentations(presentationsDir);
  for (const name of currentPresentations) {
    if (!existingPresentations.has(name)) {
      return name;
    }
  }
  return null;
}
