import { spawn, ChildProcess, execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '../../..');
const TMP_DIR = join(ROOT_DIR, '.tmp');
const CLI_PATH = join(ROOT_DIR, 'packages/cli/src/cli.ts');

let dashboardProcess: ChildProcess | null = null;

export function getTmpDir(): string {
  return TMP_DIR;
}

export function getBaseProjectPath(): string {
  return join(TMP_DIR, 'base-project');
}

export function scaffoldProject(name: string): string {
  const projectPath = join(TMP_DIR, name);

  if (existsSync(projectPath)) {
    rmSync(projectPath, { recursive: true, force: true });
  }

  mkdirSync(TMP_DIR, { recursive: true });

  const tsxPath = join(ROOT_DIR, 'node_modules/.bin/tsx');

  execSync(
    `"${tsxPath}" "${CLI_PATH}" create --name "${name}" --presentation "test-deck" --no-git --no-install`,
    {
      cwd: TMP_DIR,
      stdio: 'pipe',
      encoding: 'utf-8',
    },
  );

  return projectPath;
}

export interface DashboardInfo {
  url: string;
  process: ChildProcess;
}

export async function startDashboard(projectPath: string): Promise<DashboardInfo> {
  const dashboardCliPath = join(ROOT_DIR, 'packages/dashboard/src/cli/index.ts');
  const tsxPath = join(ROOT_DIR, 'node_modules/.bin/tsx');

  return new Promise((resolve, reject) => {
    const proc = spawn(tsxPath, [dashboardCliPath, 'dev'], {
      cwd: projectPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    dashboardProcess = proc;

    let output = '';
    const urlPattern = /Local:\s+(https?:\/\/[^\s]+)/;

    const timeout = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error(`Dashboard startup timed out. Output: ${output}`));
    }, 60000);

    proc.stdout?.on('data', (data: Buffer) => {
      output += data.toString();
      const match = output.match(urlPattern);
      if (match) {
        clearTimeout(timeout);
        resolve({ url: match[1], process: proc });
      }
    });

    proc.stderr?.on('data', (data: Buffer) => {
      output += data.toString();
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(`Dashboard exited with code ${code}. Output: ${output}`));
      }
    });
  });
}

export function stopDashboard(): void {
  if (dashboardProcess) {
    dashboardProcess.kill('SIGTERM');
    dashboardProcess = null;
  }
}

export async function waitForServer(
  url: string,
  options: { timeout?: number; interval?: number } = {},
): Promise<void> {
  const { timeout = 30000, interval = 500 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Server at ${url} did not respond within ${timeout}ms`);
}

export function cleanupTmpDir(): void {
  if (existsSync(TMP_DIR)) {
    rmSync(TMP_DIR, { recursive: true, force: true });
  }
}

export function cleanupProject(name: string): void {
  const projectPath = join(TMP_DIR, name);
  if (existsSync(projectPath)) {
    rmSync(projectPath, { recursive: true, force: true });
  }
}

export function installDependencies(projectPath: string): void {
  const packageJsonPath = join(projectPath, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  delete packageJson.devDependencies['@supaslidev/dashboard'];
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

  execSync('pnpm install', {
    cwd: projectPath,
    stdio: 'inherit',
  });
}
