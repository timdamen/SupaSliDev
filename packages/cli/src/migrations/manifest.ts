import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MIGRATIONS_MANIFEST_FILE = 'migrations.json';

export interface MigrationManifestEntry {
  id: string;
  description: string;
  version: string;
  breaking?: boolean;
  dependencies?: string[];
}

export interface MigrationsManifest {
  version: string;
  migrations: MigrationManifestEntry[];
}

export function readManifest(migrationsDir: string): MigrationsManifest | null {
  const manifestPath = join(migrationsDir, MIGRATIONS_MANIFEST_FILE);

  if (!existsSync(manifestPath)) {
    return null;
  }

  const content = readFileSync(manifestPath, 'utf-8');
  return JSON.parse(content) as MigrationsManifest;
}

export function writeManifest(migrationsDir: string, manifest: MigrationsManifest): void {
  const manifestPath = join(migrationsDir, MIGRATIONS_MANIFEST_FILE);
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
}

export function createEmptyManifest(): MigrationsManifest {
  return {
    version: '1.0.0',
    migrations: [],
  };
}

export function validateManifest(manifest: MigrationsManifest): string[] {
  const errors: string[] = [];

  if (!manifest.version) {
    errors.push('Manifest missing version field');
  }

  if (!Array.isArray(manifest.migrations)) {
    errors.push('Manifest migrations field must be an array');
    return errors;
  }

  const ids = new Set<string>();

  for (const migration of manifest.migrations) {
    if (!migration.id) {
      errors.push('Migration entry missing id field');
      continue;
    }

    if (ids.has(migration.id)) {
      errors.push(`Duplicate migration id: ${migration.id}`);
    }
    ids.add(migration.id);

    if (!migration.description) {
      errors.push(`Migration ${migration.id} missing description field`);
    }

    if (!migration.version) {
      errors.push(`Migration ${migration.id} missing version field`);
    }

    if (migration.dependencies) {
      for (const dep of migration.dependencies) {
        if (!ids.has(dep)) {
          const depExists = manifest.migrations.some((m) => m.id === dep);
          if (!depExists) {
            errors.push(`Migration ${migration.id} has unknown dependency: ${dep}`);
          }
        }
      }
    }
  }

  return errors;
}

export function getMigrationOrder(manifest: MigrationsManifest): string[] {
  const visited = new Set<string>();
  const order: string[] = [];
  const migrationMap = new Map(manifest.migrations.map((m) => [m.id, m]));

  function visit(id: string, path: Set<string>): void {
    if (visited.has(id)) return;

    if (path.has(id)) {
      throw new Error(`Circular dependency detected involving migration: ${id}`);
    }

    const migration = migrationMap.get(id);
    if (!migration) return;

    path.add(id);

    for (const dep of migration.dependencies ?? []) {
      visit(dep, path);
    }

    path.delete(id);
    visited.add(id);
    order.push(id);
  }

  for (const migration of manifest.migrations) {
    visit(migration.id, new Set());
  }

  return order;
}
