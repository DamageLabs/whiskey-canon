import { Migration } from '../utils/migration-runner';

export const migration: Migration = {
  name: '014_add_backup_tables',
  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS backup_schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        interval TEXT NOT NULL DEFAULT 'weekly',
        format TEXT NOT NULL DEFAULT 'json',
        retention_days INTEGER DEFAULT 30,
        last_run_at DATETIME,
        next_run_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS backups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        format TEXT NOT NULL,
        trigger_type TEXT NOT NULL,
        size_bytes INTEGER,
        whiskey_count INTEGER,
        comment_count INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  },
  down(db) {
    db.exec('DROP TABLE IF EXISTS backups');
    db.exec('DROP TABLE IF EXISTS backup_schedules');
  },
};
