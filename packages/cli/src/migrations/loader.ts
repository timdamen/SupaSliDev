import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Migration, PresentationInfo } from './types.ts';
import { readManifest, validateManifest, getMigrationOrder } from './manifest.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface LoadedMigrations {
  migrations: Migration[];
  order: string[];
}

export interface LoadedInteractiveMigration {
  migration: Migration;
  getAffectedPresentations?: (workspaceDir: string) => PresentationInfo[];
}

export async function loadMigrations(): Promise<LoadedMigrations> {
  const migrationsDir = __dirname;
  const manifest = readManifest(migrationsDir);

  if (!manifest) {
    return { migrations: [], order: [] };
  }

  const errors = validateManifest(manifest);
  if (errors.length > 0) {
    throw new Error(`Invalid migrations manifest:\n${errors.join('\n')}`);
  }

  const order = getMigrationOrder(manifest);
  const migrations: Migration[] = [];

  for (const entry of manifest.migrations) {
    const modulePath = join(migrationsDir, `${entry.id}.js`);

    try {
      const module = await import(modulePath);
      const migration: Migration = {
        id: entry.id,
        description: entry.description,
        up: module.up,
        down: module.down,
      };
      migrations.push(migration);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ERR_MODULE_NOT_FOUND') {
        throw new Error(`Migration file not found for ${entry.id}: ${modulePath}`);
      }
      throw error;
    }
  }

  return { migrations, order };
}

export async function getMigrationById(id: string): Promise<Migration | null> {
  const { migrations } = await loadMigrations();
  return migrations.find((m) => m.id === id) ?? null;
}

export async function loadInteractiveMigration(
  id: string,
): Promise<LoadedInteractiveMigration | null> {
  const migrationsDir = __dirname;
  const manifest = readManifest(migrationsDir);

  if (!manifest) {
    return null;
  }

  const entry = manifest.migrations.find((m) => m.id === id);
  if (!entry) {
    return null;
  }

  const modulePath = join(migrationsDir, `${id}.js`);

  try {
    const module = await import(modulePath);
    return {
      migration: {
        id: entry.id,
        description: entry.description,
        up: module.up,
        down: module.down,
      },
      getAffectedPresentations: module.getAffectedPresentations,
    };
  } catch {
    return null;
  }
}
