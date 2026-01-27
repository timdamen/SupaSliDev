import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import {
  createTestProjectDir,
  createMockSlidevProject,
  cleanupTestDir,
} from '../helpers/import-test-helpers.js';

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

interface PathValidationResult {
  path: string;
  isValid: boolean;
  suggestedName: string | null;
  error: string | null;
}

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

function shouldIgnore(name: string): boolean {
  return IGNORE_PATTERNS.includes(name);
}

function validateSourceDirectory(sourcePath: string): ValidationResult {
  if (!existsSync(sourcePath)) {
    return { isValid: false, error: 'Source directory does not exist' };
  }

  const { statSync } = require('node:fs');
  if (!statSync(sourcePath).isDirectory()) {
    return { isValid: false, error: 'Source path is not a directory' };
  }

  const slidesPath = join(sourcePath, 'slides.md');
  if (!existsSync(slidesPath)) {
    return { isValid: false, error: 'No slides.md found in source directory' };
  }

  const packageJsonPath = join(sourcePath, 'package.json');
  if (!existsSync(packageJsonPath)) {
    return { isValid: false, error: 'No package.json found in source directory' };
  }

  return { isValid: true };
}

function validatePath(path: string): PathValidationResult {
  const sourcePath = resolve(path);
  const validation = validateSourceDirectory(sourcePath);

  if (!validation.isValid) {
    return {
      path,
      isValid: false,
      suggestedName: null,
      error: validation.error ?? null,
    };
  }

  const suggestedName = basename(sourcePath)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-');

  return {
    path,
    isValid: true,
    suggestedName,
    error: null,
  };
}

function validatePaths(paths: string[]): PathValidationResult[] {
  return paths.map(validatePath);
}

function copyDirectorySelective(source: string, destination: string): void {
  const { statSync, cpSync } = require('node:fs');
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

describe('API Validation Functions', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = createTestProjectDir('api-validation');
  });

  afterEach(() => {
    cleanupTestDir(testDir);
  });

  describe('validateSourceDirectory', () => {
    it('returns error for non-existent path', () => {
      const nonExistentPath = join(testDir, 'does-not-exist');

      const result = validateSourceDirectory(nonExistentPath);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Source directory does not exist');
    });

    it('returns error when path is not a directory', () => {
      const filePath = join(testDir, 'not-a-directory.txt');
      writeFileSync(filePath, 'just a file');

      const result = validateSourceDirectory(filePath);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Source path is not a directory');
    });

    it('returns error when slides.md is missing', () => {
      const projectDir = join(testDir, 'no-slides');
      mkdirSync(projectDir, { recursive: true });
      writeFileSync(join(projectDir, 'package.json'), '{}');

      const result = validateSourceDirectory(projectDir);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('No slides.md found in source directory');
    });

    it('returns error when package.json is missing', () => {
      const projectDir = join(testDir, 'no-package');
      mkdirSync(projectDir, { recursive: true });
      writeFileSync(join(projectDir, 'slides.md'), '# Test');

      const result = validateSourceDirectory(projectDir);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('No package.json found in source directory');
    });

    it('returns valid result for valid Slidev project', () => {
      const projectDir = join(testDir, 'valid-project');
      createMockSlidevProject(projectDir);

      const result = validateSourceDirectory(projectDir);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('validatePath', () => {
    it('generates lowercase suggested name from directory name', () => {
      const projectDir = join(testDir, 'MyPresentation');
      createMockSlidevProject(projectDir);

      const result = validatePath(projectDir);

      expect(result.isValid).toBe(true);
      expect(result.suggestedName).toBe('mypresentation');
      expect(result.error).toBeNull();
    });

    it('replaces special characters with hyphens in suggested name', () => {
      const projectDir = join(testDir, 'My_Presentation_2024');
      createMockSlidevProject(projectDir);

      const result = validatePath(projectDir);

      expect(result.isValid).toBe(true);
      expect(result.suggestedName).toBe('my-presentation-2024');
    });

    it('replaces spaces with hyphens in suggested name', () => {
      const projectDir = join(testDir, 'My Presentation');
      createMockSlidevProject(projectDir);

      const result = validatePath(projectDir);

      expect(result.isValid).toBe(true);
      expect(result.suggestedName).toBe('my-presentation');
    });

    it('handles directory names with dots', () => {
      const projectDir = join(testDir, 'presentation.v2.0');
      createMockSlidevProject(projectDir);

      const result = validatePath(projectDir);

      expect(result.isValid).toBe(true);
      expect(result.suggestedName).toBe('presentation-v2-0');
    });

    it('returns original path in result', () => {
      const projectDir = join(testDir, 'test-project');
      createMockSlidevProject(projectDir);

      const result = validatePath(projectDir);

      expect(result.path).toBe(projectDir);
    });

    it('returns error for invalid source directory', () => {
      const nonExistentPath = join(testDir, 'does-not-exist');

      const result = validatePath(nonExistentPath);

      expect(result.isValid).toBe(false);
      expect(result.suggestedName).toBeNull();
      expect(result.error).toBe('Source directory does not exist');
      expect(result.path).toBe(nonExistentPath);
    });

    it('preserves existing hyphens in suggested name', () => {
      const projectDir = join(testDir, 'my-existing-presentation');
      createMockSlidevProject(projectDir);

      const result = validatePath(projectDir);

      expect(result.suggestedName).toBe('my-existing-presentation');
    });

    it('handles numeric directory names', () => {
      const projectDir = join(testDir, '2024');
      createMockSlidevProject(projectDir);

      const result = validatePath(projectDir);

      expect(result.isValid).toBe(true);
      expect(result.suggestedName).toBe('2024');
    });
  });

  describe('validatePaths', () => {
    it('validates multiple valid paths', () => {
      const projectDir1 = join(testDir, 'project-one');
      const projectDir2 = join(testDir, 'project-two');
      createMockSlidevProject(projectDir1);
      createMockSlidevProject(projectDir2);

      const results = validatePaths([projectDir1, projectDir2]);

      expect(results).toHaveLength(2);
      expect(results[0].isValid).toBe(true);
      expect(results[0].suggestedName).toBe('project-one');
      expect(results[1].isValid).toBe(true);
      expect(results[1].suggestedName).toBe('project-two');
    });

    it('validates multiple invalid paths', () => {
      const invalidPath1 = join(testDir, 'nonexistent1');
      const invalidPath2 = join(testDir, 'nonexistent2');

      const results = validatePaths([invalidPath1, invalidPath2]);

      expect(results).toHaveLength(2);
      expect(results[0].isValid).toBe(false);
      expect(results[0].error).toBe('Source directory does not exist');
      expect(results[1].isValid).toBe(false);
      expect(results[1].error).toBe('Source directory does not exist');
    });

    it('handles mixed valid and invalid paths', () => {
      const validProject = join(testDir, 'valid-project');
      const invalidPath = join(testDir, 'does-not-exist');
      createMockSlidevProject(validProject);

      const results = validatePaths([validProject, invalidPath]);

      expect(results).toHaveLength(2);
      expect(results[0].isValid).toBe(true);
      expect(results[0].suggestedName).toBe('valid-project');
      expect(results[1].isValid).toBe(false);
      expect(results[1].error).toBe('Source directory does not exist');
    });

    it('returns empty array for empty input', () => {
      const results = validatePaths([]);

      expect(results).toHaveLength(0);
    });

    it('preserves order of input paths in results', () => {
      const projectDir1 = join(testDir, 'alpha');
      const projectDir2 = join(testDir, 'beta');
      const projectDir3 = join(testDir, 'gamma');
      createMockSlidevProject(projectDir1);
      createMockSlidevProject(projectDir2);
      createMockSlidevProject(projectDir3);

      const results = validatePaths([projectDir3, projectDir1, projectDir2]);

      expect(results[0].path).toBe(projectDir3);
      expect(results[1].path).toBe(projectDir1);
      expect(results[2].path).toBe(projectDir2);
    });

    it('handles single path in array', () => {
      const projectDir = join(testDir, 'single-project');
      createMockSlidevProject(projectDir);

      const results = validatePaths([projectDir]);

      expect(results).toHaveLength(1);
      expect(results[0].isValid).toBe(true);
      expect(results[0].suggestedName).toBe('single-project');
    });
  });

  describe('copyDirectorySelective via API', () => {
    let sourceDir: string;
    let destDir: string;

    beforeEach(() => {
      sourceDir = join(testDir, 'source');
      destDir = join(testDir, 'destination');
      mkdirSync(sourceDir, { recursive: true });
    });

    it('filters out node_modules directory', () => {
      writeFileSync(join(sourceDir, 'slides.md'), '# Test');
      mkdirSync(join(sourceDir, 'node_modules', 'some-package'), { recursive: true });
      writeFileSync(
        join(sourceDir, 'node_modules', 'some-package', 'index.js'),
        'module.exports = {}',
      );

      copyDirectorySelective(sourceDir, destDir);

      expect(existsSync(join(destDir, 'slides.md'))).toBe(true);
      expect(existsSync(join(destDir, 'node_modules'))).toBe(false);
    });

    it('filters out .git directory', () => {
      writeFileSync(join(sourceDir, 'slides.md'), '# Test');
      mkdirSync(join(sourceDir, '.git', 'objects'), { recursive: true });
      writeFileSync(join(sourceDir, '.git', 'config'), '[core]');

      copyDirectorySelective(sourceDir, destDir);

      expect(existsSync(join(destDir, 'slides.md'))).toBe(true);
      expect(existsSync(join(destDir, '.git'))).toBe(false);
    });

    it('filters out dist directory', () => {
      writeFileSync(join(sourceDir, 'slides.md'), '# Test');
      mkdirSync(join(sourceDir, 'dist'), { recursive: true });
      writeFileSync(join(sourceDir, 'dist', 'bundle.js'), 'bundled code');

      copyDirectorySelective(sourceDir, destDir);

      expect(existsSync(join(destDir, 'slides.md'))).toBe(true);
      expect(existsSync(join(destDir, 'dist'))).toBe(false);
    });

    it('filters out .nuxt directory', () => {
      writeFileSync(join(sourceDir, 'slides.md'), '# Test');
      mkdirSync(join(sourceDir, '.nuxt'), { recursive: true });
      writeFileSync(join(sourceDir, '.nuxt', 'cache.json'), '{}');

      copyDirectorySelective(sourceDir, destDir);

      expect(existsSync(join(destDir, 'slides.md'))).toBe(true);
      expect(existsSync(join(destDir, '.nuxt'))).toBe(false);
    });

    it('filters out .output directory', () => {
      writeFileSync(join(sourceDir, 'slides.md'), '# Test');
      mkdirSync(join(sourceDir, '.output'), { recursive: true });
      writeFileSync(join(sourceDir, '.output', 'index.html'), '<html></html>');

      copyDirectorySelective(sourceDir, destDir);

      expect(existsSync(join(destDir, 'slides.md'))).toBe(true);
      expect(existsSync(join(destDir, '.output'))).toBe(false);
    });

    it('filters out pnpm-lock.yaml', () => {
      writeFileSync(join(sourceDir, 'slides.md'), '# Test');
      writeFileSync(join(sourceDir, 'pnpm-lock.yaml'), 'lockfileVersion: 6.0');

      copyDirectorySelective(sourceDir, destDir);

      expect(existsSync(join(destDir, 'slides.md'))).toBe(true);
      expect(existsSync(join(destDir, 'pnpm-lock.yaml'))).toBe(false);
    });

    it('filters out package-lock.json', () => {
      writeFileSync(join(sourceDir, 'slides.md'), '# Test');
      writeFileSync(join(sourceDir, 'package-lock.json'), '{}');

      copyDirectorySelective(sourceDir, destDir);

      expect(existsSync(join(destDir, 'slides.md'))).toBe(true);
      expect(existsSync(join(destDir, 'package-lock.json'))).toBe(false);
    });

    it('filters out yarn.lock', () => {
      writeFileSync(join(sourceDir, 'slides.md'), '# Test');
      writeFileSync(join(sourceDir, 'yarn.lock'), '# yarn lockfile v1');

      copyDirectorySelective(sourceDir, destDir);

      expect(existsSync(join(destDir, 'slides.md'))).toBe(true);
      expect(existsSync(join(destDir, 'yarn.lock'))).toBe(false);
    });

    it('filters out .DS_Store', () => {
      writeFileSync(join(sourceDir, 'slides.md'), '# Test');
      writeFileSync(join(sourceDir, '.DS_Store'), 'binary-data');

      copyDirectorySelective(sourceDir, destDir);

      expect(existsSync(join(destDir, 'slides.md'))).toBe(true);
      expect(existsSync(join(destDir, '.DS_Store'))).toBe(false);
    });

    it('copies regular source files', () => {
      writeFileSync(join(sourceDir, 'slides.md'), '# Presentation');
      writeFileSync(join(sourceDir, 'package.json'), '{"name": "test"}');
      writeFileSync(join(sourceDir, 'style.css'), 'body { color: red; }');

      copyDirectorySelective(sourceDir, destDir);

      expect(existsSync(join(destDir, 'slides.md'))).toBe(true);
      expect(existsSync(join(destDir, 'package.json'))).toBe(true);
      expect(existsSync(join(destDir, 'style.css'))).toBe(true);
    });

    it('preserves file content when copying', () => {
      const content = '# My Presentation\n\n---\n\n# Slide 2';
      writeFileSync(join(sourceDir, 'slides.md'), content);

      copyDirectorySelective(sourceDir, destDir);

      expect(readFileSync(join(destDir, 'slides.md'), 'utf-8')).toBe(content);
    });

    it('copies nested directories recursively', () => {
      writeFileSync(join(sourceDir, 'slides.md'), '# Test');
      mkdirSync(join(sourceDir, 'components', 'ui'), { recursive: true });
      writeFileSync(join(sourceDir, 'components', 'Header.vue'), '<template></template>');
      writeFileSync(join(sourceDir, 'components', 'ui', 'Button.vue'), '<template></template>');

      copyDirectorySelective(sourceDir, destDir);

      expect(existsSync(join(destDir, 'components', 'Header.vue'))).toBe(true);
      expect(existsSync(join(destDir, 'components', 'ui', 'Button.vue'))).toBe(true);
    });

    it('handles mixed content with ignored and non-ignored items', () => {
      writeFileSync(join(sourceDir, 'slides.md'), '# Test');
      writeFileSync(join(sourceDir, 'package.json'), '{}');
      writeFileSync(join(sourceDir, 'pnpm-lock.yaml'), 'lockfile');
      writeFileSync(join(sourceDir, '.DS_Store'), 'binary');
      mkdirSync(join(sourceDir, 'node_modules', 'pkg'), { recursive: true });
      mkdirSync(join(sourceDir, 'dist'), { recursive: true });
      mkdirSync(join(sourceDir, '.git'), { recursive: true });
      mkdirSync(join(sourceDir, 'components'), { recursive: true });
      writeFileSync(join(sourceDir, 'components', 'App.vue'), '<template></template>');

      copyDirectorySelective(sourceDir, destDir);

      expect(existsSync(join(destDir, 'slides.md'))).toBe(true);
      expect(existsSync(join(destDir, 'package.json'))).toBe(true);
      expect(existsSync(join(destDir, 'components', 'App.vue'))).toBe(true);
      expect(existsSync(join(destDir, 'pnpm-lock.yaml'))).toBe(false);
      expect(existsSync(join(destDir, '.DS_Store'))).toBe(false);
      expect(existsSync(join(destDir, 'node_modules'))).toBe(false);
      expect(existsSync(join(destDir, 'dist'))).toBe(false);
      expect(existsSync(join(destDir, '.git'))).toBe(false);
    });

    it('creates destination directory if it does not exist', () => {
      const nestedDest = join(testDir, 'nested', 'deep', 'destination');
      writeFileSync(join(sourceDir, 'slides.md'), '# Test');

      copyDirectorySelective(sourceDir, nestedDest);

      expect(existsSync(nestedDest)).toBe(true);
      expect(existsSync(join(nestedDest, 'slides.md'))).toBe(true);
    });
  });
});
