import { Migration } from '../utils/migration-runner';

export const migration: Migration = {
  name: '004_add_password_reset',
  up(db) {
    db.exec('ALTER TABLE users ADD COLUMN password_reset_token TEXT');
    db.exec('ALTER TABLE users ADD COLUMN password_reset_expires_at TEXT');
  },
};
