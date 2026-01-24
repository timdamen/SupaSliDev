import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createInitialState, writeState, readState } from '../../src/state.js';
import { writeManifest } from '../../src/migrations/manifest.js';
import { run } from '../../src/migrations/runner.js';
import type { Migration } from '../../src/migrations/types.js';
import { up } from '../../src/migrations/slidev-51-to-52.js';

const TEST_DIR = join(tmpdir(), 'supaslidev-e2e-slidev-51-to-52');

function cleanTestDir(): void {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

function createTestWorkspace(): string {
  const workspaceDir = join(TEST_DIR, 'test-workspace');
  mkdirSync(join(workspaceDir, '.supaslidev'), { recursive: true });

  const state = createInitialState();
  writeState(workspaceDir, state);

  writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify({ name: 'test' }, null, 2));

  return workspaceDir;
}

function createMigrationsDir(workspaceDir: string): string {
  const migrationsDir = join(workspaceDir, '.supaslidev', 'migrations');
  mkdirSync(migrationsDir, { recursive: true });
  return migrationsDir;
}

function createPresentation(
  workspaceDir: string,
  name: string,
  packageJson: Record<string, unknown>,
): void {
  const presentationDir = join(workspaceDir, 'presentations', name);
  mkdirSync(presentationDir, { recursive: true });
  writeFileSync(join(presentationDir, 'package.json'), JSON.stringify(packageJson, null, 2) + '\n');
}

function readPresentationPackageJson(workspaceDir: string, name: string): Record<string, unknown> {
  const content = readFileSync(join(workspaceDir, 'presentations', name, 'package.json'), 'utf-8');
  return JSON.parse(content);
}

describe('Slidev 51 to 52 Migration', () => {
  beforeEach(() => {
    cleanTestDir();
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    cleanTestDir();
  });

  it('identifies and migrates presentations with Slidev 51.x pinned', async () => {
    const workspaceDir = createTestWorkspace();
    const migrationsDir = createMigrationsDir(workspaceDir);

    createPresentation(workspaceDir, 'legacy-deck', {
      name: '@supaslidev/legacy-deck',
      dependencies: {
        '@slidev/cli': '^51.5.0',
        vue: '^3.5.13',
      },
    });

    const manifest = {
      version: '1.0.0',
      migrations: [
        {
          id: 'slidev-51-to-52',
          description: 'Migrate Slidev 51.x to 52.x',
          version: '0.1.0',
        },
      ],
    };
    writeManifest(migrationsDir, manifest);

    const migrations: Migration[] = [
      {
        id: 'slidev-51-to-52',
        description: 'Migrate Slidev 51.x to 52.x',
        up,
      },
    ];

    const result = await run({
      workspaceDir,
      migrationsDir,
      apply: true,
      migrations,
    });

    expect(result.success).toBe(true);
    expect(result.applied).toHaveLength(1);

    const pkg = readPresentationPackageJson(workspaceDir, 'legacy-deck');
    expect((pkg.dependencies as Record<string, string>)['@slidev/cli']).toBe('catalog:');
    expect((pkg.dependencies as Record<string, string>)['vue']).toBe('catalog:');

    const state = readState(workspaceDir);
    expect(state?.appliedMigrations.some((m) => m.id === 'slidev-51-to-52')).toBe(true);
  });

  it('updates @slidev/cli from ^51.x.x to catalog:', async () => {
    const workspaceDir = createTestWorkspace();
    const migrationsDir = createMigrationsDir(workspaceDir);

    createPresentation(workspaceDir, 'test-deck', {
      name: '@supaslidev/test-deck',
      dependencies: {
        '@slidev/cli': '^51.0.0',
        '@slidev/theme-default': 'catalog:',
      },
    });

    const manifest = {
      version: '1.0.0',
      migrations: [
        { id: 'slidev-51-to-52', description: 'Migrate Slidev 51.x to 52.x', version: '0.1.0' },
      ],
    };
    writeManifest(migrationsDir, manifest);

    const migrations: Migration[] = [
      { id: 'slidev-51-to-52', description: 'Migrate Slidev 51.x to 52.x', up },
    ];

    await run({ workspaceDir, migrationsDir, apply: true, migrations });

    const pkg = readPresentationPackageJson(workspaceDir, 'test-deck');
    expect((pkg.dependencies as Record<string, string>)['@slidev/cli']).toBe('catalog:');
  });

  it('updates vue from ^3.5.13 to catalog:', async () => {
    const workspaceDir = createTestWorkspace();
    const migrationsDir = createMigrationsDir(workspaceDir);

    createPresentation(workspaceDir, 'test-deck', {
      name: '@supaslidev/test-deck',
      dependencies: {
        '@slidev/cli': '^51.2.3',
        vue: '^3.5.13',
      },
    });

    const manifest = {
      version: '1.0.0',
      migrations: [
        { id: 'slidev-51-to-52', description: 'Migrate Slidev 51.x to 52.x', version: '0.1.0' },
      ],
    };
    writeManifest(migrationsDir, manifest);

    const migrations: Migration[] = [
      { id: 'slidev-51-to-52', description: 'Migrate Slidev 51.x to 52.x', up },
    ];

    await run({ workspaceDir, migrationsDir, apply: true, migrations });

    const pkg = readPresentationPackageJson(workspaceDir, 'test-deck');
    expect((pkg.dependencies as Record<string, string>)['vue']).toBe('catalog:');
  });

  it('preserves custom dependencies unchanged', async () => {
    const workspaceDir = createTestWorkspace();
    const migrationsDir = createMigrationsDir(workspaceDir);

    createPresentation(workspaceDir, 'themed-deck', {
      name: '@supaslidev/themed-deck',
      dependencies: {
        '@slidev/cli': '^51.1.0',
        '@slidev/theme-apple-basic': '^1.0.0',
        '@slidev/theme-default': 'catalog:',
        vue: '^3.5.13',
        'custom-package': '^2.0.0',
      },
    });

    const manifest = {
      version: '1.0.0',
      migrations: [
        { id: 'slidev-51-to-52', description: 'Migrate Slidev 51.x to 52.x', version: '0.1.0' },
      ],
    };
    writeManifest(migrationsDir, manifest);

    const migrations: Migration[] = [
      { id: 'slidev-51-to-52', description: 'Migrate Slidev 51.x to 52.x', up },
    ];

    await run({ workspaceDir, migrationsDir, apply: true, migrations });

    const pkg = readPresentationPackageJson(workspaceDir, 'themed-deck');
    const deps = pkg.dependencies as Record<string, string>;

    expect(deps['@slidev/cli']).toBe('catalog:');
    expect(deps['vue']).toBe('catalog:');
    expect(deps['@slidev/theme-apple-basic']).toBe('^1.0.0');
    expect(deps['@slidev/theme-default']).toBe('catalog:');
    expect(deps['custom-package']).toBe('^2.0.0');
  });

  it('skips presentations without Slidev 51.x', async () => {
    const workspaceDir = createTestWorkspace();
    const migrationsDir = createMigrationsDir(workspaceDir);

    createPresentation(workspaceDir, 'already-updated', {
      name: '@supaslidev/already-updated',
      dependencies: {
        '@slidev/cli': 'catalog:',
        vue: 'catalog:',
      },
    });

    createPresentation(workspaceDir, 'different-version', {
      name: '@supaslidev/different-version',
      dependencies: {
        '@slidev/cli': '^52.11.3',
        vue: '^3.5.26',
      },
    });

    const manifest = {
      version: '1.0.0',
      migrations: [
        { id: 'slidev-51-to-52', description: 'Migrate Slidev 51.x to 52.x', version: '0.1.0' },
      ],
    };
    writeManifest(migrationsDir, manifest);

    const migrations: Migration[] = [
      { id: 'slidev-51-to-52', description: 'Migrate Slidev 51.x to 52.x', up },
    ];

    await run({ workspaceDir, migrationsDir, apply: true, migrations });

    const pkg1 = readPresentationPackageJson(workspaceDir, 'already-updated');
    expect((pkg1.dependencies as Record<string, string>)['@slidev/cli']).toBe('catalog:');

    const pkg2 = readPresentationPackageJson(workspaceDir, 'different-version');
    expect((pkg2.dependencies as Record<string, string>)['@slidev/cli']).toBe('^52.11.3');
    expect((pkg2.dependencies as Record<string, string>)['vue']).toBe('^3.5.26');
  });

  it('handles presentations with devDependencies', async () => {
    const workspaceDir = createTestWorkspace();
    const migrationsDir = createMigrationsDir(workspaceDir);

    createPresentation(workspaceDir, 'dev-deps-deck', {
      name: '@supaslidev/dev-deps-deck',
      dependencies: {},
      devDependencies: {
        '@slidev/cli': '^51.3.0',
        vue: '^3.5.13',
      },
    });

    const manifest = {
      version: '1.0.0',
      migrations: [
        { id: 'slidev-51-to-52', description: 'Migrate Slidev 51.x to 52.x', version: '0.1.0' },
      ],
    };
    writeManifest(migrationsDir, manifest);

    const migrations: Migration[] = [
      { id: 'slidev-51-to-52', description: 'Migrate Slidev 51.x to 52.x', up },
    ];

    await run({ workspaceDir, migrationsDir, apply: true, migrations });

    const pkg = readPresentationPackageJson(workspaceDir, 'dev-deps-deck');
    const devDeps = pkg.devDependencies as Record<string, string>;
    expect(devDeps['@slidev/cli']).toBe('catalog:');
    expect(devDeps['vue']).toBe('catalog:');
  });

  it('handles workspace without presentations directory', async () => {
    const workspaceDir = createTestWorkspace();
    const migrationsDir = createMigrationsDir(workspaceDir);

    const manifest = {
      version: '1.0.0',
      migrations: [
        { id: 'slidev-51-to-52', description: 'Migrate Slidev 51.x to 52.x', version: '0.1.0' },
      ],
    };
    writeManifest(migrationsDir, manifest);

    const migrations: Migration[] = [
      { id: 'slidev-51-to-52', description: 'Migrate Slidev 51.x to 52.x', up },
    ];

    const result = await run({ workspaceDir, migrationsDir, apply: true, migrations });

    expect(result.success).toBe(true);
    expect(result.applied).toHaveLength(1);
  });

  it('only updates vue if it matches ^3.5.13', async () => {
    const workspaceDir = createTestWorkspace();
    const migrationsDir = createMigrationsDir(workspaceDir);

    createPresentation(workspaceDir, 'different-vue', {
      name: '@supaslidev/different-vue',
      dependencies: {
        '@slidev/cli': '^51.1.0',
        vue: '^3.4.0',
      },
    });

    const manifest = {
      version: '1.0.0',
      migrations: [
        { id: 'slidev-51-to-52', description: 'Migrate Slidev 51.x to 52.x', version: '0.1.0' },
      ],
    };
    writeManifest(migrationsDir, manifest);

    const migrations: Migration[] = [
      { id: 'slidev-51-to-52', description: 'Migrate Slidev 51.x to 52.x', up },
    ];

    await run({ workspaceDir, migrationsDir, apply: true, migrations });

    const pkg = readPresentationPackageJson(workspaceDir, 'different-vue');
    const deps = pkg.dependencies as Record<string, string>;
    expect(deps['@slidev/cli']).toBe('catalog:');
    expect(deps['vue']).toBe('^3.4.0');
  });
});
