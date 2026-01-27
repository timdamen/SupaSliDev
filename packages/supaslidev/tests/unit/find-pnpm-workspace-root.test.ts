import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { findPnpmWorkspaceRoot } from '../../src/cli/commands/import.js';

const TEST_BASE_DIR = join(tmpdir(), 'supaslidev-pnpm-root-tests');

function createTestDir(name: string): string {
  const testDir = join(TEST_BASE_DIR, name, Date.now().toString());
  mkdirSync(testDir, { recursive: true });
  return testDir;
}

function cleanupTestDir(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

describe('findPnpmWorkspaceRoot', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = createTestDir('pnpm-root');
  });

  afterEach(() => {
    cleanupTestDir(testDir);
  });

  it('finds pnpm-workspace.yaml in current directory', () => {
    writeFileSync(join(testDir, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n');

    const result = findPnpmWorkspaceRoot(testDir);

    expect(result).toBe(testDir);
  });

  it('finds pnpm-workspace.yaml in parent directory', () => {
    writeFileSync(join(testDir, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n');
    const childDir = join(testDir, 'packages', 'my-package');
    mkdirSync(childDir, { recursive: true });

    const result = findPnpmWorkspaceRoot(childDir);

    expect(result).toBe(testDir);
  });

  it('finds pnpm-workspace.yaml multiple levels up', () => {
    writeFileSync(join(testDir, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n');
    const deepDir = join(testDir, 'packages', 'my-package', 'src', 'components');
    mkdirSync(deepDir, { recursive: true });

    const result = findPnpmWorkspaceRoot(deepDir);

    expect(result).toBe(testDir);
  });

  it('returns null when no workspace root found', () => {
    const result = findPnpmWorkspaceRoot(testDir);

    expect(result).toBeNull();
  });

  it('stops searching at filesystem root', () => {
    const result = findPnpmWorkspaceRoot('/');

    expect(result).toBeNull();
  });

  it('returns closest workspace root when nested workspaces exist', () => {
    writeFileSync(join(testDir, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n');
    const nestedWorkspace = join(testDir, 'packages', 'nested-workspace');
    mkdirSync(nestedWorkspace, { recursive: true });
    writeFileSync(join(nestedWorkspace, 'pnpm-workspace.yaml'), 'packages:\n  - apps/*\n');
    const searchDir = join(nestedWorkspace, 'apps', 'my-app');
    mkdirSync(searchDir, { recursive: true });

    const result = findPnpmWorkspaceRoot(searchDir);

    expect(result).toBe(nestedWorkspace);
  });
});
