import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findProjectRoot, getPresentations } from '../../src/cli/utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DASHBOARD_ROOT = join(__dirname, '../..');
const MONOREPO_ROOT = join(DASHBOARD_ROOT, '../..');
const PLAYGROUND_ROOT = join(MONOREPO_ROOT, 'playground');

describe('Playground Structure', () => {
  it('playground exists at expected location', () => {
    expect(existsSync(PLAYGROUND_ROOT)).toBe(true);
  });

  it('playground has presentations directory', () => {
    expect(existsSync(join(PLAYGROUND_ROOT, 'presentations'))).toBe(true);
  });

  it('playground has package.json', () => {
    expect(existsSync(join(PLAYGROUND_ROOT, 'package.json'))).toBe(true);
  });

  it('playground has pnpm-workspace.yaml', () => {
    expect(existsSync(join(PLAYGROUND_ROOT, 'pnpm-workspace.yaml'))).toBe(true);
  });
});

describe('Playground Project Detection', () => {
  it('findProjectRoot detects playground from root', () => {
    const result = findProjectRoot(PLAYGROUND_ROOT);
    expect(result).toBe(PLAYGROUND_ROOT);
  });

  it('findProjectRoot detects playground from presentations subdirectory', () => {
    const presentationsDir = join(PLAYGROUND_ROOT, 'presentations');
    if (existsSync(presentationsDir)) {
      const result = findProjectRoot(presentationsDir);
      expect(result).toBe(PLAYGROUND_ROOT);
    }
  });

  it('findProjectRoot detects playground from nested presentation directory', () => {
    const presentations = getPresentations(join(PLAYGROUND_ROOT, 'presentations'));
    if (presentations.length > 0) {
      const nestedDir = join(PLAYGROUND_ROOT, 'presentations', presentations[0]);
      const result = findProjectRoot(nestedDir);
      expect(result).toBe(PLAYGROUND_ROOT);
    }
  });
});

describe('Playground Presentations', () => {
  const presentationsDir = join(PLAYGROUND_ROOT, 'presentations');

  it('lists presentations correctly', () => {
    const presentations = getPresentations(presentationsDir);
    expect(Array.isArray(presentations)).toBe(true);
  });

  it('each presentation has slides.md', () => {
    const presentations = getPresentations(presentationsDir);
    for (const name of presentations) {
      const slidesPath = join(presentationsDir, name, 'slides.md');
      expect(existsSync(slidesPath)).toBe(true);
    }
  });

  it('each presentation has package.json', () => {
    const presentations = getPresentations(presentationsDir);
    for (const name of presentations) {
      const packagePath = join(presentationsDir, name, 'package.json');
      expect(existsSync(packagePath)).toBe(true);
    }
  });

  it('presentation package.json has @supaslidev scope', () => {
    const presentations = getPresentations(presentationsDir);
    for (const name of presentations) {
      const packagePath = join(presentationsDir, name, 'package.json');
      const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
      expect(pkg.name).toMatch(/^@supaslidev\//);
    }
  });

  it('presentation package.json uses catalog dependencies', () => {
    const presentations = getPresentations(presentationsDir);
    for (const name of presentations) {
      const packagePath = join(presentationsDir, name, 'package.json');
      const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
      if (pkg.dependencies?.['@slidev/cli']) {
        expect(pkg.dependencies['@slidev/cli']).toBe('catalog:');
      }
    }
  });
});

describe('Dashboard Package Detection', () => {
  it('dashboard package.json exists', () => {
    const packagePath = join(DASHBOARD_ROOT, 'package.json');
    expect(existsSync(packagePath)).toBe(true);
  });

  it('dashboard has correct package name', () => {
    const packagePath = join(DASHBOARD_ROOT, 'package.json');
    const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
    expect(pkg.name).toBe('@supaslidev/dashboard');
  });

  it('dashboard CLI entry point exists', () => {
    const cliPath = join(DASHBOARD_ROOT, 'src', 'cli', 'index.ts');
    expect(existsSync(cliPath)).toBe(true);
  });
});

describe('Monorepo Structure', () => {
  it('monorepo has packages directory', () => {
    expect(existsSync(join(MONOREPO_ROOT, 'packages'))).toBe(true);
  });

  it('monorepo has supaslidev package', () => {
    expect(existsSync(join(MONOREPO_ROOT, 'packages', 'supaslidev'))).toBe(true);
  });

  it('monorepo has cli package', () => {
    expect(existsSync(join(MONOREPO_ROOT, 'packages', 'cli'))).toBe(true);
  });

  it('monorepo has root pnpm-workspace.yaml', () => {
    expect(existsSync(join(MONOREPO_ROOT, 'pnpm-workspace.yaml'))).toBe(true);
  });
});
