import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { copyDirectorySelective } from '../../src/cli/commands/import.js';
import { createTestProjectDir, cleanupTestDir } from '../helpers/import-test-helpers.js';

describe('copyDirectorySelective', () => {
  let testDir: string;
  let sourceDir: string;
  let destDir: string;

  beforeEach(() => {
    testDir = createTestProjectDir('copy-selective');
    sourceDir = join(testDir, 'source');
    destDir = join(testDir, 'destination');
    mkdirSync(sourceDir, { recursive: true });
  });

  afterEach(() => {
    cleanupTestDir(testDir);
  });

  describe('copies regular files', () => {
    it('copies a single file to destination', () => {
      writeFileSync(join(sourceDir, 'slides.md'), '# Presentation');

      copyDirectorySelective(sourceDir, destDir);

      expect(existsSync(join(destDir, 'slides.md'))).toBe(true);
      expect(readFileSync(join(destDir, 'slides.md'), 'utf-8')).toBe('# Presentation');
    });

    it('copies multiple files to destination', () => {
      writeFileSync(join(sourceDir, 'slides.md'), '# Slides');
      writeFileSync(join(sourceDir, 'package.json'), '{}');
      writeFileSync(join(sourceDir, 'style.css'), 'body {}');

      copyDirectorySelective(sourceDir, destDir);

      expect(existsSync(join(destDir, 'slides.md'))).toBe(true);
      expect(existsSync(join(destDir, 'package.json'))).toBe(true);
      expect(existsSync(join(destDir, 'style.css'))).toBe(true);
    });

    it('preserves file content when copying', () => {
      const content = '# My Presentation\n\n---\n\n# Slide 2\n\nContent here';
      writeFileSync(join(sourceDir, 'slides.md'), content);

      copyDirectorySelective(sourceDir, destDir);

      expect(readFileSync(join(destDir, 'slides.md'), 'utf-8')).toBe(content);
    });
  });

  describe('ignores node_modules directory', () => {
    it('does not copy node_modules directory', () => {
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
  });

  describe('ignores .git directory', () => {
    it('does not copy .git directory', () => {
      writeFileSync(join(sourceDir, 'slides.md'), '# Test');
      mkdirSync(join(sourceDir, '.git', 'objects'), { recursive: true });
      writeFileSync(join(sourceDir, '.git', 'config'), '[core]');

      copyDirectorySelective(sourceDir, destDir);

      expect(existsSync(join(destDir, 'slides.md'))).toBe(true);
      expect(existsSync(join(destDir, '.git'))).toBe(false);
    });
  });

  describe('ignores dist directory', () => {
    it('does not copy dist directory', () => {
      writeFileSync(join(sourceDir, 'slides.md'), '# Test');
      mkdirSync(join(sourceDir, 'dist'), { recursive: true });
      writeFileSync(join(sourceDir, 'dist', 'index.html'), '<html></html>');

      copyDirectorySelective(sourceDir, destDir);

      expect(existsSync(join(destDir, 'slides.md'))).toBe(true);
      expect(existsSync(join(destDir, 'dist'))).toBe(false);
    });
  });

  describe('ignores lock files', () => {
    it('does not copy pnpm-lock.yaml', () => {
      writeFileSync(join(sourceDir, 'slides.md'), '# Test');
      writeFileSync(join(sourceDir, 'pnpm-lock.yaml'), 'lockfileVersion: 6.0');

      copyDirectorySelective(sourceDir, destDir);

      expect(existsSync(join(destDir, 'slides.md'))).toBe(true);
      expect(existsSync(join(destDir, 'pnpm-lock.yaml'))).toBe(false);
    });

    it('does not copy package-lock.json', () => {
      writeFileSync(join(sourceDir, 'slides.md'), '# Test');
      writeFileSync(join(sourceDir, 'package-lock.json'), '{}');

      copyDirectorySelective(sourceDir, destDir);

      expect(existsSync(join(destDir, 'slides.md'))).toBe(true);
      expect(existsSync(join(destDir, 'package-lock.json'))).toBe(false);
    });

    it('does not copy yarn.lock', () => {
      writeFileSync(join(sourceDir, 'slides.md'), '# Test');
      writeFileSync(join(sourceDir, 'yarn.lock'), '# yarn lockfile v1');

      copyDirectorySelective(sourceDir, destDir);

      expect(existsSync(join(destDir, 'slides.md'))).toBe(true);
      expect(existsSync(join(destDir, 'yarn.lock'))).toBe(false);
    });
  });

  describe('copies nested directories', () => {
    it('copies a single nested directory with files', () => {
      writeFileSync(join(sourceDir, 'slides.md'), '# Test');
      mkdirSync(join(sourceDir, 'components'), { recursive: true });
      writeFileSync(join(sourceDir, 'components', 'Header.vue'), '<template></template>');

      copyDirectorySelective(sourceDir, destDir);

      expect(existsSync(join(destDir, 'components'))).toBe(true);
      expect(existsSync(join(destDir, 'components', 'Header.vue'))).toBe(true);
    });

    it('copies deeply nested directory structures', () => {
      writeFileSync(join(sourceDir, 'slides.md'), '# Test');
      mkdirSync(join(sourceDir, 'src', 'components', 'ui'), { recursive: true });
      writeFileSync(
        join(sourceDir, 'src', 'components', 'ui', 'Button.vue'),
        '<template></template>',
      );
      writeFileSync(join(sourceDir, 'src', 'components', 'Header.vue'), '<template></template>');
      writeFileSync(join(sourceDir, 'src', 'utils.ts'), 'export const util = () => {}');

      copyDirectorySelective(sourceDir, destDir);

      expect(existsSync(join(destDir, 'src', 'components', 'ui', 'Button.vue'))).toBe(true);
      expect(existsSync(join(destDir, 'src', 'components', 'Header.vue'))).toBe(true);
      expect(existsSync(join(destDir, 'src', 'utils.ts'))).toBe(true);
    });
  });

  describe('preserves directory structure', () => {
    it('maintains the same directory hierarchy', () => {
      mkdirSync(join(sourceDir, 'public', 'images'), { recursive: true });
      mkdirSync(join(sourceDir, 'components'), { recursive: true });
      mkdirSync(join(sourceDir, 'layouts'), { recursive: true });
      writeFileSync(join(sourceDir, 'slides.md'), '# Test');
      writeFileSync(join(sourceDir, 'public', 'images', 'logo.png'), 'binary-data');
      writeFileSync(join(sourceDir, 'components', 'Header.vue'), '<template></template>');
      writeFileSync(join(sourceDir, 'layouts', 'default.vue'), '<template></template>');

      copyDirectorySelective(sourceDir, destDir);

      const destEntries = readdirSync(destDir);
      expect(destEntries).toContain('slides.md');
      expect(destEntries).toContain('public');
      expect(destEntries).toContain('components');
      expect(destEntries).toContain('layouts');

      expect(existsSync(join(destDir, 'public', 'images', 'logo.png'))).toBe(true);
      expect(existsSync(join(destDir, 'components', 'Header.vue'))).toBe(true);
      expect(existsSync(join(destDir, 'layouts', 'default.vue'))).toBe(true);
    });

    it('creates destination directory if it does not exist', () => {
      const nonExistentDest = join(testDir, 'nested', 'new', 'destination');
      writeFileSync(join(sourceDir, 'slides.md'), '# Test');

      copyDirectorySelective(sourceDir, nonExistentDest);

      expect(existsSync(nonExistentDest)).toBe(true);
      expect(existsSync(join(nonExistentDest, 'slides.md'))).toBe(true);
    });
  });

  describe('ignores other patterns from IGNORE_PATTERNS', () => {
    it('does not copy .nuxt directory', () => {
      writeFileSync(join(sourceDir, 'slides.md'), '# Test');
      mkdirSync(join(sourceDir, '.nuxt'), { recursive: true });
      writeFileSync(join(sourceDir, '.nuxt', 'cache.json'), '{}');

      copyDirectorySelective(sourceDir, destDir);

      expect(existsSync(join(destDir, 'slides.md'))).toBe(true);
      expect(existsSync(join(destDir, '.nuxt'))).toBe(false);
    });

    it('does not copy .output directory', () => {
      writeFileSync(join(sourceDir, 'slides.md'), '# Test');
      mkdirSync(join(sourceDir, '.output'), { recursive: true });
      writeFileSync(join(sourceDir, '.output', 'index.html'), '<html></html>');

      copyDirectorySelective(sourceDir, destDir);

      expect(existsSync(join(destDir, 'slides.md'))).toBe(true);
      expect(existsSync(join(destDir, '.output'))).toBe(false);
    });

    it('does not copy .DS_Store file', () => {
      writeFileSync(join(sourceDir, 'slides.md'), '# Test');
      writeFileSync(join(sourceDir, '.DS_Store'), 'binary-data');

      copyDirectorySelective(sourceDir, destDir);

      expect(existsSync(join(destDir, 'slides.md'))).toBe(true);
      expect(existsSync(join(destDir, '.DS_Store'))).toBe(false);
    });
  });

  describe('handles mixed content with ignored and non-ignored items', () => {
    it('copies only non-ignored items from a directory with mixed content', () => {
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
  });
});
