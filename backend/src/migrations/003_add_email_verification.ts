import { Migration } from '../utils/migration-runner';

export const migration: Migration = {
  name: '003_add_email_verification',
  up(db) {
    db.exec('ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0');
    db.exec('ALTER TABLE users ADD COLUMN verification_code TEXT');
    db.exec('ALTER TABLE users ADD COLUMN verification_code_expires_at TEXT');
    db.exec('ALTER TABLE users ADD COLUMN verification_code_attempts INTEGER DEFAULT 0');
  },
};
