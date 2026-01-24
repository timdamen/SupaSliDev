import type { StateSchema } from '../state.ts';

export interface MigrationContext {
  workspaceDir: string;
  state: StateSchema;
  backupPath: string | null;
  options?: Record<string, unknown>;
}

export interface PresentationInfo {
  name: string;
  path: string;
  currentVersion: string;
}

export interface InteractiveMigration {
  id: string;
  description: string;
  getAffectedPresentations: (workspaceDir: string) => PresentationInfo[];
  up: (context: MigrationContext) => Promise<void>;
  down?: (context: MigrationContext) => Promise<void>;
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
