import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { JournalEntry } from './types.ts';

const JOURNAL_DIR = '.supaslidev';
const JOURNAL_FILE = 'migration-journal.json';

interface JournalSchema {
  entries: JournalEntry[];
}

function getJournalPath(workspaceDir: string): string {
  return join(workspaceDir, JOURNAL_DIR, JOURNAL_FILE);
}

function getJournalDir(workspaceDir: string): string {
  return join(workspaceDir, JOURNAL_DIR);
}

function ensureJournalDir(workspaceDir: string): void {
  const journalDir = getJournalDir(workspaceDir);

  if (!existsSync(journalDir)) {
    mkdirSync(journalDir, { recursive: true });
  }
}

export function readJournal(workspaceDir: string): JournalSchema {
  const journalPath = getJournalPath(workspaceDir);

  if (!existsSync(journalPath)) {
    return { entries: [] };
  }

  const content = readFileSync(journalPath, 'utf-8');
  return JSON.parse(content) as JournalSchema;
}

export function writeJournal(workspaceDir: string, journal: JournalSchema): void {
  ensureJournalDir(workspaceDir);

  const journalPath = getJournalPath(workspaceDir);
  writeFileSync(journalPath, JSON.stringify(journal, null, 2) + '\n', 'utf-8');
}

export function addJournalEntry(workspaceDir: string, entry: JournalEntry): void {
  const journal = readJournal(workspaceDir);
  journal.entries.push(entry);
  writeJournal(workspaceDir, journal);
}

export function createJournalEntry(
  migrationId: string,
  backupId: string | null,
  success: boolean,
  rolledBack: boolean = false,
  error?: Error,
): JournalEntry {
  return {
    migrationId,
    appliedAt: new Date().toISOString(),
    backupId,
    success,
    rolledBack,
    error: error?.message,
  };
}

export function getJournalEntries(workspaceDir: string): JournalEntry[] {
  const journal = readJournal(workspaceDir);
  return journal.entries;
}

export function getLastSuccessfulEntry(workspaceDir: string): JournalEntry | null {
  const entries = getJournalEntries(workspaceDir);
  const successful = entries.filter((e) => e.success && !e.rolledBack);
  return successful.length > 0 ? successful[successful.length - 1] : null;
}

export function getMigrationHistory(workspaceDir: string, migrationId: string): JournalEntry[] {
  const entries = getJournalEntries(workspaceDir);
  return entries.filter((e) => e.migrationId === migrationId);
}

export function wasMigrationSuccessful(workspaceDir: string, migrationId: string): boolean {
  const history = getMigrationHistory(workspaceDir, migrationId);
  const lastEntry = history[history.length - 1];
  return lastEntry?.success === true && !lastEntry.rolledBack;
}

export function getFailedMigrations(workspaceDir: string): JournalEntry[] {
  const entries = getJournalEntries(workspaceDir);
  return entries.filter((e) => !e.success || e.rolledBack);
}

export function clearJournal(workspaceDir: string): void {
  writeJournal(workspaceDir, { entries: [] });
}
