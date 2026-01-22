import pc from 'picocolors';
import { readState, findWorkspaceRoot } from '../state.js';
import { readManifest } from '../migrations/manifest.js';
import { hasMigration } from '../state.js';
import { join } from 'node:path';
import { CLI_VERSION, fetchLatestVersion, compareVersions } from '../version.js';

export interface StatusResult {
  cliVersion: string;
  stateVersion: string | null;
  createdAt: string | null;
  lastUpdatedAt: string | null;
  pendingMigrations: number;
  latestVersion: string | null;
  updateAvailable: boolean;
}

function getPendingMigrationsCount(workspaceDir: string): number {
  const migrationsDir = join(workspaceDir, '.supaslidev', 'migrations');
  const manifest = readManifest(migrationsDir);

  if (!manifest) {
    return 0;
  }

  return manifest.migrations.filter((m) => !hasMigration(workspaceDir, m.id)).length;
}

export async function getStatus(workspaceDir?: string): Promise<StatusResult> {
  const resolvedDir = workspaceDir ?? findWorkspaceRoot() ?? process.cwd();
  const state = readState(resolvedDir);

  const latestVersion = await fetchLatestVersion();
  const updateAvailable = latestVersion ? compareVersions(CLI_VERSION, latestVersion) : false;

  return {
    cliVersion: CLI_VERSION,
    stateVersion: state?.cliVersion ?? null,
    createdAt: state?.createdAt ?? null,
    lastUpdatedAt: state?.lastUpdatedAt ?? null,
    pendingMigrations: state ? getPendingMigrationsCount(resolvedDir) : 0,
    latestVersion,
    updateAvailable,
  };
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatStatus(status: StatusResult): string {
  const lines: string[] = [];

  lines.push(pc.bold('supaSliDev Status'));
  lines.push('─'.repeat(40));
  lines.push('');

  lines.push(`${pc.dim('CLI Version:')}      ${status.cliVersion}`);

  if (status.stateVersion) {
    lines.push(`${pc.dim('State Version:')}    ${status.stateVersion}`);
  } else {
    lines.push(`${pc.dim('State Version:')}    ${pc.yellow('Not initialized')}`);
  }

  lines.push('');

  if (status.createdAt) {
    lines.push(`${pc.dim('Created:')}          ${formatDate(status.createdAt)}`);
  }

  if (status.lastUpdatedAt) {
    lines.push(`${pc.dim('Last Updated:')}     ${formatDate(status.lastUpdatedAt)}`);
  }

  lines.push('');

  if (status.pendingMigrations > 0) {
    lines.push(`${pc.dim('Pending Migrations:')} ${pc.yellow(String(status.pendingMigrations))}`);
  } else {
    lines.push(`${pc.dim('Pending Migrations:')} ${pc.green('0')}`);
  }

  lines.push('');

  if (status.updateAvailable && status.latestVersion) {
    lines.push(pc.yellow(`Update available: ${status.cliVersion} → ${status.latestVersion}`));
    lines.push(pc.dim('  Run `pnpm add -g @supaslidev/cli` to update'));
  } else if (status.latestVersion) {
    lines.push(pc.green('✓ CLI is up to date'));
  } else {
    lines.push(pc.dim('Could not check for updates'));
  }

  return lines.join('\n');
}

export async function status(workspaceDir?: string): Promise<void> {
  const result = await getStatus(workspaceDir);
  console.log(formatStatus(result));
}
