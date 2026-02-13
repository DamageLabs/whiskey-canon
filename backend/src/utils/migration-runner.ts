import { Database as DatabaseType } from 'better-sqlite3';

export interface Migration {
  name: string;
  up: (db: DatabaseType) => void;
  down?: (db: DatabaseType) => void;
}

const MIGRATIONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS migrations (
    name TEXT PRIMARY KEY,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

/**
 * Run all pending migrations against the given database.
 *
 * For existing pre-migration databases (users table exists but migrations
 * table does not), all provided migrations are marked as already applied
 * so that no destructive re-run occurs.
 */
export function runMigrations(db: DatabaseType, migrations: Migration[]): void {
  // Detect existing pre-migration database
  const usersTableExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    .get();
  const migrationsTableExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'")
    .get();

  // Create migrations tracking table
  db.exec(MIGRATIONS_TABLE_SQL);

  // Bootstrap: existing database without migration tracking
  if (usersTableExists && !migrationsTableExists) {
    const insert = db.prepare('INSERT INTO migrations (name) VALUES (?)');
    db.transaction(() => {
      for (const migration of migrations) {
        insert.run(migration.name);
      }
    })();
    console.log(`Bootstrapped ${migrations.length} existing migrations`);
    return;
  }

  // Get already-applied migrations
  const applied = db.prepare('SELECT name FROM migrations').all() as { name: string }[];
  const appliedNames = new Set(applied.map((m) => m.name));

  // Run pending migrations in order
  let count = 0;
  for (const migration of migrations) {
    if (appliedNames.has(migration.name)) continue;

    db.transaction(() => {
      migration.up(db);
      db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migration.name);
    })();

    console.log(`Applied migration: ${migration.name}`);
    count++;
  }

  if (count > 0) {
    console.log(`Applied ${count} migration(s)`);
  }
}
