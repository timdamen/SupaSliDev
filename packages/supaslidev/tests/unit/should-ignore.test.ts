import { describe, it, expect } from 'vitest';
import { shouldIgnore, IGNORE_PATTERNS } from '../../src/cli/commands/import.js';

describe('IGNORE_PATTERNS', () => {
  it('contains node_modules', () => {
    expect(IGNORE_PATTERNS).toContain('node_modules');
  });

  it('contains .git', () => {
    expect(IGNORE_PATTERNS).toContain('.git');
  });

  it('contains dist', () => {
    expect(IGNORE_PATTERNS).toContain('dist');
  });

  it('contains .nuxt', () => {
    expect(IGNORE_PATTERNS).toContain('.nuxt');
  });

  it('contains .output', () => {
    expect(IGNORE_PATTERNS).toContain('.output');
  });

  it('contains pnpm-lock.yaml', () => {
    expect(IGNORE_PATTERNS).toContain('pnpm-lock.yaml');
  });

  it('contains package-lock.json', () => {
    expect(IGNORE_PATTERNS).toContain('package-lock.json');
  });

  it('contains yarn.lock', () => {
    expect(IGNORE_PATTERNS).toContain('yarn.lock');
  });

  it('contains .DS_Store', () => {
    expect(IGNORE_PATTERNS).toContain('.DS_Store');
  });
});

describe('shouldIgnore', () => {
  describe('ignores directories that should be filtered', () => {
    it('ignores node_modules directory', () => {
      expect(shouldIgnore('node_modules')).toBe(true);
    });

    it('ignores .git directory', () => {
      expect(shouldIgnore('.git')).toBe(true);
    });

    it('ignores dist directory', () => {
      expect(shouldIgnore('dist')).toBe(true);
    });

    it('ignores .nuxt directory', () => {
      expect(shouldIgnore('.nuxt')).toBe(true);
    });

    it('ignores .output directory', () => {
      expect(shouldIgnore('.output')).toBe(true);
    });
  });

  describe('ignores lock files', () => {
    it('ignores pnpm-lock.yaml', () => {
      expect(shouldIgnore('pnpm-lock.yaml')).toBe(true);
    });

    it('ignores package-lock.json', () => {
      expect(shouldIgnore('package-lock.json')).toBe(true);
    });

    it('ignores yarn.lock', () => {
      expect(shouldIgnore('yarn.lock')).toBe(true);
    });
  });

  describe('ignores system files', () => {
    it('ignores .DS_Store', () => {
      expect(shouldIgnore('.DS_Store')).toBe(true);
    });
  });

  describe('does not ignore regular source files', () => {
    it('does not ignore slides.md', () => {
      expect(shouldIgnore('slides.md')).toBe(false);
    });

    it('does not ignore package.json', () => {
      expect(shouldIgnore('package.json')).toBe(false);
    });

    it('does not ignore TypeScript files', () => {
      expect(shouldIgnore('index.ts')).toBe(false);
      expect(shouldIgnore('utils.ts')).toBe(false);
    });

    it('does not ignore Vue files', () => {
      expect(shouldIgnore('App.vue')).toBe(false);
      expect(shouldIgnore('components/Header.vue')).toBe(false);
    });

    it('does not ignore JavaScript files', () => {
      expect(shouldIgnore('setup.js')).toBe(false);
      expect(shouldIgnore('config.mjs')).toBe(false);
    });

    it('does not ignore CSS files', () => {
      expect(shouldIgnore('style.css')).toBe(false);
    });

    it('does not ignore image files', () => {
      expect(shouldIgnore('logo.png')).toBe(false);
      expect(shouldIgnore('background.jpg')).toBe(false);
    });

    it('does not ignore regular directories', () => {
      expect(shouldIgnore('src')).toBe(false);
      expect(shouldIgnore('components')).toBe(false);
      expect(shouldIgnore('public')).toBe(false);
    });
  });
});
