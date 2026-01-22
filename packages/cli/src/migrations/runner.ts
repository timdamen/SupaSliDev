import type { Migration, MigrationContext, MigrationResult } from './types.ts';
import type { MigrationManifestEntry } from './manifest.ts';
import { getMigrationOrder, readManifest, validateManifest } from './manifest.ts';
import { createBackup, restoreBackup, deleteBackup } from './backup.ts';
import { addJournalEntry, createJournalEntry } from './journal.ts';
import { addMigration, hasMigration, readState } from '../state.ts';

export interface RunnerOptions {
  workspaceDir: string;
  migrationsDir: string;
  apply?: boolean;
  migrations?: Migration[];
}

export interface DryRunResult {
  migrationId: string;
  description: string;
  wouldApply: boolean;
  alreadyApplied: boolean;
  breaking?: boolean;
}

export interface RunResult {
  success: boolean;
  applied: MigrationResult[];
  skipped: string[];
  failed: MigrationResult | null;
  backupId: string | null;
  rolledBack: boolean;
}

function loadMigration(migrations: Migration[], id: string): Migration | null {
  return migrations.find((m) => m.id === id) ?? null;
}

export function dryRun(options: RunnerOptions): DryRunResult[] {
  const { workspaceDir, migrationsDir } = options;
  const results: DryRunResult[] = [];

  const manifest = readManifest(migrationsDir);
  if (!manifest) {
    throw new Error(`No migrations.json found in ${migrationsDir}`);
  }

  const errors = validateManifest(manifest);
  if (errors.length > 0) {
    throw new Error(`Invalid migrations.json:\n${errors.join('\n')}`);
  }

  const order = getMigrationOrder(manifest);
  const manifestMap = new Map<string, MigrationManifestEntry>(
    manifest.migrations.map((m) => [m.id, m]),
  );

  for (const id of order) {
    const entry = manifestMap.get(id);
    if (!entry) continue;

    const alreadyApplied = hasMigration(workspaceDir, id);

    results.push({
      migrationId: id,
      description: entry.description,
      wouldApply: !alreadyApplied,
      alreadyApplied,
      breaking: entry.breaking,
    });
  }

  return results;
}

export function formatDryRunOutput(results: DryRunResult[]): string {
  const lines: string[] = [];

  lines.push('Migration Preview (Dry Run)');
  lines.push('='.repeat(50));
  lines.push('');

  const toApply = results.filter((r) => r.wouldApply);
  const alreadyApplied = results.filter((r) => r.alreadyApplied);

  if (toApply.length === 0) {
    lines.push('No migrations to apply. Workspace is up to date.');
  } else {
    lines.push(`Migrations to apply: ${toApply.length}`);
    lines.push('');

    for (const result of toApply) {
      const breakingTag = result.breaking ? ' [BREAKING]' : '';
      lines.push(`  → ${result.migrationId}${breakingTag}`);
      lines.push(`    ${result.description}`);
    }
  }

  if (alreadyApplied.length > 0) {
    lines.push('');
    lines.push(`Already applied: ${alreadyApplied.length}`);
    for (const result of alreadyApplied) {
      lines.push(`  ✓ ${result.migrationId}`);
    }
  }

  lines.push('');
  lines.push('Run with --apply to execute migrations.');

  return lines.join('\n');
}

async function executeMigration(
  migration: Migration,
  context: MigrationContext,
): Promise<MigrationResult> {
  try {
    await migration.up(context);
    return {
      migrationId: migration.id,
      success: true,
      rolledBack: false,
    };
  } catch (error) {
    return {
      migrationId: migration.id,
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
      rolledBack: false,
    };
  }
}

export async function run(options: RunnerOptions): Promise<RunResult> {
  const { workspaceDir, migrationsDir, apply = false, migrations = [] } = options;

  if (!apply) {
    const dryRunResults = dryRun(options);

    return {
      success: true,
      applied: [],
      skipped: dryRunResults.filter((r) => r.alreadyApplied).map((r) => r.migrationId),
      failed: null,
      backupId: null,
      rolledBack: false,
    };
  }

  const manifest = readManifest(migrationsDir);
  if (!manifest) {
    throw new Error(`No migrations.json found in ${migrationsDir}`);
  }

  const errors = validateManifest(manifest);
  if (errors.length > 0) {
    throw new Error(`Invalid migrations.json:\n${errors.join('\n')}`);
  }

  const order = getMigrationOrder(manifest);
  const toApply = order.filter((id) => !hasMigration(workspaceDir, id));

  if (toApply.length === 0) {
    return {
      success: true,
      applied: [],
      skipped: order,
      failed: null,
      backupId: null,
      rolledBack: false,
    };
  }

  const backupId = createBackup(workspaceDir);

  const state = readState(workspaceDir);
  if (!state) {
    throw new Error('State file not found. Is this a supaSliDev workspace?');
  }

  const context: MigrationContext = {
    workspaceDir,
    state,
    backupPath: backupId,
  };

  const applied: MigrationResult[] = [];
  let failed: MigrationResult | null = null;
  let rolledBack = false;

  for (const id of toApply) {
    const migration = loadMigration(migrations, id);
    if (!migration) {
      failed = {
        migrationId: id,
        success: false,
        error: new Error(`Migration implementation not found: ${id}`),
        rolledBack: false,
      };
      break;
    }

    const result = await executeMigration(migration, context);

    if (result.success) {
      applied.push(result);
      addMigration(workspaceDir, id);

      const journalEntry = createJournalEntry(id, backupId, true, false);
      addJournalEntry(workspaceDir, journalEntry);
    } else {
      failed = result;

      const journalEntry = createJournalEntry(id, backupId, false, false, result.error);
      addJournalEntry(workspaceDir, journalEntry);

      break;
    }
  }

  if (failed) {
    restoreBackup(workspaceDir, backupId);
    rolledBack = true;

    const rollbackEntry = createJournalEntry(
      failed.migrationId,
      backupId,
      false,
      true,
      failed.error,
    );
    addJournalEntry(workspaceDir, rollbackEntry);

    failed.rolledBack = true;
  } else {
    deleteBackup(workspaceDir, backupId);
  }

  const skipped = order.filter(
    (id) =>
      !toApply.includes(id) ||
      (!applied.some((a) => a.migrationId === id) && failed?.migrationId !== id),
  );

  return {
    success: !failed,
    applied,
    skipped,
    failed,
    backupId: failed ? backupId : null,
    rolledBack,
  };
}

export function formatRunOutput(result: RunResult): string {
  const lines: string[] = [];

  if (result.success) {
    lines.push('Migration Complete');
    lines.push('='.repeat(50));
    lines.push('');

    if (result.applied.length === 0) {
      lines.push('No migrations were applied. Workspace is up to date.');
    } else {
      lines.push(`Applied ${result.applied.length} migration(s):`);
      for (const migration of result.applied) {
        lines.push(`  ✓ ${migration.migrationId}`);
      }
    }

    if (result.skipped.length > 0) {
      lines.push('');
      lines.push(`Skipped ${result.skipped.length} (already applied):`);
      for (const id of result.skipped) {
        lines.push(`  - ${id}`);
      }
    }
  } else {
    lines.push('Migration Failed');
    lines.push('='.repeat(50));
    lines.push('');

    if (result.failed) {
      lines.push(`Failed migration: ${result.failed.migrationId}`);
      if (result.failed.error) {
        lines.push(`Error: ${result.failed.error.message}`);
      }
    }

    if (result.rolledBack) {
      lines.push('');
      lines.push('Workspace has been restored from backup.');
      if (result.backupId) {
        lines.push(`Backup preserved: ${result.backupId}`);
      }
    }

    if (result.applied.length > 0) {
      lines.push('');
      lines.push(`Rolled back ${result.applied.length} migration(s):`);
      for (const migration of result.applied) {
        lines.push(`  ↩ ${migration.migrationId}`);
      }
    }
  }

  return lines.join('\n');
}
