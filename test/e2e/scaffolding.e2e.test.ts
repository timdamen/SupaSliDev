import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { scaffoldProject, cleanupProject, getTmpDir } from './setup/test-utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '../..');
const CLI_PATH = join(ROOT_DIR, 'packages/cli/src/cli.ts');

function runCliCreate(args: string, cwd: string): { output: string; exitCode: number } {
  try {
    const output = execSync(`npx tsx "${CLI_PATH}" create ${args} 2>&1`, {
      cwd,
      encoding: 'utf-8',
    });
    return { output, exitCode: 0 };
  } catch (error) {
    const execError = error as { stdout?: string; stderr?: string; status?: number };
    return {
      output: (execError.stdout ?? '') + (execError.stderr ?? ''),
      exitCode: execError.status ?? 1,
    };
  }
}

describe('CLI Scaffolding E2E', () => {
  const TEST_PROJECT_NAME = 'scaffolding-e2e-test';

  afterAll(() => {
    cleanupProject(TEST_PROJECT_NAME);
  });

  describe('folder structure', () => {
    let projectPath: string;

    beforeAll(() => {
      cleanupProject(TEST_PROJECT_NAME);
      projectPath = scaffoldProject(TEST_PROJECT_NAME);
    });

    it('creates expected root directory structure', () => {
      expect(existsSync(projectPath)).toBe(true);
      expect(existsSync(join(projectPath, 'presentations'))).toBe(true);
      expect(existsSync(join(projectPath, 'packages'))).toBe(true);
      expect(existsSync(join(projectPath, 'scripts'))).toBe(true);
    });

    it('creates workspace configuration files', () => {
      expect(existsSync(join(projectPath, 'package.json'))).toBe(true);
      expect(existsSync(join(projectPath, 'pnpm-workspace.yaml'))).toBe(true);
      expect(existsSync(join(projectPath, 'tsconfig.json'))).toBe(true);
      expect(existsSync(join(projectPath, 'turbo.json'))).toBe(true);
    });

    it('creates state directory with state.json', () => {
      expect(existsSync(join(projectPath, '.supaslidev'))).toBe(true);
      expect(existsSync(join(projectPath, '.supaslidev', 'state.json'))).toBe(true);
    });

    it('creates scripts directory with dev script', () => {
      const devScriptPath = join(projectPath, 'scripts', 'dev-presentation.mjs');
      expect(existsSync(devScriptPath)).toBe(true);

      const scriptContent = readFileSync(devScriptPath, 'utf-8');
      expect(scriptContent).toContain('#!/usr/bin/env node');
    });

    it('creates presentation directory with expected files', () => {
      const presentationDir = join(projectPath, 'presentations', 'test-deck');
      expect(existsSync(presentationDir)).toBe(true);
      expect(existsSync(join(presentationDir, 'package.json'))).toBe(true);
      expect(existsSync(join(presentationDir, 'slides.md'))).toBe(true);
      expect(existsSync(join(presentationDir, '.gitignore'))).toBe(true);
      expect(existsSync(join(presentationDir, '.npmrc'))).toBe(true);
    });
  });

  describe('package.json validation', () => {
    let projectPath: string;

    beforeAll(() => {
      projectPath = join(getTmpDir(), TEST_PROJECT_NAME);
    });

    it('creates valid root package.json with correct name', () => {
      const packageJsonPath = join(projectPath, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.name).toBe(TEST_PROJECT_NAME);
      expect(packageJson.private).toBe(true);
    });

    it('includes required scripts in root package.json', () => {
      const packageJsonPath = join(projectPath, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.dev).toBe('supaslidev');
    });

    it('includes supaslidev in devDependencies', () => {
      const packageJsonPath = join(projectPath, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.devDependencies).toBeDefined();
      expect(packageJson.devDependencies['supaslidev']).toBeDefined();
    });

    it('creates presentation package.json with correct name format', () => {
      const presPackageJsonPath = join(projectPath, 'presentations', 'test-deck', 'package.json');
      const presPackageJson = JSON.parse(readFileSync(presPackageJsonPath, 'utf-8'));

      expect(presPackageJson.name).toBe('@supaslidev/test-deck');
      expect(presPackageJson.private).toBe(true);
      expect(presPackageJson.type).toBe('module');
    });

    it('uses catalog: syntax for presentation dependencies', () => {
      const presPackageJsonPath = join(projectPath, 'presentations', 'test-deck', 'package.json');
      const presPackageJson = JSON.parse(readFileSync(presPackageJsonPath, 'utf-8'));

      expect(presPackageJson.dependencies['@slidev/cli']).toBe('catalog:');
      expect(presPackageJson.dependencies['@slidev/theme-default']).toBe('catalog:');
      expect(presPackageJson.dependencies['vue']).toBe('catalog:');
    });

    it('includes slidev scripts in presentation package.json', () => {
      const presPackageJsonPath = join(projectPath, 'presentations', 'test-deck', 'package.json');
      const presPackageJson = JSON.parse(readFileSync(presPackageJsonPath, 'utf-8'));

      expect(presPackageJson.scripts.dev).toBe('slidev --open');
      expect(presPackageJson.scripts.build).toBe('slidev build');
      expect(presPackageJson.scripts.export).toBe('slidev export');
    });
  });

  describe('slides.md creation', () => {
    let projectPath: string;

    beforeAll(() => {
      projectPath = join(getTmpDir(), TEST_PROJECT_NAME);
    });

    it('creates slides.md in presentation folder', () => {
      const slidesPath = join(projectPath, 'presentations', 'test-deck', 'slides.md');
      expect(existsSync(slidesPath)).toBe(true);
    });

    it('slides.md contains valid frontmatter with title', () => {
      const slidesPath = join(projectPath, 'presentations', 'test-deck', 'slides.md');
      const content = readFileSync(slidesPath, 'utf-8');

      expect(content).toContain('---');
      expect(content).toContain('title: test-deck');
      expect(content).toContain('theme: default');
    });

    it('slides.md contains presentation heading matching name', () => {
      const slidesPath = join(projectPath, 'presentations', 'test-deck', 'slides.md');
      const content = readFileSync(slidesPath, 'utf-8');

      expect(content).toContain('# test-deck');
    });

    it('slides.md contains multiple slides', () => {
      const slidesPath = join(projectPath, 'presentations', 'test-deck', 'slides.md');
      const content = readFileSync(slidesPath, 'utf-8');

      const slideSeparatorCount = (content.match(/^---$/gm) || []).length;
      expect(slideSeparatorCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('invalid name handling', () => {
    it('rejects project name with uppercase letters', () => {
      const result = runCliCreate(
        '--name "InvalidName" --presentation "test" --no-git --no-install',
        getTmpDir(),
      );

      expect(result.exitCode).not.toBe(0);
      expect(result.output).toContain('lowercase');
    });

    it('rejects project name with special characters', () => {
      const result = runCliCreate(
        '--name "invalid_name!" --presentation "test" --no-git --no-install',
        getTmpDir(),
      );

      expect(result.exitCode).not.toBe(0);
      expect(result.output).toContain('alphanumeric');
    });

    it('rejects project name starting with hyphen', () => {
      const result = runCliCreate(
        '--name "-invalid" --presentation "test" --no-git --no-install',
        getTmpDir(),
      );

      expect(result.exitCode).not.toBe(0);
      expect(result.output).toContain('hyphen');
    });

    it('rejects project name ending with hyphen', () => {
      const result = runCliCreate(
        '--name "invalid-" --presentation "test" --no-git --no-install',
        getTmpDir(),
      );

      expect(result.exitCode).not.toBe(0);
      expect(result.output).toContain('hyphen');
    });

    it('rejects presentation name with invalid characters', () => {
      const result = runCliCreate(
        '--name "valid-project" --presentation "Invalid Deck!" --no-git --no-install',
        getTmpDir(),
      );

      expect(result.exitCode).not.toBe(0);
    });
  });

  describe('dependency installation', () => {
    const INSTALL_TEST_PROJECT = 'install-test-project';

    afterAll(() => {
      cleanupProject(INSTALL_TEST_PROJECT);
    });

    it('pnpm install succeeds when run manually after scaffolding with --no-install', () => {
      cleanupProject(INSTALL_TEST_PROJECT);

      const projectPath = join(getTmpDir(), INSTALL_TEST_PROJECT);

      const result = runCliCreate(
        `--name "${INSTALL_TEST_PROJECT}" --presentation "test-deck" --no-git --no-install`,
        getTmpDir(),
      );

      expect(result.exitCode).toBe(0);
      expect(existsSync(projectPath)).toBe(true);

      const packageJsonPath = join(projectPath, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      // Remove unpublished local package to allow pnpm install to succeed in test environment
      delete packageJson.devDependencies['supaslidev'];
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

      execSync('pnpm install', {
        cwd: projectPath,
        stdio: 'inherit',
      });

      expect(existsSync(join(projectPath, 'node_modules'))).toBe(true);
      expect(existsSync(join(projectPath, 'pnpm-lock.yaml'))).toBe(true);
    }, 120000);
  });
});
