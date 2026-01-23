import { spawn, ChildProcess, execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit, Browser, BrowserType } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '../../..');
const TMP_DIR = join(ROOT_DIR, '.tmp');
const CLI_PATH = join(ROOT_DIR, 'packages/cli/src/cli.ts');
const IS_WINDOWS = process.platform === 'win32';

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

  try {
    execSync(
      `npx tsx ${CLI_PATH} create --name ${name} --presentation test-deck --no-git --no-install`,
      {
        cwd: TMP_DIR,
        stdio: 'pipe',
        shell: true,
      },
    );
  } catch (error) {
    const execError = error as { stdout?: string; stderr?: string; message?: string };
    throw new Error(
      `Failed to scaffold project: ${execError.message}\nstdout: ${execError.stdout}\nstderr: ${execError.stderr}`,
    );
  }

  if (!existsSync(join(projectPath, 'package.json'))) {
    throw new Error(
      `Scaffolding did not create expected files at ${projectPath}. Directory exists: ${existsSync(projectPath)}`,
    );
  }

  return projectPath;
}

export interface DashboardInfo {
  url: string;
  process: ChildProcess;
}

export async function startDashboard(projectPath: string): Promise<DashboardInfo> {
  const dashboardCliPath = join(ROOT_DIR, 'packages/supaslidev/src/cli/index.ts');

  return new Promise((resolve, reject) => {
    const proc = spawn('npx', ['tsx', dashboardCliPath, 'dev'], {
      cwd: projectPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
      shell: true,
      detached: !IS_WINDOWS,
    });

    dashboardProcess = proc;

    let output = '';
    let resolved = false;
    const stripAnsi = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, '');
    const urlPattern = /Local:\s+(https?:\/\/localhost:\d+\/?)/;

    const timeout = setTimeout(() => {
      if (!resolved && proc.pid) {
        killProcessTree(proc.pid);
        reject(new Error(`Dashboard startup timed out. Output: ${stripAnsi(output)}`));
      }
    }, 60000);

    const handleOutput = (data: Buffer) => {
      if (resolved) return;
      output += data.toString();
      const cleanOutput = stripAnsi(output);
      const match = cleanOutput.match(urlPattern);
      if (match) {
        resolved = true;
        clearTimeout(timeout);
        resolve({ url: match[1].replace(/\/$/, ''), process: proc });
      }
    };

    proc.stdout?.on('data', handleOutput);
    proc.stderr?.on('data', handleOutput);

    proc.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(err);
      }
    });

    proc.on('close', (code) => {
      if (!resolved && code !== 0) {
        resolved = true;
        clearTimeout(timeout);
        reject(new Error(`Dashboard exited with code ${code}. Output: ${stripAnsi(output)}`));
      }
    });
  });
}

function killProcessTree(pid: number): void {
  if (IS_WINDOWS) {
    try {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
    } catch {
      // Process may have already exited
    }
  } else {
    try {
      process.kill(-pid, 'SIGTERM');
    } catch {
      try {
        process.kill(pid, 'SIGTERM');
      } catch {
        // Process may have already exited
      }
    }
  }
}

export function stopDashboard(): void {
  if (dashboardProcess && dashboardProcess.pid) {
    killProcessTree(dashboardProcess.pid);
    dashboardProcess = null;
  }
}

export async function stopDashboardAsync(): Promise<void> {
  if (dashboardProcess && dashboardProcess.pid) {
    const proc = dashboardProcess;
    const pid = dashboardProcess.pid!;
    dashboardProcess = null;

    killProcessTree(pid);

    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => resolve(), 5000);
      proc.on('exit', () => {
        clearTimeout(timeout);
        resolve();
      });
      proc.on('close', () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    if (IS_WINDOWS) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
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

function rmSyncWithRetry(path: string, retries = 3, delay = 1000): void {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      rmSync(path, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
      return;
    } catch (error) {
      const isLastAttempt = attempt === retries - 1;
      const isWindowsLockError =
        IS_WINDOWS &&
        error instanceof Error &&
        'code' in error &&
        (error.code === 'EBUSY' || error.code === 'EPERM');

      if (isLastAttempt || !isWindowsLockError) {
        throw error;
      }

      const sleepSync = (ms: number) => {
        const end = Date.now() + ms;
        while (Date.now() < end) {
          // Busy wait
        }
      };
      sleepSync(delay);
    }
  }
}

export function cleanupTmpDir(): void {
  if (existsSync(TMP_DIR)) {
    rmSyncWithRetry(TMP_DIR);
  }
}

export function cleanupProject(name: string): void {
  const projectPath = join(TMP_DIR, name);
  if (existsSync(projectPath)) {
    rmSyncWithRetry(projectPath);
  }
}

export function installDependencies(projectPath: string): void {
  const packageJsonPath = join(projectPath, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  if (packageJson.devDependencies?.['@supaslidev/dashboard']) {
    delete packageJson.devDependencies['@supaslidev/dashboard'];
  }
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

  execSync('pnpm install', {
    cwd: projectPath,
    stdio: 'inherit',
  });
}

export type BrowserName = 'chromium' | 'firefox' | 'webkit';

const browsers: Record<BrowserName, BrowserType> = { chromium, firefox, webkit };

export function getBrowserType(): BrowserType {
  const browserName = (
    process.env.PLAYWRIGHT_BROWSER ||
    process.env.BROWSER ||
    'chromium'
  ).toLowerCase();
  const browserType = browsers[browserName as BrowserName];

  if (!browserType) {
    throw new Error(
      `Unknown browser: "${browserName}". Allowed values: ${Object.keys(browsers).join(', ')}`,
    );
  }

  return browserType;
}

export async function launchBrowser(): Promise<Browser> {
  const browserType = getBrowserType();
  return browserType.launch();
}
