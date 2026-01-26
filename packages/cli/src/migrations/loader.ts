import type { Migration, MigrationContext, PresentationInfo } from './types.ts';

export interface LoadedMigrations {
  migrations: Migration[];
  order: string[];
}

export interface LoadedInteractiveMigration {
  migration: Migration;
  getAffectedPresentations?: (workspaceDir: string) => PresentationInfo[];
}

interface MigrationModule {
  up: (context: MigrationContext) => Promise<void>;
  down?: (context: MigrationContext) => Promise<void>;
  getAffectedPresentations?: (workspaceDir: string) => PresentationInfo[];
}

interface MigrationEntry {
  id: string;
  description: string;
  module: MigrationModule;
}

const MIGRATIONS: MigrationEntry[] = [];

export async function loadMigrations(): Promise<LoadedMigrations> {
  const migrations: Migration[] = MIGRATIONS.map((entry) => ({
    id: entry.id,
    description: entry.description,
    up: entry.module.up,
    down: entry.module.down,
  }));

  const order = MIGRATIONS.map((entry) => entry.id);

  return { migrations, order };
}

export async function getMigrationById(id: string): Promise<Migration | null> {
  const { migrations } = await loadMigrations();
  return migrations.find((m) => m.id === id) ?? null;
}

export async function loadInteractiveMigration(
  id: string,
): Promise<LoadedInteractiveMigration | null> {
  const entry = MIGRATIONS.find((m) => m.id === id);
  if (!entry) {
    return null;
  }

  return {
    migration: {
      id: entry.id,
      description: entry.description,
      up: entry.module.up,
      down: entry.module.down,
    },
    getAffectedPresentations: entry.module.getAffectedPresentations,
  };
}
