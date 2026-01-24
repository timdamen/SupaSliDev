import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import type { MigrationContext, PresentationInfo } from './types.ts';

const SLIDEV_51_PATTERN = /^\^51\.\d+\.\d+$/;
const VUE_OLD_PATTERN = /^\^3\.5\.13$/;
const PINNED_SLIDEV_VERSION = '^52.11.3';
const PINNED_VUE_VERSION = '^3.5.26';

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

function getSlidevVersion(pkg: PackageJson): string | undefined {
  return pkg.dependencies?.['@slidev/cli'] ?? pkg.devDependencies?.['@slidev/cli'];
}

function hasSlidev51Pinned(pkg: PackageJson): boolean {
  const slidevVersion = getSlidevVersion(pkg);
  return slidevVersion !== undefined && SLIDEV_51_PATTERN.test(slidevVersion);
}

export function getAffectedPresentations(workspaceDir: string): PresentationInfo[] {
  const presentationDirs = findPresentationDirs(workspaceDir);
  const affected: PresentationInfo[] = [];

  for (const dir of presentationDirs) {
    const packageJsonPath = join(dir, 'package.json');
    const pkg = readPackageJson(packageJsonPath);

    if (!pkg || !hasSlidev51Pinned(pkg)) {
      continue;
    }

    const version = getSlidevVersion(pkg);
    affected.push({
      name: basename(dir),
      path: dir,
      currentVersion: version ?? 'unknown',
    });
  }

  return affected;
}

export async function up(context: MigrationContext): Promise<void> {
  const { workspaceDir, options } = context;
  const presentationDirs = findPresentationDirs(workspaceDir);

  const selectedForCatalog = (options?.selectedForCatalog as string[] | undefined) ?? [];
  const useInteractiveMode = options?.interactive === true;

  for (const dir of presentationDirs) {
    const packageJsonPath = join(dir, 'package.json');
    const pkg = readPackageJson(packageJsonPath);

    if (!pkg || !hasSlidev51Pinned(pkg)) {
      continue;
    }

    const presentationName = basename(dir);
    const useCatalog = !useInteractiveMode || selectedForCatalog.includes(presentationName);

    const slidevTarget = useCatalog ? 'catalog:' : PINNED_SLIDEV_VERSION;
    const vueTarget = useCatalog ? 'catalog:' : PINNED_VUE_VERSION;

    if (pkg.dependencies?.['@slidev/cli']) {
      pkg.dependencies['@slidev/cli'] = slidevTarget;
    }
    if (pkg.devDependencies?.['@slidev/cli']) {
      pkg.devDependencies['@slidev/cli'] = slidevTarget;
    }

    if (pkg.dependencies?.['vue'] && VUE_OLD_PATTERN.test(pkg.dependencies['vue'])) {
      pkg.dependencies['vue'] = vueTarget;
    }
    if (pkg.devDependencies?.['vue'] && VUE_OLD_PATTERN.test(pkg.devDependencies['vue'])) {
      pkg.devDependencies['vue'] = vueTarget;
    }

    writePackageJson(packageJsonPath, pkg);
  }
}
