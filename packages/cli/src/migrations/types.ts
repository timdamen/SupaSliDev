import type { StateSchema } from '../state.ts';

export interface MigrationContext {
  workspaceDir: string;
  state: StateSchema;
  backupPath: string | null;
}

export interface Migration {
  id: string;
  description: string;
  up: (context: MigrationContext) => Promise<void>;
  down?: (context: MigrationContext) => Promise<void>;
}

export interface MigrationResult {
  migrationId: string;
  success: boolean;
  error?: Error;
  rolledBack: boolean;
}

export interface BackupMetadata {
  backupId: string;
  createdAt: string;
  workspaceDir: string;
  cliVersion: string;
  files: string[];
}

export interface JournalEntry {
  migrationId: string;
  appliedAt: string;
  backupId: string | null;
  success: boolean;
  rolledBack: boolean;
  error?: string;
}
