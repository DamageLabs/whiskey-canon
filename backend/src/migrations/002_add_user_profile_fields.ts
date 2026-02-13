import { Migration } from '../utils/migration-runner';

export const migration: Migration = {
  name: '002_add_user_profile_fields',
  up(db) {
    db.exec('ALTER TABLE users ADD COLUMN first_name TEXT');
    db.exec('ALTER TABLE users ADD COLUMN last_name TEXT');
    db.exec('ALTER TABLE users ADD COLUMN profile_photo TEXT');
  },
};
