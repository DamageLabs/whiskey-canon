import { Migration } from '../utils/migration-runner';

export const migration: Migration = {
  name: '019_add_admin_backup_schedules',
  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS admin_backup_schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        interval TEXT NOT NULL DEFAULT 'disabled',
        retention_days INTEGER DEFAULT 30,
        last_run_at DATETIME,
        next_run_at DATETIME
      )
    `);
  },
  down(db) {
    db.exec('DROP TABLE IF EXISTS admin_backup_schedules');
  },
};
