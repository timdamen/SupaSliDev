import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, relative } from 'node:path';
import type { BackupMetadata } from './types.ts';
import { readState } from '../state.ts';

const BACKUP_DIR = '.supaslidev/backups';
const BACKUP_METADATA_FILE = 'backup.json';

const EXCLUDED_PATTERNS = [
  'node_modules',
  '.git',
  '.supaslidev/backups',
  'dist',
  '.turbo',
  '.cache',
];

function getBackupDir(workspaceDir: string): string {
  return join(workspaceDir, BACKUP_DIR);
}

function getBackupPath(workspaceDir: string, backupId: string): string {
  return join(getBackupDir(workspaceDir), backupId);
}

function generateBackupId(): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('Z', '');
  return `backup-${timestamp}`;
}

function shouldExclude(relativePath: string): boolean {
  return EXCLUDED_PATTERNS.some(
    (pattern) => relativePath === pattern || relativePath.startsWith(`${pattern}/`),
  );
}

function collectFiles(dir: string, baseDir: string): string[] {
  const files: string[] = [];

  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = relative(baseDir, fullPath);

    if (shouldExclude(relativePath)) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files;
}

export function createBackup(workspaceDir: string): string {
  const state = readState(workspaceDir);

  if (!state) {
    throw new Error('State file not found. Is this a Supaslidev workspace?');
  }

  const backupId = generateBackupId();
  const backupPath = getBackupPath(workspaceDir, backupId);

  mkdirSync(backupPath, { recursive: true });

  const files = collectFiles(workspaceDir, workspaceDir);

  for (const file of files) {
    const sourcePath = join(workspaceDir, file);
    const destPath = join(backupPath, 'files', file);
    const destDir = join(destPath, '..');

    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }

    cpSync(sourcePath, destPath);
  }

  const metadata: BackupMetadata = {
    backupId,
    createdAt: new Date().toISOString(),
    workspaceDir,
    cliVersion: state.cliVersion,
    files,
  };

  writeFileSync(
    join(backupPath, BACKUP_METADATA_FILE),
    JSON.stringify(metadata, null, 2) + '\n',
    'utf-8',
  );

  return backupId;
}

export function restoreBackup(workspaceDir: string, backupId: string): void {
  const backupPath = getBackupPath(workspaceDir, backupId);
  const metadataPath = join(backupPath, BACKUP_METADATA_FILE);

  if (!existsSync(metadataPath)) {
    throw new Error(`Backup not found: ${backupId}`);
  }

  const metadata: BackupMetadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));

  for (const file of metadata.files) {
    const sourcePath = join(backupPath, 'files', file);
    const destPath = join(workspaceDir, file);

    if (existsSync(sourcePath)) {
      const destDir = join(destPath, '..');

      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }

      cpSync(sourcePath, destPath);
    }
  }
}

export function deleteBackup(workspaceDir: string, backupId: string): void {
  const backupPath = getBackupPath(workspaceDir, backupId);

  if (existsSync(backupPath)) {
    rmSync(backupPath, { recursive: true, force: true });
  }
}

export function listBackups(workspaceDir: string): BackupMetadata[] {
  const backupDir = getBackupDir(workspaceDir);

  if (!existsSync(backupDir)) {
    return [];
  }

  const entries = readdirSync(backupDir, { withFileTypes: true });
  const backups: BackupMetadata[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const metadataPath = join(backupDir, entry.name, BACKUP_METADATA_FILE);

    if (existsSync(metadataPath)) {
      const metadata: BackupMetadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));
      backups.push(metadata);
    }
  }

  return backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getBackupMetadata(workspaceDir: string, backupId: string): BackupMetadata | null {
  const backupPath = getBackupPath(workspaceDir, backupId);
  const metadataPath = join(backupPath, BACKUP_METADATA_FILE);

  if (!existsSync(metadataPath)) {
    return null;
  }

  return JSON.parse(readFileSync(metadataPath, 'utf-8'));
}

export function backupExists(workspaceDir: string, backupId: string): boolean {
  const metadataPath = join(getBackupPath(workspaceDir, backupId), BACKUP_METADATA_FILE);
  return existsSync(metadataPath);
}
