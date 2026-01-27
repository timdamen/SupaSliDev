import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const TEST_BASE_DIR = join(tmpdir(), 'supaslidev-import-tests');

export interface MockSlidevProjectOptions {
  slidesContent?: string;
  packageJson?: Record<string, unknown>;
  additionalFiles?: Record<string, string>;
}

export function createTestProjectDir(name: string): string {
  const testDir = join(TEST_BASE_DIR, name, Date.now().toString());
  mkdirSync(testDir, { recursive: true });
  return testDir;
}

export function createMockSlidevProject(dir: string, options: MockSlidevProjectOptions = {}): void {
  const {
    slidesContent = '# Test Presentation\n\n---\n\n# Slide 2',
    packageJson = {},
    additionalFiles = {},
  } = options;

  mkdirSync(dir, { recursive: true });

  const defaultPackageJson = {
    name: 'test-slidev-project',
    version: '1.0.0',
    scripts: {
      dev: 'slidev',
      build: 'slidev build',
    },
    dependencies: {
      '@slidev/cli': '^0.50.0',
    },
    ...packageJson,
  };

  writeFileSync(join(dir, 'package.json'), JSON.stringify(defaultPackageJson, null, 2) + '\n');
  writeFileSync(join(dir, 'slides.md'), slidesContent);

  for (const [filePath, content] of Object.entries(additionalFiles)) {
    const fullPath = join(dir, filePath);
    const parentDir = join(fullPath, '..');
    mkdirSync(parentDir, { recursive: true });
    writeFileSync(fullPath, content);
  }
}

export function createMockSupaslidevWorkspace(dir: string): void {
  mkdirSync(dir, { recursive: true });

  const packageJson = {
    name: 'test-supaslidev-workspace',
    version: '1.0.0',
    private: true,
  };

  const pnpmWorkspace = `packages:
  - presentations/*
`;

  writeFileSync(join(dir, 'package.json'), JSON.stringify(packageJson, null, 2) + '\n');
  writeFileSync(join(dir, 'pnpm-workspace.yaml'), pnpmWorkspace);
  mkdirSync(join(dir, 'presentations'), { recursive: true });
}

export function cleanupTestDir(dir: string): void {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
}
