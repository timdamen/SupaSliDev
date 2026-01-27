import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { transformPackageJson } from '../../src/cli/commands/import.js';
import {
  createTestProjectDir,
  createMockSlidevProject,
  cleanupTestDir,
} from '../helpers/import-test-helpers.js';

describe('transformPackageJson', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = createTestProjectDir('transform-package-json');
  });

  afterEach(() => {
    cleanupTestDir(testDir);
  });

  it('sets package name to @supaslidev/{name} format', () => {
    const projectDir = join(testDir, 'project');
    createMockSlidevProject(projectDir);

    const result = JSON.parse(transformPackageJson(projectDir, 'my-presentation'));

    expect(result.name).toBe('@supaslidev/my-presentation');
  });

  it('sets private to true', () => {
    const projectDir = join(testDir, 'project');
    createMockSlidevProject(projectDir, {
      packageJson: { private: false },
    });

    const result = JSON.parse(transformPackageJson(projectDir, 'my-presentation'));

    expect(result.private).toBe(true);
  });

  it('sets correct scripts for supaslidev workspace', () => {
    const projectDir = join(testDir, 'project');
    createMockSlidevProject(projectDir, {
      packageJson: {
        scripts: {
          dev: 'original-dev',
          build: 'original-build',
          custom: 'custom-script',
        },
      },
    });

    const result = JSON.parse(transformPackageJson(projectDir, 'my-presentation'));

    expect(result.scripts).toEqual({
      dev: 'slidev --open',
      build: 'slidev build',
      export: 'slidev export',
    });
  });

  it('preserves existing dependencies', () => {
    const projectDir = join(testDir, 'project');
    createMockSlidevProject(projectDir, {
      packageJson: {
        dependencies: {
          '@slidev/cli': '^0.50.0',
          '@slidev/theme-default': '^0.25.0',
          vue: '^3.5.0',
        },
      },
    });

    const result = JSON.parse(transformPackageJson(projectDir, 'my-presentation'));

    expect(result.dependencies).toEqual({
      '@slidev/cli': '^0.50.0',
      '@slidev/theme-default': '^0.25.0',
      vue: '^3.5.0',
    });
  });

  it('preserves existing devDependencies', () => {
    const projectDir = join(testDir, 'project');
    createMockSlidevProject(projectDir, {
      packageJson: {
        devDependencies: {
          typescript: '^5.0.0',
          '@types/node': '^20.0.0',
        },
      },
    });

    const result = JSON.parse(transformPackageJson(projectDir, 'my-presentation'));

    expect(result.devDependencies).toEqual({
      typescript: '^5.0.0',
      '@types/node': '^20.0.0',
    });
  });

  it('handles package.json without dependencies gracefully', () => {
    const projectDir = join(testDir, 'project');
    createMockSlidevProject(projectDir, {
      packageJson: {
        name: 'minimal-project',
        version: '1.0.0',
        dependencies: undefined,
        devDependencies: undefined,
      },
    });

    const result = JSON.parse(transformPackageJson(projectDir, 'my-presentation'));

    expect(result.name).toBe('@supaslidev/my-presentation');
    expect(result.private).toBe(true);
    expect(result.scripts).toEqual({
      dev: 'slidev --open',
      build: 'slidev build',
      export: 'slidev export',
    });
    expect(result.dependencies).toBeUndefined();
    expect(result.devDependencies).toBeUndefined();
  });
});
