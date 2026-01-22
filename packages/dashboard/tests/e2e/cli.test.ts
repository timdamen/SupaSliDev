import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_DIR = join(tmpdir(), 'supaslidev-dashboard-cli-test');
const DASHBOARD_ROOT = join(__dirname, '../..');
const CLI_PATH = join(DASHBOARD_ROOT, 'src/cli/index.ts');

function cleanTestDir(): void {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

function runCLI(
  args: string,
  cwd: string = TEST_DIR,
): { stdout: string; stderr: string; exitCode: number } {
  const tsxPath = join(DASHBOARD_ROOT, 'node_modules/.bin/tsx');
  try {
    const stdout = execSync(`"${tsxPath}" "${CLI_PATH}" ${args}`, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout?.toString() || '',
      stderr: error.stderr?.toString() || '',
      exitCode: error.status || 1,
    };
  }
}

describe('CLI Help & Version', () => {
  it('shows help with --help flag', () => {
    const { stdout } = runCLI('--help', process.cwd());
    expect(stdout).toContain('supaslidev');
    expect(stdout).toContain('dashboard');
  });

  it('shows version with --version flag', () => {
    const { stdout } = runCLI('--version', process.cwd());
    expect(stdout).toContain('0.1.0');
  });

  it('shows help for dev command', () => {
    const { stdout } = runCLI('dev --help', process.cwd());
    expect(stdout).toContain('dev');
    expect(stdout).toContain('dashboard');
  });

  it('shows help for create command', () => {
    const { stdout } = runCLI('create --help', process.cwd());
    expect(stdout).toContain('create');
    expect(stdout).toContain('presentation');
  });

  it('shows help for export command', () => {
    const { stdout } = runCLI('export --help', process.cwd());
    expect(stdout).toContain('export');
    expect(stdout).toContain('PDF');
  });

  it('shows help for deploy command', () => {
    const { stdout } = runCLI('deploy --help', process.cwd());
    expect(stdout).toContain('deploy');
    expect(stdout).toContain('deployment');
  });
});

describe('CLI Project Detection', () => {
  beforeEach(() => {
    cleanTestDir();
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    cleanTestDir();
  });

  it('fails dev command when no project is found', () => {
    const { stderr, exitCode } = runCLI('dev', TEST_DIR);
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('Could not find a supaSliDev project');
  });

  it('fails create command when no project is found', () => {
    const { stderr, exitCode } = runCLI('create test-deck', TEST_DIR);
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('Could not find a supaSliDev project');
  });

  it('fails export command when no project is found', () => {
    const { stderr, exitCode } = runCLI('export test-deck', TEST_DIR);
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('Could not find a supaSliDev project');
  });

  it('fails deploy command when no project is found', () => {
    const { stderr, exitCode } = runCLI('deploy test-deck', TEST_DIR);
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('Could not find a supaSliDev project');
  });
});

describe('CLI Presentation Validation', () => {
  beforeEach(() => {
    cleanTestDir();
    mkdirSync(join(TEST_DIR, 'presentations', 'existing-deck'), { recursive: true });
    writeFileSync(join(TEST_DIR, 'package.json'), '{}');
    writeFileSync(join(TEST_DIR, 'presentations', 'existing-deck', 'slides.md'), '# Test');
  });

  afterEach(() => {
    cleanTestDir();
  });

  it('export command fails for non-existent presentation', () => {
    const { stderr, exitCode } = runCLI('export non-existent', TEST_DIR);
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('not found');
    expect(stderr).toContain('Available presentations');
    expect(stderr).toContain('existing-deck');
  });

  it('deploy command fails for non-existent presentation', () => {
    const { stderr, exitCode } = runCLI('deploy non-existent', TEST_DIR);
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('not found');
    expect(stderr).toContain('Available presentations');
    expect(stderr).toContain('existing-deck');
  });

  it('export command shows empty list when no presentations exist', () => {
    rmSync(join(TEST_DIR, 'presentations', 'existing-deck'), { recursive: true });
    const { stderr } = runCLI('export any-deck', TEST_DIR);
    expect(stderr).toContain('No presentations found');
  });
});

describe('CLI Export Options', () => {
  beforeEach(() => {
    cleanTestDir();
    mkdirSync(join(TEST_DIR, 'presentations', 'my-deck'), { recursive: true });
    writeFileSync(join(TEST_DIR, 'package.json'), '{}');
    writeFileSync(join(TEST_DIR, 'presentations', 'my-deck', 'slides.md'), '# Test');
  });

  afterEach(() => {
    cleanTestDir();
  });

  it('export command accepts -o flag', () => {
    const { stdout } = runCLI('export --help', TEST_DIR);
    expect(stdout).toContain('-o');
    expect(stdout).toContain('--output');
  });
});

describe('CLI Deploy Options', () => {
  beforeEach(() => {
    cleanTestDir();
    mkdirSync(join(TEST_DIR, 'presentations', 'my-deck'), { recursive: true });
    writeFileSync(join(TEST_DIR, 'package.json'), '{}');
    writeFileSync(join(TEST_DIR, 'presentations', 'my-deck', 'slides.md'), '# Test');
  });

  afterEach(() => {
    cleanTestDir();
  });

  it('deploy command accepts -o flag', () => {
    const { stdout } = runCLI('deploy --help', TEST_DIR);
    expect(stdout).toContain('-o');
    expect(stdout).toContain('--output');
  });
});
