import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parse as parseYaml } from 'yaml';

const CLI_VERSION = '0.1.0';
const STATE_DIR = '.supaslidev';
const STATE_FILE = 'state.json';

export interface AppliedMigration {
  id: string;
  appliedAt: string;
}

export interface DivergentDependency {
  dependency: string;
  pinnedVersion: string;
  catalogVersion: string;
}

export interface ImportedPresentation {
  name: string;
  importedAt: string;
  sourcePath: string;
  divergentDependencies: DivergentDependency[];
}

export interface StateSchema {
  cliVersion: string;
  createdAt: string;
  lastUpdatedAt: string;
  appliedMigrations: AppliedMigration[];
  importedPresentations?: ImportedPresentation[];
}

function getStatePath(workspaceDir: string): string {
  return join(workspaceDir, STATE_DIR, STATE_FILE);
}

function getStateDir(workspaceDir: string): string {
  return join(workspaceDir, STATE_DIR);
}

export function createInitialState(): StateSchema {
  const now = new Date().toISOString();
  return {
    cliVersion: CLI_VERSION,
    createdAt: now,
    lastUpdatedAt: now,
    appliedMigrations: [],
  };
}

export function readState(workspaceDir: string): StateSchema | null {
  const statePath = getStatePath(workspaceDir);

  if (!existsSync(statePath)) {
    return null;
  }

  try {
    const content = readFileSync(statePath, 'utf-8');
    return JSON.parse(content) as StateSchema;
  } catch {
    return null;
  }
}

export function writeState(workspaceDir: string, state: StateSchema): void {
  const stateDir = getStateDir(workspaceDir);
  const statePath = getStatePath(workspaceDir);

  if (!existsSync(stateDir)) {
    mkdirSync(stateDir, { recursive: true });
  }

  const updatedState: StateSchema = {
    ...state,
    lastUpdatedAt: new Date().toISOString(),
  };

  writeFileSync(statePath, JSON.stringify(updatedState, null, 2) + '\n', 'utf-8');
}

export function initializeState(workspaceDir: string): StateSchema {
  const state = createInitialState();
  writeState(workspaceDir, state);
  return state;
}

export function stateExists(workspaceDir: string): boolean {
  return existsSync(getStatePath(workspaceDir));
}

export function addMigration(workspaceDir: string, migrationId: string): void {
  const state = readState(workspaceDir);

  if (!state) {
    throw new Error('State file not found. Is this a Supaslidev workspace?');
  }

  const alreadyApplied = state.appliedMigrations.some((m) => m.id === migrationId);
  if (alreadyApplied) {
    return;
  }

  state.appliedMigrations.push({
    id: migrationId,
    appliedAt: new Date().toISOString(),
  });

  writeState(workspaceDir, state);
}

export function hasMigration(workspaceDir: string, migrationId: string): boolean {
  const state = readState(workspaceDir);

  if (!state) {
    return false;
  }

  return state.appliedMigrations.some((m) => m.id === migrationId);
}

export function updateCliVersion(workspaceDir: string): void {
  const state = readState(workspaceDir);

  if (!state) {
    throw new Error('State file not found. Is this a Supaslidev workspace?');
  }

  state.cliVersion = CLI_VERSION;
  writeState(workspaceDir, state);
}

export function findWorkspaceRoot(startDir: string = process.cwd()): string | null {
  let currentDir = startDir;

  while (currentDir !== dirname(currentDir)) {
    if (stateExists(currentDir)) {
      return currentDir;
    }
    currentDir = dirname(currentDir);
  }

  return null;
}

export function addImportedPresentation(
  workspaceDir: string,
  presentation: ImportedPresentation,
): void {
  const state = readState(workspaceDir);

  if (!state) {
    throw new Error('State file not found. Is this a Supaslidev workspace?');
  }

  if (!state.importedPresentations) {
    state.importedPresentations = [];
  }

  const existingIndex = state.importedPresentations.findIndex((p) => p.name === presentation.name);

  if (existingIndex >= 0) {
    state.importedPresentations[existingIndex] = presentation;
  } else {
    state.importedPresentations.push(presentation);
  }

  writeState(workspaceDir, state);
}

export function getImportedPresentations(workspaceDir: string): ImportedPresentation[] {
  const state = readState(workspaceDir);
  return state?.importedPresentations ?? [];
}

export function removeImportedPresentation(workspaceDir: string, name: string): void {
  const state = readState(workspaceDir);

  if (!state) {
    throw new Error('State file not found. Is this a Supaslidev workspace?');
  }

  if (!state.importedPresentations) {
    return;
  }

  state.importedPresentations = state.importedPresentations.filter((p) => p.name !== name);
  writeState(workspaceDir, state);
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface PnpmWorkspace {
  catalog?: Record<string, string>;
}

function getCatalog(workspaceDir: string): Record<string, string> {
  const workspaceYamlPath = join(workspaceDir, 'pnpm-workspace.yaml');

  if (!existsSync(workspaceYamlPath)) {
    return {};
  }

  const content = readFileSync(workspaceYamlPath, 'utf-8');
  const workspace = parseYaml(content) as PnpmWorkspace;

  return workspace.catalog ?? {};
}

function getVersionDivergences(
  workspaceDir: string,
  presentationName: string,
): DivergentDependency[] {
  const presentationDir = join(workspaceDir, 'presentations', presentationName);
  const packageJsonPath = join(presentationDir, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return [];
  }

  const catalog = getCatalog(workspaceDir);
  if (Object.keys(catalog).length === 0) {
    return [];
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as PackageJson;
  const divergences: DivergentDependency[] = [];

  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  for (const [dep, version] of Object.entries(allDeps)) {
    if (version === 'catalog:' || version === 'catalog:default') {
      continue;
    }

    const catalogVersion = catalog[dep];
    if (catalogVersion && version !== catalogVersion) {
      divergences.push({
        dependency: dep,
        pinnedVersion: version,
        catalogVersion,
      });
    }
  }

  return divergences;
}

function presentationExists(workspaceDir: string, name: string): boolean {
  const presentationDir = join(workspaceDir, 'presentations', name);
  return existsSync(presentationDir) && statSync(presentationDir).isDirectory();
}

export function updateImportedPresentationDivergences(workspaceDir: string): void {
  const state = readState(workspaceDir);

  if (!state || !state.importedPresentations || state.importedPresentations.length === 0) {
    return;
  }

  let changed = false;

  for (const presentation of state.importedPresentations) {
    if (!presentationExists(workspaceDir, presentation.name)) {
      continue;
    }

    const currentDivergences = getVersionDivergences(workspaceDir, presentation.name);
    const previousCount = presentation.divergentDependencies.length;
    const currentCount = currentDivergences.length;

    if (
      previousCount !== currentCount ||
      JSON.stringify(presentation.divergentDependencies) !== JSON.stringify(currentDivergences)
    ) {
      presentation.divergentDependencies = currentDivergences;
      changed = true;
    }
  }

  if (changed) {
    writeState(workspaceDir, state);
  }
}
