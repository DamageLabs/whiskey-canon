import { Migration } from '../utils/migration-runner';

export const migration: Migration = {
  name: '005_add_profile_visibility',
  up(db) {
    db.exec('ALTER TABLE users ADD COLUMN is_profile_public INTEGER DEFAULT 0');
  },
};
