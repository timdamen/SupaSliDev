import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateSourceDirectory } from '../../src/cli/commands/import.js';
import {
  createTestProjectDir,
  createMockSlidevProject,
  cleanupTestDir,
} from '../helpers/import-test-helpers.js';

describe('validateSourceDirectory', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = createTestProjectDir('validate-source');
  });

  afterEach(() => {
    cleanupTestDir(testDir);
  });

  it('throws error for non-existent path', () => {
    const nonExistentPath = join(testDir, 'does-not-exist');

    expect(() => validateSourceDirectory(nonExistentPath)).toThrow(
      `Source directory does not exist: ${nonExistentPath}`,
    );
  });

  it('throws error when path is not a directory', () => {
    const filePath = join(testDir, 'not-a-directory.txt');
    writeFileSync(filePath, 'just a file');

    expect(() => validateSourceDirectory(filePath)).toThrow(
      `Source path is not a directory: ${filePath}`,
    );
  });

  it('throws error when slides.md is missing', () => {
    const projectDir = join(testDir, 'no-slides');
    mkdirSync(projectDir, { recursive: true });
    writeFileSync(join(projectDir, 'package.json'), '{}');

    expect(() => validateSourceDirectory(projectDir)).toThrow(
      `No slides.md found in source directory: ${projectDir}`,
    );
  });

  it('throws error when package.json is missing', () => {
    const projectDir = join(testDir, 'no-package');
    mkdirSync(projectDir, { recursive: true });
    writeFileSync(join(projectDir, 'slides.md'), '# Test');

    expect(() => validateSourceDirectory(projectDir)).toThrow(
      `No package.json found in source directory: ${projectDir}`,
    );
  });

  it('succeeds for valid Slidev project', () => {
    const projectDir = join(testDir, 'valid-project');
    createMockSlidevProject(projectDir);

    expect(() => validateSourceDirectory(projectDir)).not.toThrow();
  });
});
