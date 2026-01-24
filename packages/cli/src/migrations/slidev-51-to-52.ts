import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MigrationContext } from './types.ts';

const SLIDEV_51_PATTERN = /^\^51\.\d+\.\d+$/;
const VUE_OLD_PATTERN = /^\^3\.5\.13$/;

interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

function findPresentationDirs(workspaceDir: string): string[] {
  const presentationsDir = join(workspaceDir, 'presentations');
  if (!existsSync(presentationsDir)) {
    return [];
  }

  const dirs: string[] = [];
  const entries = readdirSync(presentationsDir);

  for (const entry of entries) {
    const fullPath = join(presentationsDir, entry);
    const packageJsonPath = join(fullPath, 'package.json');

    if (statSync(fullPath).isDirectory() && existsSync(packageJsonPath)) {
      dirs.push(fullPath);
    }
  }

  return dirs;
}

function readPackageJson(path: string): PackageJson | null {
  try {
    const content = readFileSync(path, 'utf-8');
    return JSON.parse(content) as PackageJson;
  } catch {
    return null;
  }
}

function writePackageJson(path: string, pkg: PackageJson): void {
  writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
}

function hasSlidev51Pinned(pkg: PackageJson): boolean {
  const slidevVersion = pkg.dependencies?.['@slidev/cli'] ?? pkg.devDependencies?.['@slidev/cli'];
  return slidevVersion !== undefined && SLIDEV_51_PATTERN.test(slidevVersion);
}

export async function up(context: MigrationContext): Promise<void> {
  const { workspaceDir } = context;
  const presentationDirs = findPresentationDirs(workspaceDir);

  for (const dir of presentationDirs) {
    const packageJsonPath = join(dir, 'package.json');
    const pkg = readPackageJson(packageJsonPath);

    if (!pkg || !hasSlidev51Pinned(pkg)) {
      continue;
    }

    if (pkg.dependencies?.['@slidev/cli']) {
      pkg.dependencies['@slidev/cli'] = 'catalog:';
    }
    if (pkg.devDependencies?.['@slidev/cli']) {
      pkg.devDependencies['@slidev/cli'] = 'catalog:';
    }

    if (pkg.dependencies?.['vue'] && VUE_OLD_PATTERN.test(pkg.dependencies['vue'])) {
      pkg.dependencies['vue'] = 'catalog:';
    }
    if (pkg.devDependencies?.['vue'] && VUE_OLD_PATTERN.test(pkg.devDependencies['vue'])) {
      pkg.devDependencies['vue'] = 'catalog:';
    }

    writePackageJson(packageJsonPath, pkg);
  }
}
