import { Migration } from '../utils/migration-runner';

export const migration: Migration = {
  name: '008_add_cask_details',
  up(db) {
    db.exec('ALTER TABLE whiskeys ADD COLUMN cask_type TEXT');
    db.exec('ALTER TABLE whiskeys ADD COLUMN cask_finish TEXT');
    db.exec('ALTER TABLE whiskeys ADD COLUMN barrel_number TEXT');
    db.exec('ALTER TABLE whiskeys ADD COLUMN bottle_number TEXT');
    db.exec('ALTER TABLE whiskeys ADD COLUMN vintage_year TEXT');
    db.exec('ALTER TABLE whiskeys ADD COLUMN bottled_date TEXT');
  },
};
