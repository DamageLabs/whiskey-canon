import Database from 'better-sqlite3';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { runMigrations, Migration } from './migration-runner';

// Suppress console.log during tests
vi.spyOn(console, 'log').mockImplementation(() => {});

describe('migration-runner', () => {
  let db: InstanceType<typeof Database>;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
  });

  const testMigrations: Migration[] = [
    {
      name: '001_create_users',
      up(db) {
        db.exec(`
          CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL
          )
        `);
      },
      down(db) {
        db.exec('DROP TABLE IF EXISTS users');
      },
    },
    {
      name: '002_add_email',
      up(db) {
        db.exec('ALTER TABLE users ADD COLUMN email TEXT');
      },
    },
    {
      name: '003_create_posts',
      up(db) {
        db.exec(`
          CREATE TABLE posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            user_id INTEGER REFERENCES users(id)
          )
        `);
      },
    },
  ];

  describe('fresh database', () => {
    it('should create migrations table', () => {
      runMigrations(db, []);

      const table = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'")
        .get();
      expect(table).toBeTruthy();
    });

    it('should run all migrations in order', () => {
      runMigrations(db, testMigrations);

      const applied = db.prepare('SELECT name FROM migrations ORDER BY name').all() as {
        name: string;
      }[];
      expect(applied).toHaveLength(3);
      expect(applied[0].name).toBe('001_create_users');
      expect(applied[1].name).toBe('002_add_email');
      expect(applied[2].name).toBe('003_create_posts');
    });

    it('should apply schema changes', () => {
      runMigrations(db, testMigrations);

      // Users table should exist with both columns
      const userCols = db.prepare('PRAGMA table_info(users)').all() as { name: string }[];
      const colNames = userCols.map((c) => c.name);
      expect(colNames).toContain('id');
      expect(colNames).toContain('username');
      expect(colNames).toContain('email');

      // Posts table should exist
      const postCols = db.prepare('PRAGMA table_info(posts)').all() as { name: string }[];
      expect(postCols.length).toBeGreaterThan(0);
    });

    it('should record applied_at timestamp', () => {
      runMigrations(db, testMigrations);

      const row = db.prepare('SELECT applied_at FROM migrations LIMIT 1').get() as {
        applied_at: string;
      };
      expect(row.applied_at).toBeTruthy();
    });
  });

  describe('incremental migrations', () => {
    it('should only run pending migrations', () => {
      // Run first two
      runMigrations(db, testMigrations.slice(0, 2));

      let applied = db.prepare('SELECT name FROM migrations').all() as { name: string }[];
      expect(applied).toHaveLength(2);

      // Run all three — only the third should be new
      runMigrations(db, testMigrations);

      applied = db.prepare('SELECT name FROM migrations').all() as { name: string }[];
      expect(applied).toHaveLength(3);

      // Posts table should now exist
      const table = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='posts'")
        .get();
      expect(table).toBeTruthy();
    });

    it('should be idempotent when all migrations are applied', () => {
      runMigrations(db, testMigrations);
      runMigrations(db, testMigrations);

      const applied = db.prepare('SELECT name FROM migrations').all() as { name: string }[];
      expect(applied).toHaveLength(3);
    });
  });

  describe('bootstrap existing database', () => {
    it('should mark all migrations as applied when users table exists without migrations table', () => {
      // Simulate a pre-migration database: create users table directly
      db.exec('CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT)');

      runMigrations(db, testMigrations);

      // All migrations should be marked as applied
      const applied = db.prepare('SELECT name FROM migrations').all() as { name: string }[];
      expect(applied).toHaveLength(3);

      // But schema shouldn't have changed (no ALTER TABLE or new tables)
      const postTable = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='posts'")
        .get();
      expect(postTable).toBeFalsy();
    });

    it('should not bootstrap when migrations table already exists', () => {
      // Simulate a migrated database: users table + migrations table with partial history
      db.exec('CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT)');
      db.exec(
        'CREATE TABLE migrations (name TEXT PRIMARY KEY, applied_at DATETIME DEFAULT CURRENT_TIMESTAMP)'
      );
      // Mark first migration as already applied (schema already exists)
      db.prepare('INSERT INTO migrations (name) VALUES (?)').run('001_create_users');

      // Only migrations 002 and 003 should run
      runMigrations(db, testMigrations);

      const applied = db.prepare('SELECT name FROM migrations ORDER BY name').all() as {
        name: string;
      }[];
      expect(applied).toHaveLength(3);

      // Posts table should exist because migration 003 ran
      const postTable = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='posts'")
        .get();
      expect(postTable).toBeTruthy();

      // email column should exist because migration 002 ran
      const userCols = db.prepare('PRAGMA table_info(users)').all() as { name: string }[];
      expect(userCols.map((c) => c.name)).toContain('email');
    });
  });

  describe('transaction safety', () => {
    it('should rollback failed migration without recording it', () => {
      const badMigrations: Migration[] = [
        testMigrations[0],
        {
          name: '002_will_fail',
          up(db) {
            // This will fail — table doesn't exist
            db.exec('ALTER TABLE nonexistent ADD COLUMN foo TEXT');
          },
        },
      ];

      expect(() => runMigrations(db, badMigrations)).toThrow();

      // First migration should have been applied
      const applied = db.prepare('SELECT name FROM migrations').all() as { name: string }[];
      expect(applied).toHaveLength(1);
      expect(applied[0].name).toBe('001_create_users');
    });
  });

  describe('real migrations', () => {
    it('should build the full schema from all 16 migrations', async () => {
      const { allMigrations } = await import('../migrations');

      runMigrations(db, allMigrations);

      // Verify all 16 migrations applied
      const applied = db.prepare('SELECT name FROM migrations').all() as { name: string }[];
      expect(applied).toHaveLength(16);

      // Verify all 5 tables exist
      const tables = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'migrations' ORDER BY name"
        )
        .all() as { name: string }[];
      const tableNames = tables.map((t) => t.name);
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('whiskeys');
      expect(tableNames).toContain('whiskey_comments');
      expect(tableNames).toContain('backup_schedules');
      expect(tableNames).toContain('backups');

      // Verify users table has all columns
      const userCols = db.prepare('PRAGMA table_info(users)').all() as { name: string }[];
      const userColNames = userCols.map((c) => c.name);
      expect(userColNames).toContain('first_name');
      expect(userColNames).toContain('is_profile_public');
      expect(userColNames).toContain('password_reset_token');
      expect(userColNames).toContain('anthropic_api_key');

      // Verify whiskeys table has all 58 columns
      const whiskeyCols = db.prepare('PRAGMA table_info(whiskeys)').all() as { name: string }[];
      expect(whiskeyCols.length).toBe(58);
      const whiskeyColNames = whiskeyCols.map((c) => c.name);
      expect(whiskeyColNames).toContain('private_notes');
      expect(whiskeyColNames).toContain('is_investment_bottle');
      expect(whiskeyColNames).toContain('food_pairings');
      expect(whiskeyColNames).toContain('obtained_from');

      // Verify indexes were created
      const indexes = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        )
        .all() as { name: string }[];
      expect(indexes.length).toBe(14);
    });
  });
});
